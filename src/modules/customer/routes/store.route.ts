import { Router } from "express";
import {
  getStores,
  getNearbyStores,
  getStore,
  getServiceability,
  createStore,
  updateStore,
} from "../controllers/store.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { Role } from "../constants/enums";
import {
  createStoreSchema,
  updateStoreSchema,
  storeIdParamSchema,
  nearbyQuerySchema,
  serviceabilityQuerySchema,
} from "../validators/store.validator";

const router = Router();

router.get("/", getStores);

router.get(
  "/nearby",
  validate({ query: nearbyQuerySchema }),
  getNearbyStores
);

router.post(
  "/",
  authenticate,
  authorize(Role.ADMIN),
  validate({ body: createStoreSchema }),
  createStore
);

router.get(
  "/:storeId/serviceability",
  validate({
    params: storeIdParamSchema,
    query: serviceabilityQuerySchema,
  }),
  getServiceability
);

router.get(
  "/:storeId",
  validate({ params: storeIdParamSchema }),
  getStore
);

router.patch(
  "/:storeId",
  authenticate,
  authorize(Role.ADMIN),
  validate({
    params: storeIdParamSchema,
    body: updateStoreSchema,
  }),
  updateStore
);

export default router;
