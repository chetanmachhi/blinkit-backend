import { Router } from "express";
import { validate } from "../../../shared";
import {
  handleGetDashboard,
  handleGetSalesReport,
  handleGetTopProducts,
  handleGetCategorySales,
} from "../controllers/dashboard.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { storeScope } from "../middlewares/storeScope.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { Permission } from "../constants/permissions";
import {
  dashboardQuerySchema,
  salesReportQuerySchema,
  topProductsQuerySchema,
  categorySalesQuerySchema,
} from "../validators/dashboard.validator";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate, storeScope);
dashboardRouter.get(
  "/",
  requirePermission(Permission.DASHBOARD_READ),
  validate({ query: dashboardQuerySchema }),
  handleGetDashboard
);

export const reportsRouter = Router();
reportsRouter.use(authenticate, storeScope);
reportsRouter.get(
  "/sales",
  requirePermission(Permission.REPORTS_READ),
  validate({ query: salesReportQuerySchema }),
  handleGetSalesReport
);
reportsRouter.get(
  "/top-products",
  requirePermission(Permission.REPORTS_READ),
  validate({ query: topProductsQuerySchema }),
  handleGetTopProducts
);
reportsRouter.get(
  "/category-sales",
  requirePermission(Permission.REPORTS_READ),
  validate({ query: categorySalesQuerySchema }),
  handleGetCategorySales
);
