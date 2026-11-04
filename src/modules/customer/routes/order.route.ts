import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrder,
  trackOrder,
  cancelOrder,
  reorder,
  getStoreOrders,
  updateOrderStatus,
} from "../controllers/order.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { storeContext } from "../middlewares/storeContext.middleware";
import { validate } from "../middlewares/validate.middleware";
import { Role } from "../constants/enums";
import {
  createOrderSchema,
  orderIdParamSchema,
  cancelOrderSchema,
  updateOrderStatusSchema,
  orderListQuerySchema,
  storeOrdersQuerySchema,
  storeOrdersParamSchema,
} from "../validators/order.validator";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  storeContext,
  validate({ body: createOrderSchema }),
  createOrder
);

router.get(
  "/",
  validate({ query: orderListQuerySchema }),
  getOrders
);

router.get(
  "/store/:storeId",
  authorize(Role.ADMIN),
  validate({
    params: storeOrdersParamSchema,
    query: storeOrdersQuerySchema,
  }),
  getStoreOrders
);

router.get(
  "/:orderId/track",
  validate({ params: orderIdParamSchema }),
  trackOrder
);

router.post(
  "/:orderId/cancel",
  validate({
    params: orderIdParamSchema,
    body: cancelOrderSchema,
  }),
  cancelOrder
);

router.post(
  "/:orderId/reorder",
  validate({ params: orderIdParamSchema }),
  reorder
);

router.patch(
  "/:orderId/status",
  authorize(Role.ADMIN),
  validate({
    params: orderIdParamSchema,
    body: updateOrderStatusSchema,
  }),
  updateOrderStatus
);

router.get(
  "/:orderId",
  validate({ params: orderIdParamSchema }),
  getOrder
);

export default router;
