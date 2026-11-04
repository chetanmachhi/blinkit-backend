import { Types } from "mongoose";
import {
  Order,
  IOrder,
  Store,
  IStore,
  User,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  AppError,
  haversineDistance,
  assignRiderToOrder,
  RIDER_ASSIGNABLE_STATUSES,
  RIDER_PRE_PICKUP_STATUSES,
  RIDER_ACTIVE_STATUSES,
} from "../../../shared";

/**
 * The shape the delivery app consumes. Deliberately flat and
 * map-friendly: every location has plain lat/lng for Google Maps links.
 */
export interface RiderOrderView {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  isMine: boolean;
  createdAt: Date;
  estimatedDeliveryAt?: Date;
  riderAssignedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelReason?: string;
  pickup: {
    storeId: string;
    name: string;
    address: string;
    phone: string;
    lat: number | null;
    lng: number | null;
  };
  drop: {
    customerName: string;
    /** Only revealed to the rider who owns the order. */
    customerPhone: string | null;
    label?: string;
    addressLine: string;
    landmark?: string;
    lat: number | null;
    lng: number | null;
  };
  distanceKm: number | null;
  items: { name: string; unit: string; quantity: number }[];
  itemCount: number;
  /** Paise */
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Cash the rider must collect at the door, in paise. 0 for prepaid. */
  amountToCollect: number;
  notes?: string;
}

const toView = (
  order: IOrder,
  store: IStore | undefined,
  riderId: string
): RiderOrderView => {
  const isMine = order.riderId?.toString() === riderId;
  const storeLat = store?.location?.coordinates?.[1] ?? null;
  const storeLng = store?.location?.coordinates?.[0] ?? null;
  const drop = order.deliveryAddress;
  const dropLat = drop?.coordinates?.lat ?? null;
  const dropLng = drop?.coordinates?.lng ?? null;

  const distanceKm =
    storeLat !== null && storeLng !== null && dropLat !== null && dropLng !== null
      ? parseFloat(haversineDistance(storeLat, storeLng, dropLat, dropLng).toFixed(1))
      : null;

  const grandTotal = order.bill?.grandTotal ?? order.totalAmount;
  const isCashDue =
    order.paymentMethod === PaymentMethod.COD &&
    order.paymentStatus !== PaymentStatus.PAID;

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    isMine,
    createdAt: order.createdAt,
    estimatedDeliveryAt: order.estimatedDeliveryAt,
    riderAssignedAt: order.riderAssignedAt,
    pickedUpAt: order.pickedUpAt,
    deliveredAt: order.deliveredAt,
    cancelReason: order.cancelReason,
    pickup: {
      storeId: order.storeId.toString(),
      name: store?.name || "Store",
      address: store?.address || "",
      phone: store?.phone || "",
      lat: storeLat,
      lng: storeLng,
    },
    drop: {
      customerName: order.customer?.name || "Customer",
      customerPhone: isMine ? order.customer?.phone || null : null,
      label: drop?.label,
      addressLine: drop?.addressLine || "",
      landmark: drop?.landmark,
      lat: dropLat,
      lng: dropLng,
    },
    distanceKm,
    items: order.items.map((i) => ({ name: i.name, unit: i.unit, quantity: i.quantity })),
    itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
    grandTotal,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    amountToCollect: isCashDue ? grandTotal : 0,
    notes: order.notes,
  };
};

const toViews = async (orders: IOrder[], riderId: string): Promise<RiderOrderView[]> => {
  const storeIds = [...new Set(orders.map((o) => o.storeId.toString()))];
  const stores = storeIds.length ? await Store.find({ _id: { $in: storeIds } }) : [];
  const byId = new Map(stores.map((s) => [s._id.toString(), s]));
  return orders.map((o) => toView(o, byId.get(o.storeId.toString()), riderId));
};

const toSingleView = async (order: IOrder, riderId: string): Promise<RiderOrderView> =>
  (await toViews([order], riderId))[0];

/** Orders the store has accepted that no rider has taken yet. */
export const listAvailableOrders = async (riderId: string): Promise<RiderOrderView[]> => {
  const orders = await Order.find({
    status: { $in: RIDER_ASSIGNABLE_STATUSES },
    riderId: null,
  })
    .sort({ createdAt: 1 })
    .limit(50);
  return toViews(orders, riderId);
};

export const listActiveOrders = async (riderId: string): Promise<RiderOrderView[]> => {
  const orders = await Order.find({
    riderId,
    status: { $in: RIDER_ACTIVE_STATUSES },
  }).sort({ riderAssignedAt: 1 });
  return toViews(orders, riderId);
};

