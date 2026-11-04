import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { User, Store, sendResponse, ResponseModel } from "../../../shared";
import config from "../config/env";

export const storeScope = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const storeId =
    (req.headers["x-store-id"] as string) ||
    req.params.storeId ||
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

  const store = await Store.findById(storeId);
  if (!store) {
    const response: ResponseModel = {
      statusCode: 404,
      showMessage: true,
      message: "Store not found",
    };
    sendResponse(response, res);
    return;
  }

  if (req.user?.id) {
    const user = await User.findById(req.user.id);
    if (user && user.storeIds && user.storeIds.length > 0) {
      const isAssigned = user.storeIds.some(
        (id) => id.toString() === storeId
      );
      if (!isAssigned) {
        const response: ResponseModel = {
          statusCode: 403,
          showMessage: true,
          message: "Forbidden: store access not assigned to user",
        };
        sendResponse(response, res);
        return;
      }
    }
  }

  req.storeId = storeId;
  next();
};
