import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Store } from "../models/store.model";
import { sendResponse } from "../utils/response.util";
import { ResponseModel } from "../models/response.model";
import config from "../config/env";

export const storeContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const storeId =
    (req.headers["x-store-id"] as string) ||
    (req.query.storeId as string) ||
    config.DEFAULT_STORE_ID;

  if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
    const response: ResponseModel = {
      statusCode: 400,
      showMessage: true,
      message: "Valid store ID is required",
    };
    sendResponse(response, res);
    return;
  }

  const store = await Store.findOne({ _id: storeId, isActive: true });
  if (!store) {
    const response: ResponseModel = {
      statusCode: 404,
      showMessage: true,
      message: "Store not found or inactive",
    };
    sendResponse(response, res);
    return;
  }

  req.storeId = storeId;
  next();
};
