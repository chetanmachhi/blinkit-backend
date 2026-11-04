import { Types } from "mongoose";
import { Product, IProduct } from "../models/product.model";
import { AppError } from "../utils/AppError";

export interface StockReservationItem {
  productId: string | Types.ObjectId;
  quantity: number;
  storeId: string | Types.ObjectId;
}

export const reserveStock = async (
  items: StockReservationItem[]
): Promise<void> => {
  const reserved: StockReservationItem[] = [];

  for (const item of items) {
    const result = await Product.findOneAndUpdate(
      {
        _id: item.productId,
        storeId: item.storeId,
        isAvailable: true,
        isDeleted: false,
        stock: { $gte: item.quantity },
      },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );

    if (!result) {
      for (const r of reserved) {
        await Product.findOneAndUpdate(
          { _id: r.productId },
          { $inc: { stock: r.quantity } }
        );
      }

      const failedProduct = await Product.findById(item.productId);
      const productName = failedProduct?.name || "Unknown product";
      throw new AppError(
        `Insufficient stock for "${productName}"`,
        409
      );
    }

    reserved.push(item);
  }
};

export const restoreStock = async (
  items: {
    productId: string | Types.ObjectId;
    quantity: number;
    storeId?: string | Types.ObjectId;
  }[]
): Promise<void> => {
  for (const item of items) {
    await Product.findOneAndUpdate(
      { _id: item.productId },
      { $inc: { stock: item.quantity } }
    );
  }
};

export const adjustStock = async (
  productId: string | Types.ObjectId,
  storeId: string | Types.ObjectId,
  update: { delta?: number; stock?: number }
): Promise<IProduct> => {
  if (update.stock !== undefined) {
    if (update.stock < 0) {
      throw new AppError("Stock cannot be negative", 400);
    }
    const updated = await Product.findOneAndUpdate(
      { _id: productId, storeId, isDeleted: false },
      { $set: { stock: update.stock } },
      { new: true }
    );
    if (!updated) {
      throw new AppError("Product not found", 404);
    }
    return updated;
  }

  const delta = update.delta ?? 0;
  const filter: any = { _id: productId, storeId, isDeleted: false };
  if (delta < 0) {
    filter.stock = { $gte: -delta };
  }
  const updated = await Product.findOneAndUpdate(
    filter,
    { $inc: { stock: delta } },
    { new: true }
  );
  if (!updated) {
    throw new AppError(
      delta < 0 ? "Insufficient stock for deduction" : "Product not found",
      delta < 0 ? 409 : 404
    );
  }
  return updated;
};
