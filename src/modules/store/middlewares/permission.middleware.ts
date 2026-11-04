import { Request, Response, NextFunction } from "express";
import { sendResponse, ResponseModel } from "../../../shared";
import { Permission, hasPermission } from "../constants/permissions";

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !hasPermission(req.user.storeRole, permission)) {
      const response: ResponseModel = {
        statusCode: 403,
        showMessage: true,
        message: `Forbidden: permission "${permission}" required`,
      };
      sendResponse(response, res);
      return;
    }
    next();
  };
};
