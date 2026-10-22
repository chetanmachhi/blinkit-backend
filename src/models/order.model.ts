import mongoose, { Schema, Document, Types } from "mongoose";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../constants/enums";

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  imageUrl: string;
  unit: string;
  mrp: number;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface IBill {
  itemTotal: number;
  discount: number;
  deliveryFee: number;
  handlingFee: number;
  grandTotal: number;
}

export interface IStatusHistoryEntry {
  status: OrderStatus;
  at: Date;
  by?: Types.ObjectId | null;
  note?: string;
}

export interface IDeliveryAddress {
  label?: string;
  addressLine: string;
  landmark?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  userId: Types.ObjectId;
  storeId: Types.ObjectId;
  customer: {
    name: string;
    phone: string;
  };
  items: IOrderItem[];
  bill: IBill;
  totalAmount: number;
  couponCode?: string;
  status: OrderStatus;
  statusHistory: IStatusHistoryEntry[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: IDeliveryAddress;
  notes?: string;
  cancelReason?: string;
  idempotencyKey?: string;
  estimatedDeliveryAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    unit: { type: String, required: true },
    mrp: { type: Number, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const billSchema = new Schema<IBill>(
  {
    itemTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    handlingFee: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
  },
  { _id: false }
);

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
    },
    at: { type: Date, required: true },
    by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String },
  },
  { _id: false }
);

const deliveryAddressSchema = new Schema<IDeliveryAddress>(
  {
    label: { type: String },
    addressLine: { type: String, required: true },
    landmark: { type: String },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    items: [orderItemSchema],
    bill: { type: billSchema, required: true },
    totalAmount: { type: Number, required: true },
    couponCode: { type: String },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PLACED,
    },
    statusHistory: [statusHistorySchema],
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.COD,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: true,
    },
    notes: { type: String },
    cancelReason: { type: String },
    idempotencyKey: { type: String },
    estimatedDeliveryAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ storeId: 1, createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ storeId: 1, status: 1, createdAt: -1 });
orderSchema.index(
  { idempotencyKey: 1, userId: 1 },
  { unique: true, sparse: true }
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
