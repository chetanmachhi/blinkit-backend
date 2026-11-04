import { Router } from "express";
import { validate } from "../../../shared";
import {
  handleGetCategories,
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  handleReorderCategories,
} from "../controllers/category.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { Permission } from "../constants/permissions";
import {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
} from "../validators/category.validator";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(Permission.CATEGORIES_READ), handleGetCategories);

router.post(
  "/",
  requirePermission(Permission.CATEGORIES_WRITE),
  validate({ body: createCategorySchema }),
  handleCreateCategory
);

router.patch(
  "/reorder",
  requirePermission(Permission.CATEGORIES_WRITE),
  validate({ body: reorderCategoriesSchema }),
  handleReorderCategories
);

router.patch(
  "/:categoryId",
  requirePermission(Permission.CATEGORIES_WRITE),
  validate({ params: categoryIdParamSchema, body: updateCategorySchema }),
  handleUpdateCategory
);

router.delete(
  "/:categoryId",
  requirePermission(Permission.CATEGORIES_WRITE),
  validate({ params: categoryIdParamSchema }),
  handleDeleteCategory
);

export default router;
