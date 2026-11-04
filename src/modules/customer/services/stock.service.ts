import { Types } from "mongoose";
import {
  reserveStock as sharedReserveStock,
  restoreStock as sharedRestoreStock,
  adjustStock as sharedAdjustStock,
} from "../../../shared";

export interface StockItem {
  productId: string | Types.ObjectId;
  quantity: number;
  storeId: string;
}

export const reserveStock = async (items: StockItem[]): Promise<void> => {
  return sharedReserveStock(items);
};

export const restoreStock = async (items: StockItem[]): Promise<void> => {
  return sharedRestoreStock(items);
};

export const adjustStock = sharedAdjustStock;
