import { Types } from "mongoose";
import {
  Order,
  Product,
  Store,
  User,
  Role,
  OrderStatus,
  AppError,
} from "../../../shared";

const getStoreMidnight = (timezone: string, daysAgo: number = 0): Date => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "2026", 10);
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10) - 1;
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "1", 10);

  // Midnight in the store's timezone (e.g. 00:00 IST = 18:30 UTC the day before),
  // so "today"/"yesterday" match the per-day buckets used by the sales report.
  const naiveUtcMidnight = new Date(Date.UTC(year, month, day - daysAgo, 0, 0, 0));
  return new Date(naiveUtcMidnight.getTime() - timezoneOffsetMs(naiveUtcMidnight, timezone));
};

/** Offset of `timeZone` from UTC at `date`, in ms (IST = +19800000). */
const timezoneOffsetMs = (date: Date, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value || "0", 10);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - date.getTime();
};

export const getDashboardAnalytics = async (
  storeId: string,
  query: { range?: string; from?: string; to?: string }
): Promise<any> => {
  const store = await Store.findById(storeId);
  if (!store) {
    throw new AppError("Store not found", 404);
  }

  const timezone = store.timezone || "Asia/Kolkata";
  let fromDate: Date;
  let toDate = new Date();

  if (query.from && query.to) {
    fromDate = new Date(query.from);
    toDate = new Date(query.to);
  } else if (query.range === "today") {
    fromDate = getStoreMidnight(timezone, 0);
  } else if (query.range === "30d") {
    fromDate = getStoreMidnight(timezone, 30);
  } else {
    fromDate = getStoreMidnight(timezone, 7);
  }

  const storeObjId = new Types.ObjectId(storeId);

  const [ordersSummary, statusCountsResult, topProductsResult, lowStockCount] =
    await Promise.all([
      Order.aggregate([
        {
          $match: {
            storeId: storeObjId,
            createdAt: { $gte: fromDate, $lte: toDate },
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            deliveredOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", OrderStatus.DELIVERED] }, 1, 0],
              },
            },
            cancelledOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", OrderStatus.CANCELLED] }, 1, 0],
              },
            },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ["$status", OrderStatus.DELIVERED] },
                  "$bill.grandTotal",
                  0,
                ],
              },
            },
            customerIds: { $addToSet: "$userId" },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            storeId: storeObjId,
            createdAt: { $gte: fromDate, $lte: toDate },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            storeId: storeObjId,
            status: OrderStatus.DELIVERED,
            createdAt: { $gte: fromDate, $lte: toDate },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.name" },
            imageUrl: { $first: "$items.imageUrl" },
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.lineTotal" },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]),

      Product.countDocuments({
        storeId: storeObjId,
        isDeleted: false,
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      }),
    ]);

  const summary = ordersSummary[0] || {
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    revenue: 0,
    customerIds: [],
  };

  const aov =
    summary.deliveredOrders > 0
      ? Math.round(summary.revenue / summary.deliveredOrders)
      : 0;

  const cancellationRate =
    summary.totalOrders > 0
      ? parseFloat(
          ((summary.cancelledOrders / summary.totalOrders) * 100).toFixed(1)
        )
      : 0;

  const newCustomers = await User.countDocuments({
    role: Role.CUSTOMER,
    createdAt: { $gte: fromDate, $lte: toDate },
  });

  const todayStart = getStoreMidnight(timezone, 0);
  const yesterdayStart = getStoreMidnight(timezone, 1);

  const [todayStats, yesterdayStats] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          storeId: storeObjId,
          createdAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ["$status", OrderStatus.DELIVERED] },
                "$bill.grandTotal",
                0,
              ],
            },
          },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          storeId: storeObjId,
          createdAt: { $gte: yesterdayStart, $lt: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ["$status", OrderStatus.DELIVERED] },
                "$bill.grandTotal",
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const todayOrders = todayStats[0]?.orders || 0;
  const todayRevenue = todayStats[0]?.revenue || 0;
  const yesterdayOrders = yesterdayStats[0]?.orders || 0;
  const yesterdayRevenue = yesterdayStats[0]?.revenue || 0;

  const calcDelta = (today: number, yesterday: number) => {
    if (yesterday === 0) return today > 0 ? 100 : 0;
    return parseFloat((((today - yesterday) / yesterday) * 100).toFixed(1));
  };

  const ordersByStatus: Record<string, number> = {
    [OrderStatus.PLACED]: 0,
    [OrderStatus.ACCEPTED]: 0,
    [OrderStatus.PREPARING]: 0,
    [OrderStatus.OUT_FOR_DELIVERY]: 0,
    [OrderStatus.DELIVERED]: 0,
    [OrderStatus.CANCELLED]: 0,
  };

  statusCountsResult.forEach((sc) => {
    if (sc._id && ordersByStatus[sc._id] !== undefined) {
      ordersByStatus[sc._id] = sc.count;
    }
  });

  return {
    range: {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      timezone,
    },
    metrics: {
      totalOrders: summary.totalOrders,
      deliveredOrders: summary.deliveredOrders,
      cancelledOrders: summary.cancelledOrders,
      revenue: summary.revenue,
      averageOrderValue: aov,
      cancellationRate,
      newCustomers,
      lowStockCount,
    },
    deltas: {
      todayOrders,
      yesterdayOrders,
      ordersDeltaPercent: calcDelta(todayOrders, yesterdayOrders),
      todayRevenue,
      yesterdayRevenue,
      revenueDeltaPercent: calcDelta(todayRevenue, yesterdayRevenue),
    },
    ordersByStatus,
    topProducts: topProductsResult.map((p) => ({
      productId: p._id.toString(),
      name: p.name,
      imageUrl: p.imageUrl,
      quantity: p.quantity,
      revenue: p.revenue,
    })),
  };
};

