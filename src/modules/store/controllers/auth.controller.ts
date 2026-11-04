import { Request, Response } from "express";
import {
  ResponseModel,
  sendResponse,
  buildErrorResponse,
} from "../../../shared";
import {
  loginStoreUser,
  refreshStoreToken,
  logoutStoreUser,
  logoutAllStoreSessions,
  changeStoreUserPassword,
  getStoreAuthMe,
} from "../services/auth.service";

export const handleLogin = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Login successful",
  };
  try {
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"] || "web";
    const data = await loginStoreUser(email, password, userAgent);
    response.data = data;
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
    message: "Token refreshed",
  };
  try {
    const { refreshToken } = req.body;
    const userAgent = req.headers["user-agent"] || "web";
    const data = await refreshStoreToken(refreshToken, userAgent);
    response.data = data;
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
    message: "Logged out successfully",
  };
  try {
    const userId = req.user!.id;
    const { refreshToken } = req.body || {};
    await logoutStoreUser(userId, refreshToken);
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
    message: "Logged out from all devices",
  };
  try {
    const userId = req.user!.id;
    await logoutAllStoreSessions(userId);
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleChangePassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Password changed successfully. Other sessions revoked.",
  };
  try {
    const userId = req.user!.id;
    const { oldPassword, newPassword } = req.body;
    await changeStoreUserPassword(userId, oldPassword, newPassword);
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleGetMe = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Current user profile",
  };
  try {
    const userId = req.user!.id;
    const data = await getStoreAuthMe(userId);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
