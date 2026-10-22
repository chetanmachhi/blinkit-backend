import { Request, Response } from "express";
import { ResponseModel } from "../models/response.model";
import { sendResponse, buildErrorResponse } from "../utils/response.util";
import { requestOtp } from "../services/otp.service";
import {
  customerLogin,
  adminLogin,
  refreshTokens,
  logout,
  logoutAll,
} from "../services/auth.service";

export const handleRequestOtp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const result = await requestOtp(req.body.phone);
    response.data = result;
    response.message = result.message;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleVerifyOtp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const userAgent = req.headers["user-agent"] || "unknown";
    const result = await customerLogin(
      req.body.phone,
      req.body.otp,
      req.body.name,
      userAgent
    );
    response.statusCode = 200;
    response.data = result;
    response.message = "Login successful";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleRefresh = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const userAgent = req.headers["user-agent"] || "unknown";
    const tokens = await refreshTokens(req.body.refreshToken, userAgent);
    response.data = tokens;
    response.message = "Token refreshed";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleLogout = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    await logout(req.user!.id, req.body.refreshToken);
    response.message = "Logged out successfully";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleLogoutAll = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    await logoutAll(req.user!.id);
    response.message = "All sessions revoked";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleAdminLogin = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const userAgent = req.headers["user-agent"] || "unknown";
    const result = await adminLogin(
      req.body.email,
      req.body.password,
      userAgent
    );
    response.data = result;
    response.message = "Admin login successful";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
