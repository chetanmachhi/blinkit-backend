import { Request, Response } from "express";
import { ResponseModel } from "../models/response.model";
import { sendResponse, buildErrorResponse } from "../utils/response.util";
import { User } from "../models/user.model";
import { logoutAll } from "../services/auth.service";
import { AppError } from "../utils/AppError";

export const getMe = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    response.data = user;
    response.message = "User profile";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const updateMe = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!user) {
      throw new AppError("User not found", 404);
    }
    response.data = user;
    response.message = "Profile updated";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const deleteMe = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    await User.findByIdAndUpdate(req.user!.id, {
      isActive: false,
    });
    await logoutAll(req.user!.id);
    response.message = "Account deactivated";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
