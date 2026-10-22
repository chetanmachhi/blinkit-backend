import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util";
import { sendResponse } from "../utils/response.util";
import { ResponseModel } from "../models/response.model";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const response: ResponseModel = {
      statusCode: 401,
      showMessage: true,
      message: "Authentication required",
    };
    sendResponse(response, res);
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    const response: ResponseModel = {
      statusCode: 401,
      showMessage: true,
      message: "Invalid or expired token",
    };
    sendResponse(response, res);
  }
};
