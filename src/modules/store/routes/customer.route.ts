import { Router } from "express";
import {
  handleGetCustomers,
  handleGetCustomer,
} from "../controllers/customer.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { Permission } from "../constants/permissions";

const router = Router();

router.use(authenticate, requirePermission(Permission.CUSTOMERS_READ));

router.get("/", handleGetCustomers);
router.get("/:userId", handleGetCustomer);

export default router;
