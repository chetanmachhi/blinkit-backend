import { Router } from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { Role } from "../constants/enums";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  categoryQuerySchema,
} from "../validators/category.validator";

const router = Router();

router.get(
  "/",
  validate({ query: categoryQuerySchema }),
  getCategories
);

router.post(
  "/",
  authenticate,
  authorize(Role.ADMIN),
  validate({ body: createCategorySchema }),
  createCategory
);

router.get(
  "/:categoryId",
  validate({ params: categoryIdParamSchema }),
  getCategory
);

router.patch(
  "/:categoryId",
  authenticate,
  authorize(Role.ADMIN),
  validate({
    params: categoryIdParamSchema,
    body: updateCategorySchema,
  }),
  updateCategory
);

router.delete(
  "/:categoryId",
  authenticate,
  authorize(Role.ADMIN),
  validate({ params: categoryIdParamSchema }),
  deleteCategory
);

export default router;
