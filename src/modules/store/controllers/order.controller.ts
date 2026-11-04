import { Request, Response } from "express";
import {
  ResponseModel,
  sendResponse,
  buildErrorResponse,
  OrderStatus,
} from "../../../shared";
import {
  getLiveOrdersData,
  getOrdersPaginated,
  getOrderById,
  acceptPlacedOrder,
  rejectPlacedOrder,
  progressOrderStatus,
  cancelActiveOrder,
  updateOrderPayment,
  updateOrderNote,
} from "../services/order.service";

export const handleGetLiveOrders = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Live orders board data fetched",
  };
  try {
    const storeId = req.storeId!;
    const data = await getLiveOrdersData(storeId);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleGetOrders = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Orders fetched",
  };
  try {
    const storeId = req.storeId!;
    const data = await getOrdersPaginated(storeId, req.query);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleGetOrder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Order details fetched",
  };
  try {
    const storeId = req.storeId!;
    const data = await getOrderById(storeId, req.params.orderId);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleAcceptOrder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Order accepted successfully",
  };
  try {
    const storeId = req.storeId!;
    const actingUserId = req.user!.id;
    const { prepMinutes } = req.body;
    const data = await acceptPlacedOrder(
      storeId,
      req.params.orderId,
      actingUserId,
      prepMinutes
    );
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleRejectOrder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Order rejected and stock restored",
  };
  try {
    const storeId = req.storeId!;
    const actingUserId = req.user!.id;
    const { reason } = req.body;
    const data = await rejectPlacedOrder(
      storeId,
      req.params.orderId,
      actingUserId,
      reason
    );
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleProgressStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: `Order status updated to ${req.body.status}`,
  };
  try {
    const storeId = req.storeId!;
    const actingUserId = req.user!.id;
    const { status, note } = req.body;
    const data = await progressOrderStatus(
      storeId,
      req.params.orderId,
      actingUserId,
      status as OrderStatus,
      note
    );
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleCancelOrder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Order cancelled and stock restored",
  };
  try {
    const storeId = req.storeId!;
    const actingUserId = req.user!.id;
    const { reason } = req.body;
    const data = await cancelActiveOrder(
      storeId,
      req.params.orderId,
      actingUserId,
      reason
    );
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleUpdatePayment = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Payment status updated",
  };
  try {
    const storeId = req.storeId!;
    const data = await updateOrderPayment(
      storeId,
      req.params.orderId,
      req.body.paymentStatus
    );
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleUpdateNote = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Internal note saved",
  };
  try {
    const storeId = req.storeId!;
    const data = await updateOrderNote(
      storeId,
      req.params.orderId,
      req.body.internalNote
    );
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
