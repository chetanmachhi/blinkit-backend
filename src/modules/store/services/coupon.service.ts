import { Types } from "mongoose";
import { Coupon, ICoupon, Order, AppError } from "../../../shared";

export const getCouponsList = async (storeId?: string): Promise<ICoupon[]> => {
  const query: any = { isDeleted: false };
  if (storeId) {
    query.$or = [{ storeId }, { storeId: null }];
  }
  return Coupon.find(query).sort({ createdAt: -1 });
};

export const getCouponById = async (couponId: string): Promise<ICoupon> => {
  const coupon = await Coupon.findOne({ _id: couponId, isDeleted: false });
  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }
  return coupon;
};

export const createNewCoupon = async (data: any): Promise<ICoupon> => {
  const code = data.code.toUpperCase().trim();
  const existing = await Coupon.findOne({ code });
  if (existing) {
    throw new AppError("Coupon code already exists", 409);
  }

  return Coupon.create({
    ...data,
    code,
    validFrom: new Date(data.validFrom),
    validTo: new Date(data.validTo),
    storeId: data.storeId || null,
    isActive: true,
    isDeleted: false,
  });
};

export const updateCouponDetails = async (
  couponId: string,
  data: any
): Promise<ICoupon> => {
  if (data.code) {
    data.code = data.code.toUpperCase().trim();
    const existing = await Coupon.findOne({
      code: data.code,
      _id: { $ne: couponId },
    });
    if (existing) {
      throw new AppError("Coupon code already in use", 409);
    }
  }

  if (data.validFrom) {
    data.validFrom = new Date(data.validFrom);
  }
  if (data.validTo) {
    data.validTo = new Date(data.validTo);
  }

  const coupon = await Coupon.findOneAndUpdate(
    { _id: couponId, isDeleted: false },
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  return coupon;
};

export const softDeleteCoupon = async (couponId: string): Promise<void> => {
  const coupon = await Coupon.findOneAndUpdate(
    { _id: couponId, isDeleted: false },
    { $set: { isDeleted: true, isActive: false } },
    { new: true }
  );

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }
};

export const getCouponUsageHistory = async (couponId: string): Promise<any> => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  const orders = await Order.find({ couponCode: coupon.code })
    .select("orderNumber bill status customer createdAt totalAmount")
    .sort({ createdAt: -1 })
    .limit(50);

  const stats = await Order.aggregate([
    { $match: { couponCode: coupon.code } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalDiscountGiven: { $sum: "$bill.discount" },
      },
    },
  ]);

  return {
    coupon,
    usageCount: coupon.usedCount,
    totalOrders: stats[0]?.totalOrders || 0,
    totalDiscountGiven: stats[0]?.totalDiscountGiven || 0,
    recentOrders: orders,
  };
};
