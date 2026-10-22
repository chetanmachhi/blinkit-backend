import mongoose, { Schema, Document, Types } from "mongoose";
import { AddressLabel } from "../constants/enums";

export interface ICoordinates {
  lat: number;
  lng: number;
}

export interface IAddress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  label: AddressLabel;
  receiverName: string;
  receiverPhone: string;
  addressLine: string;
  landmark?: string;
  city: string;
  pincode: string;
  coordinates: ICoordinates;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: {
      type: String,
      enum: Object.values(AddressLabel),
      default: AddressLabel.HOME,
    },
    receiverName: { type: String, required: true },
    receiverPhone: { type: String, required: true },
    addressLine: { type: String, required: true },
    landmark: { type: String },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    isDefault: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Address = mongoose.model<IAddress>("Address", addressSchema);
