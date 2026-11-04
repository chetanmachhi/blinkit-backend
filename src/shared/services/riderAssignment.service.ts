import { Types } from "mongoose";
import { Order, IOrder } from "../models/order.model";
import { User } from "../models/user.model";
import { OrderStatus, Role } from "../constants/enums";
import { AppError } from "../utils/AppError";

/** Statuses in which an unassigned order can be picked up by a rider. */
export const RIDER_ASSIGNABLE_STATUSES: OrderStatus[] = [
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
];

/** Statuses before the rider has collected the bag from the store. */
export const RIDER_PRE_PICKUP_STATUSES: OrderStatus[] = [
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
];

/** Statuses in which a rider is actively working on the order. */
export const RIDER_ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
];

export interface AssignRiderOptions {
  orderId: string;
  riderId: string;
  /** Restrict to one store (admin flow). */
  storeId?: string;
  /**
   * true  = admin (re)assigns; allowed until pickup.
   * false = rider self-assigns; only if nobody has the order yet.
   */
  allowReassign: boolean;
}

/**
 * Atomically assigns a rider to an order. The conditional filter makes
 * concurrent "accept" taps from two riders safe: exactly one wins.
 */
export const assignRiderToOrder = async (
  options: AssignRiderOptions
): Promise<IOrder> => {
  const { orderId, riderId, storeId, allowReassign } = options;

  const rider = await User.findOne({
    _id: riderId,
    role: Role.RIDER,
    isActive: true,
  });
  if (!rider) {
    throw new AppError("Rider not found or inactive", 404);
  }

  const filter: Record<string, unknown> = { _id: orderId };
  if (storeId) {
    filter.storeId = storeId;
  }
  if (allowReassign) {
    filter.$or = [
      { status: { $in: RIDER_PRE_PICKUP_STATUSES } },
      { status: OrderStatus.OUT_FOR_DELIVERY, riderId: null },
    ];
  } else {
    filter.status = { $in: RIDER_ASSIGNABLE_STATUSES };
    filter.riderId = null;
  }

  const order = await Order.findOneAndUpdate(
    filter,
    {
      $set: {
        riderId: new Types.ObjectId(rider._id.toString()),
        rider: {
          name: rider.name || "Delivery Partner",
          phone: rider.phone,
          vehicleNumber: rider.vehicleNumber,
        },
        riderAssignedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!order) {
    const existing = await Order.findOne(
      storeId ? { _id: orderId, storeId } : { _id: orderId }
    );
    if (!existing) {
      throw new AppError("Order not found", 404);
    }
    if (existing.riderId && !allowReassign) {
      throw new AppError("Another rider has already accepted this order", 409);
    }
    throw new AppError(
      `A rider cannot be assigned while the order is "${existing.status}"`,
      409
    );
  }

  return order;
};
