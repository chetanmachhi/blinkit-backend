import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  phone: string;
  otpHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    phone: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Otp = mongoose.model<IOtp>("Otp", otpSchema);
