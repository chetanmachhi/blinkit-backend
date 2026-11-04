import { Request, Response, NextFunction } from "express";
import {
  createAuthMiddleware,
  sendResponse,
  User,
  Role,
} from "../../../shared";
import config from "../config/env";

const verifyToken = createAuthMiddleware({
  accessSecret: config.JWT_ACCESS_SECRET,
});

/** Valid JWT + the account must still be an active rider. */
export const authenticateRider = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  verifyToken(req, res, async () => {
    try {
      const user = req.user ? await User.findById(req.user.id) : null;
      if (!user || !user.isActive) {
        sendResponse(
          { statusCode: 401, showMessage: true, message: "Account inactive or not found" },
          res
        );
        return;
      }
      if (user.role !== Role.RIDER) {
        sendResponse(
          { statusCode: 403, showMessage: true, message: "Forbidden: rider access required" },
          res
        );
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  });
};
