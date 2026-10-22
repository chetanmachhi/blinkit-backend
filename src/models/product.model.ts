import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  description: string;
  brand: string;
  unit: string;
  mrp: number;
  price: number;
  stock: number;
  maxPerOrder: number;
  imageUrl: string;
  images: string[];
  tags: string[];
  isAvailable: boolean;
  isDeleted: boolean;
  sortOrder: number;
  discountPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    brand: { type: String, default: "" },
    unit: { type: String, required: true },
    mrp: { type: Number, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    maxPerOrder: { type: Number, default: 10 },
    imageUrl: { type: String, default: "" },
    images: [{ type: String }],
    tags: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual("discountPercent").get(function (this: IProduct) {
  if (this.mrp <= 0) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

productSchema.index({ storeId: 1, isAvailable: 1, categoryId: 1 });
productSchema.index({ storeId: 1, price: 1 });
productSchema.index({ name: "text", brand: "text", tags: "text" });

export const Product = mongoose.model<IProduct>("Product", productSchema);
