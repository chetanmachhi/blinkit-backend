import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/response.util";
import { ResponseModel } from "../models/response.model";

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      const response: ResponseModel = {
        statusCode: 403,
        showMessage: true,
        message: "Forbidden: insufficient permissions",
      };
      sendResponse(response, res);
      return;
    }
    next();
  };
};

export const authorize = requireRole;
