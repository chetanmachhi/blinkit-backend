import { Response } from "express";
import {
  ResponseModel,
  sendResponse as sendResponseShared,
  buildErrorResponse as buildErrorResponseShared,
} from "../../../shared";
import config from "../config/env";

export const sendResponse = <T = any>(
  response: ResponseModel<T>,
  res: Response
): Response => {
  return sendResponseShared(response, res);
};

export const buildErrorResponse = (err: unknown): ResponseModel => {
  return buildErrorResponseShared(err, config.NODE_ENV === "production");
};
