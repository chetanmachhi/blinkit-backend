import mongoose, { Schema, Document, Types } from "mongoose";
import { CouponType } from "../constants/enums";

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  maxDiscount?: number;
  minOrderAmount: number;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  perUserLimit: number;
  usedCount: number;
  storeId?: Types.ObjectId | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: Object.values(CouponType),
      required: true,
    },
    value: { type: Number, required: true },
    maxDiscount: { type: Number },
    minOrderAmount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    usageLimit: { type: Number },
    perUserLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema);
