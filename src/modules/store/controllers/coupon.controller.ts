import { Request, Response } from "express";
import {
  ResponseModel,
  sendResponse,
  buildErrorResponse,
} from "../../../shared";
import {
  getCouponsList,
  getCouponById,
  createNewCoupon,
  updateCouponDetails,
  softDeleteCoupon,
  getCouponUsageHistory,
} from "../services/coupon.service";

export const handleGetCoupons = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Coupons fetched",
  };
  try {
    const storeId = req.storeId;
    const data = await getCouponsList(storeId);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleGetCoupon = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Coupon details fetched",
  };
  try {
    const data = await getCouponById(req.params.couponId);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleCreateCoupon = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 201,
    showMessage: true,
    message: "Coupon created successfully",
  };
  try {
    const data = await createNewCoupon(req.body);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleUpdateCoupon = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Coupon updated successfully",
  };
  try {
    const data = await updateCouponDetails(req.params.couponId, req.body);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleDeleteCoupon = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Coupon deleted successfully",
  };
  try {
    await softDeleteCoupon(req.params.couponId);
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleGetCouponUsage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Coupon usage history fetched",
  };
  try {
    const data = await getCouponUsageHistory(req.params.couponId);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
