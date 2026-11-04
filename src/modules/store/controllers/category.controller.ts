import { Request, Response } from "express";
import {
  ResponseModel,
  sendResponse,
  buildErrorResponse,
} from "../../../shared";
import {
  getCategoriesList,
  createCategory,
  updateCategory,
  softDeleteCategory,
  reorderCategories,
} from "../services/category.service";

export const handleGetCategories = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Categories fetched",
  };
  try {
    const asTree = req.query.tree === "true";
    const data = await getCategoriesList(asTree);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleCreateCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 201,
    showMessage: true,
    message: "Category created successfully",
  };
  try {
    const category = await createCategory(req.body);
    response.data = category;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleUpdateCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Category updated successfully",
  };
  try {
    const category = await updateCategory(req.params.categoryId, req.body);
    response.data = category;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleDeleteCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Category deleted successfully",
  };
  try {
    await softDeleteCategory(req.params.categoryId);
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleReorderCategories = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Categories reordered successfully",
  };
  try {
    await reorderCategories(req.body);
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
