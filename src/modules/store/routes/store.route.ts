import { Router } from "express";
import { validate } from "../../../shared";
import {
  handleGetStores,
  handleGetStore,
  handleUpdateStore,
  handleUpdateAccepting,
} from "../controllers/store.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { Permission } from "../constants/permissions";
import {
  storeIdParamSchema,
  updateStoreSchema,
  updateAcceptingSchema,
} from "../validators/store.validator";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(Permission.STORE_READ), handleGetStores);

router.get(
  "/:storeId",
  requirePermission(Permission.STORE_READ),
  validate({ params: storeIdParamSchema }),
  handleGetStore
);

router.patch(
  "/:storeId",
  requirePermission(Permission.STORE_WRITE),
  validate({ params: storeIdParamSchema, body: updateStoreSchema }),
  handleUpdateStore
);

router.patch(
  "/:storeId/accepting",
  requirePermission(Permission.STORE_ACCEPTING),
  validate({ params: storeIdParamSchema, body: updateAcceptingSchema }),
  handleUpdateAccepting
);

export default router;
