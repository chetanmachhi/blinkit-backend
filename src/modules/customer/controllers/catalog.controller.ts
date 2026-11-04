import { Request, Response } from "express";
import { ResponseModel } from "../models/response.model";
import { sendResponse, buildErrorResponse } from "../utils/response.util";
import { Category } from "../models/category.model";
import { Product } from "../models/product.model";

export const getCatalogHome = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const storeId = req.storeId!;

    const categories = await Category.find({
      isActive: true,
      isDeleted: false,
      parentId: null,
    }).sort({ sortOrder: 1, name: 1 });

    const sections = await Promise.all(
      categories.map(async (cat) => {
        const products = await Product.find({
          storeId,
          categoryId: cat._id,
          isAvailable: true,
          isDeleted: false,
        })
          .sort({ sortOrder: 1, createdAt: -1 })
          .limit(10);

        return {
          category: cat,
          products,
        };
      })
    );

    response.data = sections;
    response.message = "Catalog home";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
