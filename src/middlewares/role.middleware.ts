import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/response.util";
import { ResponseModel } from "../models/response.model";

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
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