export const getSalesReportData = async (
  storeId: string,
  query: { range?: string; from?: string; to?: string; groupBy?: "day" | "hour" }
): Promise<any> => {
  const store = await Store.findById(storeId);
  const timezone = store?.timezone || "Asia/Kolkata";

  let fromDate: Date;
  let toDate = new Date();

  if (query.from && query.to) {
    fromDate = new Date(query.from);
    toDate = new Date(query.to);
  } else if (query.range === "today") {
    fromDate = getStoreMidnight(timezone, 0);
  } else if (query.range === "30d") {
    fromDate = getStoreMidnight(timezone, 30);
  } else {
    fromDate = getStoreMidnight(timezone, 7);
  }

  const storeObjId = new Types.ObjectId(storeId);

  const salesByDay = await Order.aggregate([
    {
      $match: {
        storeId: storeObjId,
        createdAt: { $gte: fromDate, $lte: toDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            // "hour" buckets look like "2026-11-09 14"
            format: query.groupBy === "hour" ? "%Y-%m-%d %H" : "%Y-%m-%d",
            date: "$createdAt",
            timezone,
          },
        },
        orders: { $sum: 1 },
        deliveredOrders: {
          $sum: {
            $cond: [{ $eq: ["$status", OrderStatus.DELIVERED] }, 1, 0],
          },
        },
        revenue: {
          $sum: {
            $cond: [
              { $eq: ["$status", OrderStatus.DELIVERED] },
              "$bill.grandTotal",
              0,
            ],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return salesByDay.map((d) => ({
    date: d._id,
    orders: d.orders,
    ordersCount: d.orders,
    deliveredOrders: d.deliveredOrders,
    revenue: d.revenue,
  }));
};

export const getTopProductsReport = async (
  storeId: string,
  limitNum: number = 10
): Promise<any[]> => {
  const storeObjId = new Types.ObjectId(storeId);

  const products = await Order.aggregate([
    {
      $match: {
        storeId: storeObjId,
        status: OrderStatus.DELIVERED,
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        name: { $first: "$items.name" },
        imageUrl: { $first: "$items.imageUrl" },
        unit: { $first: "$items.unit" },
        totalQuantitySold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.lineTotal" },
      },
    },
    { $sort: { totalQuantitySold: -1 } },
    { $limit: limitNum },
  ]);

  return products.map((p) => ({
    productId: p._id.toString(),
    name: p.name,
    imageUrl: p.imageUrl,
    unit: p.unit,
    totalQuantitySold: p.totalQuantitySold,
    totalRevenue: p.totalRevenue,
  }));
};

export const getCategorySalesReport = async (
  storeId: string,
  query?: { range?: string; from?: string; to?: string }
): Promise<any[]> => {
  const store = await Store.findById(storeId);
  const timezone = store?.timezone || "Asia/Kolkata";

  let fromDate: Date;
  let toDate = new Date();

  if (query?.from && query?.to) {
    fromDate = new Date(query.from);
    toDate = new Date(query.to);
  } else if (query?.range === "today") {
    fromDate = getStoreMidnight(timezone, 0);
  } else if (query?.range === "30d") {
    fromDate = getStoreMidnight(timezone, 30);
  } else {
    fromDate = getStoreMidnight(timezone, 7);
  }

  const storeObjId = new Types.ObjectId(storeId);

  const result = await Order.aggregate([
    {
      $match: {
        storeId: storeObjId,
        createdAt: { $gte: fromDate, $lte: toDate },
        status: OrderStatus.DELIVERED,
      },
    },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "categories",
        localField: "product.categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$category._id",
        name: { $first: { $ifNull: ["$category.name", "Uncategorized"] } },
        totalQuantitySold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
        orderCount: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        totalQuantitySold: 1,
        revenue: 1,
        orderCount: { $size: "$orderCount" },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  return result.map((r) => ({
    categoryId: r._id ? r._id.toString() : "other",
    categoryName: r.name,
    name: r.name,
    totalQuantitySold: r.totalQuantitySold,
    revenue: r.revenue,
    orderCount: r.orderCount,
  }));
};
