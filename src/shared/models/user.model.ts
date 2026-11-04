import mongoose, { Schema, Document, Types } from "mongoose";
import { Role, StoreRole } from "../constants/enums";

export interface IRefreshToken {
  tokenHash: string;
  expiresAt: Date;
  userAgent: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  role: Role;
  email?: string;
  passwordHash?: string;
  storeRole?: StoreRole;
  storeIds: Types.ObjectId[];
  isActive: boolean;
  isPhoneVerified: boolean;
  lastLoginAt?: Date;
  /** Rider only: whether the rider is taking new deliveries */
  isOnline?: boolean;
  /** Rider only */
  vehicleNumber?: string;
  refreshTokens: IRefreshToken[];
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, default: "" },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.CUSTOMER,
    },
    storeRole: {
      type: String,
      enum: Object.values(StoreRole),
    },
    storeIds: [{ type: Schema.Types.ObjectId, ref: "Store" }],
    isActive: { type: Boolean, default: true },
    isPhoneVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    isOnline: { type: Boolean },
    vehicleNumber: { type: String },
    refreshTokens: [refreshTokenSchema],
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
