import { Request, Response } from "express";
import { ResponseModel } from "../models/response.model";
import { sendResponse, buildErrorResponse } from "../utils/response.util";
import { Coupon } from "../models/coupon.model";
import { AppError } from "../utils/AppError";
import { parsePagination, buildPaginationResponse } from "../utils/pagination.util";

export const getApplicableCoupons = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const now = new Date();
    const storeId = req.storeId!;

    const coupons = await Coupon.find({
      isActive: true,
      isDeleted: false,
      validFrom: { $lte: now },
      validTo: { $gte: now },
      $or: [{ storeId: null }, { storeId }],
    }).sort({ createdAt: -1 });

    response.data = coupons;
    response.message = "Applicable coupons";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const createCoupon = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 201,
    showMessage: true,
    message: "",
  };
  try {
    const coupon = await Coupon.create({
      ...req.body,
      validFrom: new Date(req.body.validFrom),
      validTo: new Date(req.body.validTo),
    });
    response.data = coupon;
    response.message = "Coupon created";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const updateCoupon = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const updateData: Record<string, any> = { ...req.body };
    if (updateData.validFrom) {
      updateData.validFrom = new Date(updateData.validFrom);
    }
    if (updateData.validTo) {
      updateData.validTo = new Date(updateData.validTo);
    }

    const coupon = await Coupon.findOneAndUpdate(
      { _id: req.params.couponId, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!coupon) {
      throw new AppError("Coupon not found", 404);
    }
    response.data = coupon;
    response.message = "Coupon updated";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const deleteCoupon = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const coupon = await Coupon.findOneAndUpdate(
      { _id: req.params.couponId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!coupon) {
      throw new AppError("Coupon not found", 404);
    }
    response.message = "Coupon deleted";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const getAllCouponsAdmin = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const { page, limit, skip } = parsePagination(
      req.query as Record<string, string>
    );

    const [items, total] = await Promise.all([
      Coupon.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Coupon.countDocuments({ isDeleted: false }),
    ]);

    response.data = {
      items,
      pagination: buildPaginationResponse(total, page, limit),
    };
    response.message = "All coupons";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
