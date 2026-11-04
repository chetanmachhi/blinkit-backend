import { Request, Response } from "express";
import { ResponseModel } from "../models/response.model";
import { sendResponse, buildErrorResponse } from "../utils/response.util";
import { Address } from "../models/address.model";
import { AppError } from "../utils/AppError";

export const getAddresses = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const addresses = await Address.find({
      userId: req.user!.id,
      isDeleted: false,
    }).sort({ isDefault: -1, createdAt: -1 });
    response.data = addresses;
    response.message = "Addresses fetched";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const createAddress = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 201,
    showMessage: true,
    message: "",
  };
  try {
    const existingCount = await Address.countDocuments({
      userId: req.user!.id,
      isDeleted: false,
    });

    const isDefault = existingCount === 0;

    const address = await Address.create({
      ...req.body,
      userId: req.user!.id,
      isDefault,
    });
    response.data = address;
    response.message = "Address saved";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const updateAddress = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const address = await Address.findOneAndUpdate(
      {
        _id: req.params.addressId,
        userId: req.user!.id,
        isDeleted: false,
      },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!address) {
      throw new AppError("Address not found", 404);
    }
    response.data = address;
    response.message = "Address updated";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const deleteAddress = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const address = await Address.findOneAndUpdate(
      {
        _id: req.params.addressId,
        userId: req.user!.id,
        isDeleted: false,
      },
      { isDeleted: true, isDefault: false },
      { new: true }
    );
    if (!address) {
      throw new AppError("Address not found", 404);
    }

    if (address.isDefault) {
      const next = await Address.findOne({
        userId: req.user!.id,
        isDeleted: false,
      }).sort({ createdAt: 1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    response.message = "Address deleted";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const setDefaultAddress = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const address = await Address.findOne({
      _id: req.params.addressId,
      userId: req.user!.id,
      isDeleted: false,
    });
    if (!address) {
      throw new AppError("Address not found", 404);
    }

    await Address.updateMany(
      { userId: req.user!.id, isDeleted: false },
      { isDefault: false }
    );

    address.isDefault = true;
    await address.save();

    response.data = address;
    response.message = "Default address updated";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
