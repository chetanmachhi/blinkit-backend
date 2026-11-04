import { Router } from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
} from "../controllers/product.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { Role } from "../constants/enums";
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  productIdParamSchema,
  productQuerySchema,
} from "../validators/product.validator";

const router = Router();

router.get(
  "/",
  validate({ query: productQuerySchema }),
  getProducts
);

router.post(
  "/",
  authenticate,
  authorize(Role.ADMIN),
  validate({ body: createProductSchema }),
  createProduct
);

router.patch(
  "/:productId/stock",
  authenticate,
  authorize(Role.ADMIN),
  validate({
    params: productIdParamSchema,
    body: updateStockSchema,
  }),
  updateStock
);

router.get(
  "/:productId",
  validate({ params: productIdParamSchema }),
  getProduct
);

router.patch(
  "/:productId",
  authenticate,
  authorize(Role.ADMIN),
  validate({
    params: productIdParamSchema,
    body: updateProductSchema,
  }),
  updateProduct
);

router.delete(
  "/:productId",
  authenticate,
  authorize(Role.ADMIN),
  validate({ params: productIdParamSchema }),
  deleteProduct
);

export default router;
