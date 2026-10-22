import { Request, Response } from "express";
import { Types } from "mongoose";
import { ResponseModel } from "../models/response.model";
import { sendResponse, buildErrorResponse } from "../utils/response.util";
import { Order } from "../models/order.model";
import { Cart } from "../models/cart.model";
import { Product } from "../models/product.model";
import { Store } from "../models/store.model";
import { Address } from "../models/address.model";
import { User } from "../models/user.model";
import { Coupon } from "../models/coupon.model";
import { AppError } from "../utils/AppError";
import { computeBill } from "../services/pricing.service";
import { reserveStock, restoreStock } from "../services/stock.service";
import { getCartView } from "../services/cart.service";
import { validateTransition } from "../services/order.service";
import { generateOrderNumber } from "../utils/orderNumber.util";
import { haversineDistance, isStoreOpen } from "../utils/geo.util";
import {
  parsePagination,
  buildPaginationResponse,
} from "../utils/pagination.util";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
} from "../constants/enums";

export const createOrder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 201,
    showMessage: true,
    message: "",
  };
  try {
    const userId = req.user!.id;
    const storeId = req.storeId!;

    const idempotencyKey =
      (req.headers["idempotency-key"] as string) || undefined;
    if (idempotencyKey) {
      const existing = await Order.findOne({
        idempotencyKey,
        userId,
      });
      if (existing) {
        response.statusCode = 200;
        response.data = existing;
        response.message = "Order already placed";
        return sendResponse(response, res);
      }
    }

    const store = await Store.findOne({ _id: storeId, isActive: true });
    if (!store) {
      throw new AppError("Store not found or inactive", 422);
    }

    if (!isStoreOpen(store.opensAt, store.closesAt, store.timezone)) {
      throw new AppError("Store is currently closed", 422);
    }

    let deliveryAddress: {
      label?: string;
      addressLine: string;
      landmark?: string;
      coordinates: { lat: number; lng: number };
    };

    if (req.body.addressId) {
      const addr = await Address.findOne({
        _id: req.body.addressId,
        userId,
        isDeleted: false,
      });
      if (!addr) {
        throw new AppError("Address not found", 404);
      }
      deliveryAddress = {
        label: addr.label,
        addressLine: addr.addressLine,
        landmark: addr.landmark,
        coordinates: {
          lat: addr.coordinates.lat,
          lng: addr.coordinates.lng,
        },
      };
    } else {
      deliveryAddress = req.body.deliveryAddress;
    }

    const distance = haversineDistance(
      deliveryAddress.coordinates.lat,
      deliveryAddress.coordinates.lng,
      store.location.coordinates[1],
      store.location.coordinates[0]
    );
    // if (distance > store.deliveryRadiusKm) {
    //   throw new AppError("Address is not serviceable by this store", 422);
    // }

    let orderItems: { productId: string; quantity: number }[];

    if (req.body.items && req.body.items.length > 0) {
      orderItems = req.body.items;
    } else {
      const cart = await Cart.findOne({ userId, storeId });
      if (!cart || cart.items.length === 0) {
        throw new AppError("Cart is empty", 400);
      }
      orderItems = cart.items.map((i) => ({
        productId: i.productId.toString(),
        quantity: i.quantity,
      }));
    }

    const productIds = orderItems.map((i) => i.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      storeId,
      isAvailable: true,
      isDeleted: false,
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p._id.toString()));
      const missing = productIds.filter((id) => !foundIds.has(id));
      throw new AppError(
        `Products not available: ${missing.join(", ")}`,
        409
      );
    }

    const productMap = new Map(
      products.map((p) => [p._id.toString(), p])
    );

    const snapshotItems = orderItems.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        productId: new Types.ObjectId(item.productId),
        name: product.name,
        imageUrl: product.imageUrl,
        unit: product.unit,
        mrp: product.mrp,
        price: product.price,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity,
      };
    });

    const couponCode =
      req.body.couponCode ||
      (await Cart.findOne({ userId, storeId }))?.couponCode;

    const bill = await computeBill(
      snapshotItems.map((i) => ({ price: i.price, quantity: i.quantity })),
      store,
      couponCode,
      userId
    );

    const stockItems = snapshotItems.map((i) => ({
      productId: i.productId.toString(),
      quantity: i.quantity,
      storeId,
    }));

    await reserveStock(stockItems);

    const user = await User.findById(userId);

    let order;
    try {
      const etaMinutes =
        store.avgPrepMinutes + Math.ceil(distance * 3);
      const estimatedDeliveryAt = new Date(
        Date.now() + etaMinutes * 60 * 1000
      );

      order = await Order.create({
        orderNumber: generateOrderNumber(),
        userId,
        storeId,
        customer: {
          name: user?.name || "",
          phone: user?.phone || "",
        },
        items: snapshotItems,
        bill,
        totalAmount: bill.grandTotal,
        couponCode: couponCode || undefined,
        status: OrderStatus.PLACED,
        statusHistory: [
          {
            status: OrderStatus.PLACED,
            at: new Date(),
            by: null,
          },
        ],
        paymentMethod:
          req.body.paymentMethod || PaymentMethod.COD,
        paymentStatus: PaymentStatus.PENDING,
        deliveryAddress,
        notes: req.body.notes,
        idempotencyKey,
        estimatedDeliveryAt,
      });
    } catch (createError) {
      await restoreStock(stockItems);
      throw createError;
    }

    if (couponCode) {
      await Coupon.updateOne(
        { code: couponCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    await Cart.updateOne(
      { userId, storeId },
      { $set: { items: [], couponCode: undefined } }
    );

    response.data = order;
    response.message = "Order placed successfully";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const getOrders = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const userId = req.user!.id;
    const { page, limit, skip } = parsePagination(
      req.query as Record<string, string>
    );

    const filter: Record<string, any> = { userId };
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) {
        filter.createdAt.$gte = new Date(req.query.from as string);
      }
      if (req.query.to) {
        filter.createdAt.$lte = new Date(req.query.to as string);
      }
    }

    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    response.data = {
      items,
      pagination: buildPaginationResponse(total, page, limit),
    };
    response.message = "Order history";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const getOrder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const isOwner = order.userId.toString() === req.user!.id;
    const isAdmin = req.user!.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new AppError("Access denied", 403);
    }

    response.data = order;
    response.message = "Order details";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const trackOrder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user!.id,
    });
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    response.data = {
      status: order.status,
      statusHistory: order.statusHistory,
      estimatedDeliveryAt: order.estimatedDeliveryAt,
    };
    response.message = "Order tracking";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const cancelOrder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user!.id,
    });
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.status !== OrderStatus.PLACED) {
      throw new AppError(
        `Cannot cancel order in "${order.status}" status`,
        409
      );
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelReason = req.body.reason;
    order.cancelledAt = new Date();
    order.statusHistory.push({
      status: OrderStatus.CANCELLED,
      at: new Date(),
      by: new Types.ObjectId(req.user!.id),
      note: req.body.reason,
    });

    await order.save();

    const stockItems = order.items.map((i) => ({
      productId: i.productId.toString(),
      quantity: i.quantity,
      storeId: order.storeId.toString(),
    }));
    await restoreStock(stockItems);

    response.data = order;
    response.message = "Order cancelled";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const reorder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user!.id,
    });
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const storeId = order.storeId.toString();
    const userId = req.user!.id;

    let cart = await Cart.findOne({ userId, storeId });
    if (!cart) {
      cart = await Cart.create({ userId, storeId, items: [] });
    }

    cart.items = [];
    for (const item of order.items) {
      const product = await Product.findOne({
        _id: item.productId,
        storeId,
        isAvailable: true,
        isDeleted: false,
      });
      if (product && product.stock > 0) {
        const qty = Math.min(
          item.quantity,
          product.stock,
          product.maxPerOrder
        );
        cart.items.push({
          productId: item.productId,
          quantity: qty,
        });
      }
    }

    await cart.save();

    const view = await getCartView(userId, storeId);
    response.data = view;
    response.message = "Reorder cart built";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const getStoreOrders = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const targetStoreId = req.params.storeId;

    const admin = await User.findById(req.user!.id);
    if (
      admin &&
      admin.storeIds.length > 0 &&
      !admin.storeIds.some(
        (id) => id.toString() === targetStoreId
      )
    ) {
      throw new AppError("Access denied to this store", 403);
    }

    const { page, limit, skip } = parsePagination(
      req.query as Record<string, string>
    );

    const filter: Record<string, any> = {
      storeId: targetStoreId,
    };
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) {
        filter.createdAt.$gte = new Date(req.query.from as string);
      }
      if (req.query.to) {
        filter.createdAt.$lte = new Date(req.query.to as string);
      }
    }
    if (req.query.q) {
      const q = req.query.q as string;
      filter.$or = [
        { orderNumber: { $regex: q, $options: "i" } },
        { "customer.phone": { $regex: q, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    response.data = {
      items,
      pagination: buildPaginationResponse(total, page, limit),
    };
    response.message = "Store orders";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const admin = await User.findById(req.user!.id);
    if (
      admin &&
      admin.storeIds.length > 0 &&
      !admin.storeIds.some(
        (id) => id.toString() === order.storeId.toString()
      )
    ) {
      throw new AppError("Access denied to this store", 403);
    }

    const newStatus = req.body.status as OrderStatus;
    validateTransition(order.status, newStatus);

    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      at: new Date(),
      by: new Types.ObjectId(req.user!.id),
      note: req.body.note,
    });

    if (newStatus === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
      const stockItems = order.items.map((i) => ({
        productId: i.productId.toString(),
        quantity: i.quantity,
        storeId: order.storeId.toString(),
      }));
      await restoreStock(stockItems);
    }

    if (newStatus === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
      if (order.paymentMethod === PaymentMethod.COD) {
        order.paymentStatus = PaymentStatus.PAID;
      }
    }

    await order.save();

    response.data = order;
    response.message = `Order status updated to ${newStatus}`;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
