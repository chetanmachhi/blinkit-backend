import { Router } from "express";
import {
  getDashboard,
  getLowStockProducts,
  getAdminUsers,
} from "../controllers/admin.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { Role } from "../constants/enums";
import {
  dashboardQuerySchema,
  lowStockQuerySchema,
  adminUsersQuerySchema,
} from "../validators/common.validator";

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

router.get(
  "/dashboard",
  validate({ query: dashboardQuerySchema }),
  getDashboard
);

router.get(
  "/low-stock",
  validate({ query: lowStockQuerySchema }),
  getLowStockProducts
);

router.get(
  "/users",
  validate({ query: adminUsersQuerySchema }),
  getAdminUsers
);

export default router;
