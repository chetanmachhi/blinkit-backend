import { Types } from "mongoose";
import {
  User,
  Order,
  Address,
  Role,
  OrderStatus,
  AppError,
  parsePagination,
  buildPaginationResponse,
} from "../../../shared";

export const getCustomersList = async (query: any): Promise<any> => {
  const { page, limit, skip } = parsePagination(query);

  const userMatch: any = { role: Role.CUSTOMER };
  if (query.q) {
    const q = query.q.trim();
    userMatch.$or = [
      { name: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(userMatch).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(userMatch),
  ]);

  const userIds = users.map((u) => u._id);

  const stats = await Order.aggregate([
    { $match: { userId: { $in: userIds } } },
    {
      $group: {
        _id: "$userId",
        orderCount: { $sum: 1 },
        totalSpent: {
          $sum: {
            $cond: [{ $eq: ["$status", OrderStatus.DELIVERED] }, "$totalAmount", 0],
          },
        },
        lastOrderAt: { $max: "$createdAt" },
      },
    },
  ]);

  const statsMap = new Map<string, any>();
  stats.forEach((s) => statsMap.set(s._id.toString(), s));

  const items = users.map((u) => {
    const s = statsMap.get(u._id.toString()) || {
      orderCount: 0,
      totalSpent: 0,
      lastOrderAt: null,
    };
    return {
      id: u._id.toString(),
      name: u.name,
      phone: u.phone,
      email: u.email || "",
      createdAt: u.createdAt,
      orderCount: s.orderCount,
      totalSpent: s.totalSpent,
      lastOrderAt: s.lastOrderAt,
    };
  });

  return {
    items,
    pagination: buildPaginationResponse(total, page, limit),
  };
};

export const getCustomerDetails = async (userId: string): Promise<any> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Customer not found", 404);
  }

  const [addresses, recentOrders, stats] = await Promise.all([
    Address.find({ userId, isDeleted: false }).sort({ isDefault: -1, createdAt: -1 }),
    Order.find({ userId }).sort({ createdAt: -1 }).limit(10),
    Order.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          deliveredCount: {
            $sum: {
              $cond: [{ $eq: ["$status", OrderStatus.DELIVERED] }, 1, 0],
            },
          },
          cancelledCount: {
            $sum: {
              $cond: [{ $eq: ["$status", OrderStatus.CANCELLED] }, 1, 0],
            },
          },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ["$status", OrderStatus.DELIVERED] }, "$totalAmount", 0],
            },
          },
          firstOrderAt: { $min: "$createdAt" },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
    ]),
  ]);

  const userStats = stats[0] || {
    orderCount: 0,
    deliveredCount: 0,
    cancelledCount: 0,
    totalSpent: 0,
    firstOrderAt: null,
    lastOrderAt: null,
  };

  return {
    profile: {
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      email: user.email || "",
      createdAt: user.createdAt,
      isActive: user.isActive,
    },
    addresses,
    recentOrders,
    stats: userStats,
  };
};
