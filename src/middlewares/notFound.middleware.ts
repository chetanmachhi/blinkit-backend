import { Request, Response } from "express";
import { sendResponse } from "../utils/response.util";
import { ResponseModel } from "../models/response.model";

export const notFoundHandler = (_req: Request, res: Response): void => {
  const response: ResponseModel = {
    statusCode: 404,
    showMessage: true,
    message: "Route Not Found",
    error: "NOT_FOUND",
  };
  sendResponse(response, res);
};
