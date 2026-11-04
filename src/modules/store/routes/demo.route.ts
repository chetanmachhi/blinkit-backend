import { Router } from "express";
import { validate } from "../../../shared";
import {
  handleCreateDemoOrders,
  handleResetDemoOrders,
} from "../controllers/demo.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { storeScope } from "../middlewares/storeScope.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { Permission } from "../constants/permissions";
import { createDemoOrdersSchema } from "../validators/demo.validator";

const router = Router();

router.use(authenticate, storeScope, requirePermission(Permission.DEMO_TOOLS));

router.post("/orders", validate({ body: createDemoOrdersSchema }), handleCreateDemoOrders);
router.post("/reset", handleResetDemoOrders);

export default router;