export const listHistory = async (riderId: string): Promise<RiderOrderView[]> => {
  const orders = await Order.find({
    riderId,
    status: { $in: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] },
  })
    .sort({ updatedAt: -1 })
    .limit(30);
  return toViews(orders, riderId);
};

export const getOrderForRider = async (
  riderId: string,
  orderId: string
): Promise<RiderOrderView> => {
  const order = await Order.findById(orderId);
  const isMine = order?.riderId?.toString() === riderId;
  const isOpen =
    !!order && !order.riderId && RIDER_ASSIGNABLE_STATUSES.includes(order.status);
  if (!order || (!isMine && !isOpen)) {
    throw new AppError("Order not found or assigned to another rider", 404);
  }
  return toSingleView(order, riderId);
};

export const acceptOrder = async (
  riderId: string,
  orderId: string
): Promise<RiderOrderView> => {
  const rider = await User.findById(riderId);
  if (rider && rider.isOnline === false) {
    throw new AppError("Go online to accept new deliveries", 409);
  }
  const order = await assignRiderToOrder({ orderId, riderId, allowReassign: false });
  return toSingleView(order, riderId);
};

/** Rider gives the order back before pickup (e.g. accepted by mistake). */
export const releaseOrder = async (
  riderId: string,
  orderId: string
): Promise<RiderOrderView> => {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, riderId, status: { $in: RIDER_PRE_PICKUP_STATUSES } },
    { $set: { riderId: null, rider: null }, $unset: { riderAssignedAt: 1 } },
    { new: true }
  );
  if (!order) {
    throw new AppError("Only orders not yet picked up can be released", 409);
  }
  return toSingleView(order, riderId);
};

export const markPickedUp = async (
  riderId: string,
  orderId: string
): Promise<RiderOrderView> => {
  const now = new Date();
  const order = await Order.findOneAndUpdate(
    { _id: orderId, riderId, status: { $in: RIDER_PRE_PICKUP_STATUSES } },
    {
      $set: { status: OrderStatus.OUT_FOR_DELIVERY, pickedUpAt: now },
      $push: {
        statusHistory: {
          status: OrderStatus.OUT_FOR_DELIVERY,
          at: now,
          by: new Types.ObjectId(riderId),
          note: "Picked up by delivery partner",
        },
      },
    },
    { new: true }
  );
  if (!order) {
    const existing = await Order.findOne({ _id: orderId, riderId });
    if (!existing) throw new AppError("Order not found", 404);
    throw new AppError(`Order cannot be picked up while it is "${existing.status}"`, 409);
  }
  return toSingleView(order, riderId);
};

export const markDelivered = async (
  riderId: string,
  orderId: string
): Promise<RiderOrderView> => {
  const existing = await Order.findOne({ _id: orderId, riderId });
  if (!existing) {
    throw new AppError("Order not found", 404);
  }

  const now = new Date();
  const set: Record<string, unknown> = {
    status: OrderStatus.DELIVERED,
    deliveredAt: now,
  };
  // Cash on delivery is settled the moment the rider hands over the bag.
  if (existing.paymentMethod === PaymentMethod.COD) {
    set.paymentStatus = PaymentStatus.PAID;
  }

  const order = await Order.findOneAndUpdate(
    { _id: orderId, riderId, status: OrderStatus.OUT_FOR_DELIVERY },
    {
      $set: set,
      $push: {
        statusHistory: {
          status: OrderStatus.DELIVERED,
          at: now,
          by: new Types.ObjectId(riderId),
          note: "Delivered by delivery partner",
        },
      },
    },
    { new: true }
  );
  if (!order) {
    throw new AppError(
      `Order cannot be delivered while it is "${existing.status}". Mark it picked up first.`,
      409
    );
  }
  return toSingleView(order, riderId);
};

/** Start of "today" in India, where the stores operate (server runs in UTC). */
const startOfTodayIST = (): Date => {
  const offsetMs = 330 * 60 * 1000;
  const ist = new Date(Date.now() + offsetMs);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - offsetMs);
};

export const getRiderSummary = async (riderId: string) => {
  const riderObjectId = new Types.ObjectId(riderId);
  const [today, totalDeliveries, activeCount] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          riderId: riderObjectId,
          status: OrderStatus.DELIVERED,
          deliveredAt: { $gte: startOfTodayIST() },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          cash: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", PaymentMethod.COD] }, "$bill.grandTotal", 0],
            },
          },
        },
      },
    ]),
    Order.countDocuments({ riderId, status: OrderStatus.DELIVERED }),
    Order.countDocuments({ riderId, status: { $in: RIDER_ACTIVE_STATUSES } }),
  ]);

  return {
    todayDeliveries: (today[0]?.count as number) ?? 0,
    /** Paise */
    todayCashCollected: (today[0]?.cash as number) ?? 0,
    totalDeliveries,
    activeCount,
  };
};
