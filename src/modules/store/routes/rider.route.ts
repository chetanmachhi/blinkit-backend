import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { storeScope } from "../middlewares/storeScope.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { Permission } from "../constants/permissions";
import { handleListRiders } from "../controllers/rider.controller";

const router = Router();

router.use(authenticate, storeScope);

router.get("/", requirePermission(Permission.ORDERS_READ), handleListRiders);

export default router;
