import { Request, Response } from "express";
import {
  ResponseModel,
  sendResponse,
  buildErrorResponse,
  User,
} from "../../../shared";
import {
  listStores,
  getStoreById,
  updateStoreSettings,
  setAcceptingOrders,
} from "../services/store.service";

export const handleGetStores = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Stores fetched",
  };
  try {
    const user = await User.findById(req.user!.id);
    const storeIds = (user?.storeIds || []).map((id) => id.toString());
    const stores = await listStores(storeIds);
    response.data = stores;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleGetStore = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Store details fetched",
  };
  try {
    const store = await getStoreById(req.params.storeId);
    response.data = store;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleUpdateStore = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Store settings updated successfully",
  };
  try {
    const store = await updateStoreSettings(req.params.storeId, req.body);
    response.data = store;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleUpdateAccepting = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: req.body.isAcceptingOrders
      ? "Store is now accepting orders"
      : "Store order acceptance paused",
  };
  try {
    const store = await setAcceptingOrders(
      req.params.storeId,
      req.body.isAcceptingOrders,
      req.body.reason
    );
    response.data = store;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
