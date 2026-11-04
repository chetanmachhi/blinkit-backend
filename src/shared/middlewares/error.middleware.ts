import { Request, Response, NextFunction } from "express";
import { sendResponse, buildErrorResponse } from "../utils/response.util";

export interface ErrorHandlerOptions {
  isProduction?: boolean;
}

export const createErrorHandler = (options: ErrorHandlerOptions = {}) => {
  return (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    if (res.headersSent) {
      return;
    }
    const response = buildErrorResponse(err, options.isProduction ?? false);
    sendResponse(response, res);
  };
};

export const errorHandler = createErrorHandler();
