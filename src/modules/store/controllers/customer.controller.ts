import { Request, Response } from "express";
import {
  ResponseModel,
  sendResponse,
  buildErrorResponse,
} from "../../../shared";
import {
  getCustomersList,
  getCustomerDetails,
} from "../services/customer.service";

export const handleGetCustomers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Customers fetched",
  };
  try {
    const data = await getCustomersList(req.query);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleGetCustomer = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Customer profile and stats fetched",
  };
  try {
    const data = await getCustomerDetails(req.params.userId);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
