import { Coupon } from "../models/coupon.model";
import { Order } from "../models/order.model";
import { IStore } from "../models/store.model";
import { AppError } from "../utils/AppError";
import { CouponType, OrderStatus } from "../constants/enums";

interface BillItem {
  price: number;
  quantity: number;
}

interface BillResult {
  itemTotal: number;
  discount: number;
  deliveryFee: number;
  handlingFee: number;
  grandTotal: number;
}

export const computeBill = async (
  items: BillItem[],
  store: IStore,
  couponCode?: string,
  userId?: string
): Promise<BillResult> => {
  let itemTotal = 0;
  for (const item of items) {
    itemTotal += item.price * item.quantity;
  }

  if (itemTotal < store.minOrderAmount) {
    throw new AppError(
      `Minimum order amount is ₹${(store.minOrderAmount / 100).toFixed(2)}`,
      409
    );
  }

  let discount = 0;

  if (couponCode) {
    const now = new Date();
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      isDeleted: false,
      validFrom: { $lte: now },
      validTo: { $gte: now },
    });

    if (!coupon) {
      throw new AppError("Invalid or expired coupon", 409);
    }

    if (coupon.storeId && coupon.storeId.toString() !== store._id.toString()) {
      throw new AppError("Coupon not valid for this store", 409);
    }

    if (itemTotal < coupon.minOrderAmount) {
      throw new AppError(
        `Minimum order of ₹${(coupon.minOrderAmount / 100).toFixed(2)} required for this coupon`,
        409
      );
    }

    if (
      coupon.usageLimit !== undefined &&
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      throw new AppError("Coupon usage limit reached", 409);
    }

    if (userId) {
      const userUsageCount = await Order.countDocuments({
        userId,
        couponCode: coupon.code,
        status: { $ne: OrderStatus.CANCELLED },
      });
      if (userUsageCount >= coupon.perUserLimit) {
        throw new AppError("Coupon per-user limit reached", 409);
      }
    }

    if (coupon.type === CouponType.PERCENT) {
      discount = Math.round((itemTotal * coupon.value) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
      if (discount > itemTotal) {
        discount = itemTotal;
      }
    }
  }

  const deliveryFee =
    itemTotal >= store.freeDeliveryAbove ? 0 : store.deliveryFee;
  const handlingFee = store.handlingFee;
  const grandTotal = itemTotal - discount + deliveryFee + handlingFee;

  return {
    itemTotal,
    discount,
    deliveryFee,
    handlingFee,
    grandTotal,
  };
};
