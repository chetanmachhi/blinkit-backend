import { Types } from "mongoose";
import {
  Order,
  IOrder,
  Store,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  AppError,
  restoreStock,
  canTransition,
  parsePagination,
  buildPaginationResponse,
} from "../../../shared";

export const getLiveOrdersData = async (storeId: string): Promise<any> => {
  const activeStatuses = [
    OrderStatus.PLACED,
    OrderStatus.ACCEPTED,
    OrderStatus.PREPARING,
    OrderStatus.OUT_FOR_DELIVERY,
  ];

  const [activeOrders, countsResult] = await Promise.all([
    Order.find({
      storeId,
      status: { $in: activeStatuses },
    })
      .sort({ createdAt: 1 })
      .limit(100),
    Order.aggregate([
      { $match: { storeId: new Types.ObjectId(storeId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const counts: Record<string, number> = {
    [OrderStatus.PLACED]: 0,
    [OrderStatus.ACCEPTED]: 0,
    [OrderStatus.PREPARING]: 0,
    [OrderStatus.OUT_FOR_DELIVERY]: 0,
    [OrderStatus.DELIVERED]: 0,
    [OrderStatus.CANCELLED]: 0,
  };

  countsResult.forEach((item) => {
    if (item._id && counts[item._id] !== undefined) {
      counts[item._id] = item.count;
    }
  });

  return {
    counts,
    orders: activeOrders,
  };
};

export const getOrdersPaginated = async (
  storeId: string,
  query: any
): Promise<any> => {
  const { page, limit, skip } = parsePagination(query);

  const filter: any = { storeId };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) {
      filter.createdAt.$gte = new Date(query.from);
    }
    if (query.to) {
      filter.createdAt.$lte = new Date(query.to);
    }
  }

  if (query.q) {
    const q = query.q.trim();
    filter.$or = [
      { orderNumber: { $regex: q, $options: "i" } },
      { "customer.phone": { $regex: q, $options: "i" } },
      { "customer.name": { $regex: q, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    items,
    pagination: buildPaginationResponse(total, page, limit),
  };
};

export const getOrderById = async (
  storeId: string,
  orderId: string
): Promise<IOrder> => {
  const order = await Order.findOne({ _id: orderId, storeId });
  if (!order) {
    throw new AppError("Order not found", 404);
  }
  return order;
};

export const acceptPlacedOrder = async (
  storeId: string,
  orderId: string,
  actingUserId: string,
  prepMinutes?: number
): Promise<IOrder> => {
  const store = await Store.findById(storeId);
  const minutes = prepMinutes || store?.avgPrepMinutes || 15;
  const estimatedDeliveryAt = new Date(Date.now() + minutes * 60 * 1000);
  const acceptedAt = new Date();

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      storeId,
      status: OrderStatus.PLACED,
    },
    {
      $set: {
        status: OrderStatus.ACCEPTED,
        acceptedAt,
        prepMinutes: minutes,
        estimatedDeliveryAt,
      },
      $push: {
        statusHistory: {
          status: OrderStatus.ACCEPTED,
          at: acceptedAt,
          by: new Types.ObjectId(actingUserId),
          note: `Accepted with ${minutes} min prep time`,
        },
      },
    },
    { new: true }
  );

  if (!order) {
    const existing = await Order.findOne({ _id: orderId, storeId });
    if (!existing) {
      throw new AppError("Order not found", 404);
    }
    throw new AppError("Order was already updated", 409);
  }

  return order;
};

export const rejectPlacedOrder = async (
  storeId: string,
  orderId: string,
  actingUserId: string,
  reason: string
): Promise<IOrder> => {
  const cancelledAt = new Date();

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      storeId,
      status: OrderStatus.PLACED,
    },
    {
      $set: {
        status: OrderStatus.CANCELLED,
        cancelReason: reason,
        rejectionReason: reason,
        cancelledBy: "store",
        cancelledAt,
      },
      $push: {
        statusHistory: {
          status: OrderStatus.CANCELLED,
          at: cancelledAt,
          by: new Types.ObjectId(actingUserId),
          note: `Rejected: ${reason}`,
        },
      },
    },
    { new: true }
  );

  if (!order) {
    const existing = await Order.findOne({ _id: orderId, storeId });
    if (!existing) {
      throw new AppError("Order not found", 404);
    }
    throw new AppError("Order was already updated", 409);
  }

  await restoreStock(
    order.items.map((i) => ({
      productId: i.productId.toString(),
      quantity: i.quantity,
      storeId: order.storeId.toString(),
    }))
  );

  return order;
};

export const progressOrderStatus = async (
  storeId: string,
  orderId: string,
  actingUserId: string,
  newStatus: OrderStatus,
  note?: string
): Promise<IOrder> => {
  let expectedCurrentStatus: OrderStatus;
  if (newStatus === OrderStatus.PREPARING) {
    expectedCurrentStatus = OrderStatus.ACCEPTED;
  } else if (newStatus === OrderStatus.OUT_FOR_DELIVERY) {
    expectedCurrentStatus = OrderStatus.PREPARING;
  } else if (newStatus === OrderStatus.DELIVERED) {
    expectedCurrentStatus = OrderStatus.OUT_FOR_DELIVERY;
  } else {
    throw new AppError(`Invalid forward transition status "${newStatus}"`, 400);
  }

  const now = new Date();
  const updateData: any = {
    $set: { status: newStatus },
    $push: {
      statusHistory: {
        status: newStatus,
        at: now,
        by: new Types.ObjectId(actingUserId),
        note: note || `Status progressed to ${newStatus}`,
      },
    },
  };

  if (newStatus === OrderStatus.DELIVERED) {
    updateData.$set.deliveredAt = now;
  }

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      storeId,
      status: expectedCurrentStatus,
    },
    updateData,
    { new: true }
  );

  if (!order) {
    const existing = await Order.findOne({ _id: orderId, storeId });
    if (!existing) {
      throw new AppError("Order not found", 404);
    }
    throw new AppError("Order was already updated", 409);
  }

  if (
    newStatus === OrderStatus.DELIVERED &&
    order.paymentMethod === PaymentMethod.COD &&
    order.paymentStatus === PaymentStatus.PENDING
  ) {
    order.paymentStatus = PaymentStatus.PAID;
    await order.save();
  }

  return order;
};

export const cancelActiveOrder = async (
  storeId: string,
  orderId: string,
  actingUserId: string,
  reason: string
): Promise<IOrder> => {
  const cancelledAt = new Date();

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      storeId,
      status: { $in: [OrderStatus.ACCEPTED, OrderStatus.PREPARING] },
    },
    {
      $set: {
        status: OrderStatus.CANCELLED,
        cancelReason: reason,
        cancelledBy: "store",
        cancelledAt,
      },
      $push: {
        statusHistory: {
          status: OrderStatus.CANCELLED,
          at: cancelledAt,
          by: new Types.ObjectId(actingUserId),
          note: `Cancelled: ${reason}`,
        },
      },
    },
    { new: true }
  );

  if (!order) {
    const existing = await Order.findOne({ _id: orderId, storeId });
    if (!existing) {
      throw new AppError("Order not found", 404);
    }
    throw new AppError("Order was already updated", 409);
  }

  await restoreStock(
    order.items.map((i) => ({
      productId: i.productId.toString(),
      quantity: i.quantity,
      storeId: order.storeId.toString(),
    }))
  );

  return order;
};

export const updateOrderPayment = async (
  storeId: string,
  orderId: string,
  paymentStatus: PaymentStatus
): Promise<IOrder> => {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, storeId },
    { $set: { paymentStatus } },
    { new: true }
  );

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return order;
};

export const updateOrderNote = async (
  storeId: string,
  orderId: string,
  internalNote: string
): Promise<IOrder> => {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, storeId },
    { $set: { internalNote } },
    { new: true }
  );

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return order;
};
