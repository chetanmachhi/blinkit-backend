import { Request, Response, NextFunction } from "express";
import {
  createAuthMiddleware,
  sendResponse,
  ResponseModel,
  User,
  Role,
  StoreRole,
} from "../../../shared";
import config from "../config/env";

const baseAuthenticate = createAuthMiddleware({
  accessSecret: config.JWT_ACCESS_SECRET,
});

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  baseAuthenticate(req, res, async () => {
    if (!req.user) {
      return;
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user || !user.isActive) {
        const response: ResponseModel = {
          statusCode: 401,
          showMessage: true,
          message: "Account inactive or not found",
        };
        sendResponse(response, res);
        return;
      }

      if (user.role !== Role.ADMIN) {
        const response: ResponseModel = {
          statusCode: 403,
          showMessage: true,
          message: "Forbidden: store admin access required",
        };
        sendResponse(response, res);
        return;
      }

      req.user.storeRole = user.storeRole || StoreRole.STAFF;
      next();
    } catch (error) {
      next(error);
    }
  });
};
