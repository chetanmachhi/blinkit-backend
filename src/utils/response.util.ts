import { Response } from "express";
import { ResponseModel } from "../models/response.model";
import { AppError } from "./AppError";
import config from "../config/env";

export const sendResponse = <T = any>(
  response: ResponseModel<T>,
  res: Response
): Response => {
  return res.status(response.statusCode).json(response);
};

export const buildErrorResponse = (err: unknown): ResponseModel => {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      showMessage: err.showMessage,
      message: err.message,
    };
  }

  if (err && typeof err === "object" && "name" in err) {
    const e = err as Record<string, any>;

    if (e.name === "CastError") {
      return {
        statusCode: 400,
        showMessage: true,
        message: `Invalid value for ${e.path}: ${e.value}`,
      };
    }

    if (e.name === "ValidationError" && e.errors) {
      const firstKey = Object.keys(e.errors)[0];
      const msg = e.errors[firstKey]?.message || "Validation failed";
      return {
        statusCode: 400,
        showMessage: true,
        message: msg,
      };
    }

    if (e.code === 11000) {
      const field = Object.keys(e.keyPattern || {})[0] || "field";
      return {
        statusCode: 409,
        showMessage: true,
        message: `Duplicate value for ${field}`,
      };
    }

    if (e.name === "JsonWebTokenError") {
      return {
        statusCode: 401,
        showMessage: true,
        message: "Invalid token",
      };
    }

    if (e.name === "TokenExpiredError") {
      return {
        statusCode: 401,
        showMessage: true,
        message: "Token expired",
      };
    }
  }

  const message =
    config.NODE_ENV === "production"
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Internal server error";

  return {
    statusCode: 500,
    showMessage: true,
    message,
  };
};
