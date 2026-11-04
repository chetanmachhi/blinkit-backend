import { Request, Response } from "express";
import { ResponseModel } from "../models/response.model";
import { sendResponse, buildErrorResponse } from "../utils/response.util";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import {
  parsePagination,
  buildPaginationResponse,
} from "../utils/pagination.util";
import { OrderStatus, Role } from "../constants/enums";

const resolveAdminStoreId = async (
  userId: string,
  queryStoreId?: string
): Promise<string | undefined> => {
  const admin = await User.findById(userId);
  if (!admin || admin.role !== Role.ADMIN) {
    throw new AppError("Forbidden", 403);
  }
  if (queryStoreId) {
    if (
      admin.storeIds.length > 0 &&
      !admin.storeIds.some((id) => id.toString() === queryStoreId)
    ) {
      throw new AppError("Access denied to this store", 403);
    }
    return queryStoreId;
  }
  if (admin.storeIds.length === 1) {
    return admin.storeIds[0].toString();
  }
  return undefined;
};

export const getDashboard = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const storeId = await resolveAdminStoreId(
      req.user!.id,
      req.query.storeId as string
    );

    const filter: Record<string, any> = {};
    if (storeId) filter.storeId = storeId;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) {
        filter.createdAt.$gte = new Date(req.query.from as string);
      }
      if (req.query.to) {
        filter.createdAt.$lte = new Date(req.query.to as string);
      }
    }

    const totalOrders = await Order.countDocuments(filter);

    const statusAgg = await Order.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const ordersByStatus: Record<string, number> = {};
    for (const s of statusAgg) {
      ordersByStatus[s._id] = s.count;
    }

    const revenueAgg = await Order.aggregate([
      { $match: { ...filter, status: OrderStatus.DELIVERED } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);
    const revenue = revenueAgg[0]?.revenue || 0;
    const deliveredCount = revenueAgg[0]?.count || 0;
    const averageOrderValue =
      deliveredCount > 0 ? Math.round(revenue / deliveredCount) : 0;

    const topProducts = await Order.aggregate([
      { $match: { ...filter, status: { $ne: OrderStatus.CANCELLED } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.lineTotal" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    const stockFilter: Record<string, any> = {
      isDeleted: false,
      isAvailable: true,
      stock: { $lte: 10 },
    };
    if (storeId) stockFilter.storeId = storeId;
    const lowStockCount = await Product.countDocuments(stockFilter);

    response.data = {
      totalOrders,
      ordersByStatus,
      revenue,
      averageOrderValue,
      topProducts,
      lowStockCount,
    };
    response.message = "Dashboard data";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const getLowStockProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const storeId = await resolveAdminStoreId(
      req.user!.id,
      req.query.storeId as string
    );
    const threshold = parseInt(
      (req.query.threshold as string) || "10",
      10
    );

    const filter: Record<string, any> = {
      isDeleted: false,
      isAvailable: true,
      stock: { $lte: threshold },
    };
    if (storeId) filter.storeId = storeId;

    const products = await Product.find(filter).sort({
      stock: 1,
    });
    response.data = products;
    response.message = "Low stock products";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const getAdminUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const { page, limit, skip } = parsePagination(
      req.query as Record<string, string>
    );

    const filter: Record<string, any> = {
      role: Role.CUSTOMER,
    };
    if (req.query.q) {
      const q = req.query.q as string;
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const enriched = await Promise.all(
      users.map(async (u) => {
        const orderStats = await Order.aggregate([
          {
            $match: {
              userId: u._id,
              status: { $ne: OrderStatus.CANCELLED },
            },
          },
          {
            $group: {
              _id: null,
              orderCount: { $sum: 1 },
              totalSpent: { $sum: "$totalAmount" },
            },
          },
        ]);
        return {
          ...u.toObject(),
          orderCount: orderStats[0]?.orderCount || 0,
          totalSpent: orderStats[0]?.totalSpent || 0,
        };
      })
    );

    response.data = {
      items: enriched,
      pagination: buildPaginationResponse(total, page, limit),
    };
    response.message = "Users list";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
