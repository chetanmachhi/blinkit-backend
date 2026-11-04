import {
  User,
  Order,
  IOrder,
  Role,
  assignRiderToOrder,
  RIDER_ACTIVE_STATUSES,
} from "../../../shared";

export interface StoreRiderView {
  id: string;
  name: string;
  phone: string;
  vehicleNumber?: string;
  isOnline: boolean;
  activeOrders: number;
}

export const listRiders = async (): Promise<StoreRiderView[]> => {
  const riders = await User.find({ role: Role.RIDER, isActive: true }).sort({ name: 1 });

  const activeCounts = await Order.aggregate<{ _id: unknown; count: number }>([
    {
      $match: {
        riderId: { $in: riders.map((r) => r._id) },
        status: { $in: RIDER_ACTIVE_STATUSES },
      },
    },
    { $group: { _id: "$riderId", count: { $sum: 1 } } },
  ]);
  const countById = new Map(activeCounts.map((c) => [String(c._id), c.count]));

  return riders.map((r) => ({
    id: r._id.toString(),
    name: r.name || "Delivery Partner",
    phone: r.phone,
    vehicleNumber: r.vehicleNumber,
    isOnline: r.isOnline !== false,
    activeOrders: countById.get(r._id.toString()) ?? 0,
  }));
};

/** Admin (re)assigns a rider; allowed until the order has been picked up. */
export const assignRider = (
  storeId: string,
  orderId: string,
  riderId: string
): Promise<IOrder> => assignRiderToOrder({ orderId, riderId, storeId, allowReassign: true });
