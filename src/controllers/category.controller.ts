import { Request, Response } from "express";
import { ResponseModel } from "../models/response.model";
import { sendResponse, buildErrorResponse } from "../utils/response.util";
import { Category } from "../models/category.model";
import { AppError } from "../utils/AppError";
import { parsePagination, buildPaginationResponse } from "../utils/pagination.util";

export const getCategories = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, string>);
    const filter: Record<string, any> = {
      isActive: true,
      isDeleted: false,
    };
    if (req.query.parentId) {
      filter.parentId = req.query.parentId;
    } else {
      filter.parentId = null;
    }

    const [items, total] = await Promise.all([
      Category.find(filter)
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      Category.countDocuments(filter),
    ]);

    response.data = {
      items,
      pagination: buildPaginationResponse(total, page, limit),
    };
    response.message = "Categories fetched";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const getCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const category = await Category.findOne({
      _id: req.params.categoryId,
      isDeleted: false,
    });
    if (!category) {
      throw new AppError("Category not found", 404);
    }
    response.data = category;
    response.message = "Category details";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const createCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 201,
    showMessage: true,
    message: "",
  };
  try {
    const category = await Category.create(req.body);
    response.data = category;
    response.message = "Category created";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.categoryId, isDeleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!category) {
      throw new AppError("Category not found", 404);
    }
    response.data = category;
    response.message = "Category updated";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.categoryId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!category) {
      throw new AppError("Category not found", 404);
    }
    response.message = "Category deleted";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
