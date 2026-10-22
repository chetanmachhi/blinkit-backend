import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStore extends Document {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  address: string;
  isActive: boolean;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  deliveryRadiusKm: number;
  minOrderAmount: number;
  deliveryFee: number;
  freeDeliveryAbove: number;
  handlingFee: number;
  avgPrepMinutes: number;
  opensAt: string;
  closesAt: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStore>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: { type: [Number], required: true },
    },
    deliveryRadiusKm: { type: Number, required: true },
    minOrderAmount: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    freeDeliveryAbove: { type: Number, required: true },
    handlingFee: { type: Number, default: 0 },
    avgPrepMinutes: { type: Number, default: 15 },
    opensAt: { type: String, required: true },
    closesAt: { type: String, required: true },
    timezone: { type: String, default: "Asia/Kolkata" },
  },
  { timestamps: true }
);

storeSchema.index({ location: "2dsphere" });

export const Store = mongoose.model<IStore>("Store", storeSchema);
