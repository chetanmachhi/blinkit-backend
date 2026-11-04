import { Request, Response } from "express";
import {
  ResponseModel,
  sendResponse,
  buildErrorResponse,
} from "../../../shared";
import {
  getProductsPaginated,
  getProductById,
  createNewProduct,
  updateProductDetails,
  quickUpdateProduct,
  updateProductStockOnly,
  softDeleteProduct,
  restoreSoftDeletedProduct,
  getLowStockProductsList,
  exportProductsList,
  processBulkImport,
} from "../services/product.service";

export const handleGetProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Products fetched",
  };
  try {
    const storeId = req.storeId!;
    const data = await getProductsPaginated(storeId, req.query);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleGetProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Product details fetched",
  };
  try {
    const storeId = req.storeId!;
    const data = await getProductById(storeId, req.params.productId);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleCreateProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 201,
    showMessage: true,
    message: "Product created successfully",
  };
  try {
    const storeId = req.storeId!;
    const data = await createNewProduct(storeId, req.body);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleUpdateProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Product updated successfully",
  };
  try {
    const storeId = req.storeId!;
    const data = await updateProductDetails(storeId, req.params.productId, req.body);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleQuickUpdateProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Product updated",
  };
  try {
    const storeId = req.storeId!;
    const data = await quickUpdateProduct(storeId, req.params.productId, req.body);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleUpdateProductStock = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Stock updated successfully",
  };
  try {
    const storeId = req.storeId!;
    const data = await updateProductStockOnly(
      storeId,
      req.params.productId,
      req.body
    );
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleSoftDeleteProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Product deleted successfully",
  };
  try {
    const storeId = req.storeId!;
    await softDeleteProduct(storeId, req.params.productId);
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleRestoreProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Product restored successfully",
  };
  try {
    const storeId = req.storeId!;
    const data = await restoreSoftDeletedProduct(storeId, req.params.productId);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleGetLowStockProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Low stock products fetched",
  };
  try {
    const storeId = req.storeId!;
    const data = await getLowStockProductsList(storeId);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleExportProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Products export data generated",
  };
  try {
    const storeId = req.storeId!;
    const data = await exportProductsList(storeId);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleBulkImportProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: req.body.dryRun ? "Dry run completed" : "Bulk import finished",
  };
  try {
    const storeId = req.storeId!;
    const { dryRun, rows } = req.body;
    const data = await processBulkImport(storeId, dryRun, rows);
    response.data = data;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
