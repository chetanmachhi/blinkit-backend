import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { sendResponse } from "../utils/response.util";
import { ResponseModel } from "../models/response.model";

interface ValidationSchemas {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
}

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        const field = firstIssue.path.join(".");
        const message = field
          ? `${field}: ${firstIssue.message}`
          : firstIssue.message;
        const response: ResponseModel = {
          statusCode: 400,
          showMessage: true,
          message,
        };
        sendResponse(response, res);
        return;
      }
      next(err);
    }
  };
};
