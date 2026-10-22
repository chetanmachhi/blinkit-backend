import { Request, Response, NextFunction } from "express";
import { sendResponse, buildErrorResponse } from "../utils/response.util";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (res.headersSent) {
    return;
  }
  const response = buildErrorResponse(err);
  sendResponse(response, res);
};
