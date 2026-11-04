import { Request, Response } from "express";
import {
  ResponseModel,
  sendResponse,
  buildErrorResponse,
} from "../../../shared";
import {
  getDashboardAnalytics,
  getSalesReportData,
  getTopProductsReport,
  getCategorySalesReport,
} from "../services/dashboard.service";

export const handleGetDashboard = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Dashboard analytics calculated",
  };
  try {
    const storeId = req.storeId!;
    const data = await getDashboardAnalytics(storeId, req.query as any);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleGetSalesReport = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Sales report generated",
  };
  try {
    const storeId = req.storeId!;
    const data = await getSalesReportData(storeId, req.query as any);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleGetTopProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Top products report generated",
  };
  try {
    const storeId = req.storeId!;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const data = await getTopProductsReport(storeId, limit);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleGetCategorySales = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Category sales report generated",
  };
  try {
    const storeId = req.storeId!;
    const data = await getCategorySalesReport(storeId, req.query as any);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
