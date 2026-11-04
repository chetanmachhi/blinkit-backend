import { Request, Response } from "express";
import {
  ResponseModel,
  sendResponse,
  buildErrorResponse,
  AppError,
} from "../../../shared";
import config from "../config/env";
import {
  generateDemoOrders,
  resetAllDemoOrders,
} from "../services/demo.service";

export const handleCreateDemoOrders = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!config.ENABLE_DEMO_TOOLS) {
    return sendResponse(
      {
        statusCode: 404,
        showMessage: true,
        message: "Demo tools not enabled",
      },
      res
    );
  }

  const response: ResponseModel = {
    statusCode: 201,
    showMessage: true,
    message: "Demo orders created successfully",
  };
  try {
    const storeId = req.storeId!;
    const count = req.body.count || 1;
    const data = await generateDemoOrders(storeId, count);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleResetDemoOrders = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!config.ENABLE_DEMO_TOOLS) {
    return sendResponse(
      {
        statusCode: 404,
        showMessage: true,
        message: "Demo tools not enabled",
      },
      res
    );
  }

  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Demo orders purged and stock restored",
  };
  try {
    const storeId = req.storeId!;
    const data = await resetAllDemoOrders(storeId);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
