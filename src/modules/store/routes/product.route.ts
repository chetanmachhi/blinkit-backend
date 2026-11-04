import { Router } from "express";
import { validate } from "../../../shared";
import {
  handleGetProducts,
  handleGetProduct,
  handleCreateProduct,
  handleUpdateProduct,
  handleQuickUpdateProduct,
  handleUpdateProductStock,
  handleSoftDeleteProduct,
  handleRestoreProduct,
  handleGetLowStockProducts,
  handleExportProducts,
  handleBulkImportProducts,
} from "../controllers/product.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { storeScope } from "../middlewares/storeScope.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { Permission } from "../constants/permissions";
import {
  productIdParamSchema,
  productListQuerySchema,
  createProductSchema,
  updateProductSchema,
  quickUpdateProductSchema,
  updateStockSchema,
  bulkImportSchema,
} from "../validators/product.validator";

const router = Router();

router.use(authenticate, storeScope);

router.get(
  "/low-stock",
  requirePermission(Permission.PRODUCTS_READ),
  handleGetLowStockProducts
);

router.get(
  "/export",
  requirePermission(Permission.PRODUCTS_READ),
  handleExportProducts
);

router.post(
  "/bulk-import",
  requirePermission(Permission.PRODUCTS_WRITE),
  validate({ body: bulkImportSchema }),
  handleBulkImportProducts
);

router.get(
  "/",
  requirePermission(Permission.PRODUCTS_READ),
  validate({ query: productListQuerySchema }),
  handleGetProducts
);

router.post(
  "/",
  requirePermission(Permission.PRODUCTS_WRITE),
  validate({ body: createProductSchema }),
  handleCreateProduct
);

router.get(
  "/:productId",
  requirePermission(Permission.PRODUCTS_READ),
  validate({ params: productIdParamSchema }),
  handleGetProduct
);

router.patch(
  "/:productId",
  requirePermission(Permission.PRODUCTS_WRITE),
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  handleUpdateProduct
);

router.patch(
  "/:productId/quick",
  requirePermission(Permission.PRODUCTS_STOCK),
  validate({ params: productIdParamSchema, body: quickUpdateProductSchema }),
  handleQuickUpdateProduct
);

router.patch(
  "/:productId/stock",
  requirePermission(Permission.PRODUCTS_STOCK),
  validate({ params: productIdParamSchema, body: updateStockSchema }),
  handleUpdateProductStock
);

router.delete(
  "/:productId",
  requirePermission(Permission.PRODUCTS_WRITE),
  validate({ params: productIdParamSchema }),
  handleSoftDeleteProduct
);

router.post(
  "/:productId/restore",
  requirePermission(Permission.PRODUCTS_WRITE),
  validate({ params: productIdParamSchema }),
  handleRestoreProduct
);

export default router;
