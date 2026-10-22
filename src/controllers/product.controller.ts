import { Request, Response } from "express";
import { ResponseModel } from "../models/response.model";
import { sendResponse, buildErrorResponse } from "../utils/response.util";
import { Product } from "../models/product.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import {
  parsePagination,
  buildPaginationResponse,
} from "../utils/pagination.util";
import { ProductSort } from "../constants/enums";
import { Role } from "../constants/enums";

export const getProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const { page, limit, skip } = parsePagination(
      req.query as Record<string, string>
    );
    const filter: Record<string, any> = {
      isAvailable: true,
      isDeleted: false,
    };

    if (req.query.storeId) {
      filter.storeId = req.query.storeId;
    } else if (req.storeId) {
      filter.storeId = req.storeId;
    }

    if (req.query.categoryId) {
      filter.categoryId = req.query.categoryId;
    }
    if (req.query.brand) {
      filter.brand = { $regex: req.query.brand, $options: "i" };
    }
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) {
        filter.price.$gte = parseInt(req.query.minPrice as string, 10);
      }
      if (req.query.maxPrice) {
        filter.price.$lte = parseInt(req.query.maxPrice as string, 10);
      }
    }
    if (req.query.inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    let sortObj: Record<string, 1 | -1> = { sortOrder: 1 };
    switch (req.query.sort) {
      case ProductSort.PRICE_ASC:
        sortObj = { price: 1 };
        break;
      case ProductSort.PRICE_DESC:
        sortObj = { price: -1 };
        break;
      case ProductSort.NEWEST:
        sortObj = { createdAt: -1 };
        break;
      case ProductSort.DISCOUNT:
        sortObj = { price: 1 };
        break;
    }

    let query = Product.find(filter);
    if (req.query.q) {
      query = Product.find({
        ...filter,
        $text: { $search: req.query.q as string },
      });
      if (!req.query.sort) {
        query = query.sort({ score: { $meta: "textScore" } });
      } else {
        query = query.sort(sortObj);
      }
    } else {
      query = query.sort(sortObj);
    }

    const [items, total] = await Promise.all([
      query.skip(skip).limit(limit),
      req.query.q
        ? Product.countDocuments({
            ...filter,
            $text: { $search: req.query.q as string },
          })
        : Product.countDocuments(filter),
    ]);

    response.data = {
      items,
      pagination: buildPaginationResponse(total, page, limit),
    };
    response.message = "Products fetched";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const getProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      isDeleted: false,
    });
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    response.data = product;
    response.message = "Product details";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const createProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 201,
    showMessage: true,
    message: "",
  };
  try {
    const admin = await User.findById(req.user!.id);
    if (admin && admin.role === Role.ADMIN && admin.storeIds.length > 0) {
      if (
        !admin.storeIds.some(
          (id) => id.toString() === req.body.storeId
        )
      ) {
        throw new AppError("Access denied to this store", 403);
      }
    }

    const product = await Product.create(req.body);
    response.data = product;
    response.message = "Product created";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      isDeleted: false,
    });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const admin = await User.findById(req.user!.id);
    if (admin && admin.role === Role.ADMIN && admin.storeIds.length > 0) {
      if (
        !admin.storeIds.some(
          (id) => id.toString() === product.storeId.toString()
        )
      ) {
        throw new AppError("Access denied to this store", 403);
      }
    }

    Object.assign(product, req.body);
    await product.save();
    response.data = product;
    response.message = "Product updated";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const updateStock = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      isDeleted: false,
    });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (req.body.stock !== undefined) {
      product.stock = req.body.stock;
    } else if (req.body.delta !== undefined) {
      product.stock = Math.max(0, product.stock + req.body.delta);
    }

    await product.save();
    response.data = product;
    response.message = "Stock updated";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.productId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    response.message = "Product deleted";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
