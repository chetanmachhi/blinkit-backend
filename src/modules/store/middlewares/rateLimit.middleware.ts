import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { sendResponse, ResponseModel } from "../../../shared";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req: Request): string => {
    const email = (req.body?.email || "").toLowerCase().trim();
    return `${req.ip}_${email}`;
  },
  handler: (_req: Request, res: Response): void => {
    const response: ResponseModel = {
      statusCode: 429,
      showMessage: true,
      message: "Too many login attempts. Please try again after 15 minutes.",
    };
    sendResponse(response, res);
  },
  standardHeaders: true,
  legacyHeaders: false,
});
