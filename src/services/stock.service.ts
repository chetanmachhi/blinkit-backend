import { Product } from "../models/product.model";
import { AppError } from "../utils/AppError";
import { Types } from "mongoose";

interface StockItem {
  productId: string | Types.ObjectId;
  quantity: number;
  storeId: string;
}

export const reserveStock = async (
  items: StockItem[]
): Promise<void> => {
  const reserved: StockItem[] = [];

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
  items: StockItem[]
): Promise<void> => {
  for (const item of items) {
    await Product.findOneAndUpdate(
      { _id: item.productId },
      { $inc: { stock: item.quantity } }
    );
  }
};
