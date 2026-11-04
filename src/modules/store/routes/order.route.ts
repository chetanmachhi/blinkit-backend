import { Router } from "express";
import { validate } from "../../../shared";
import {
  handleGetLiveOrders,
  handleGetOrders,
  handleGetOrder,
  handleAcceptOrder,
  handleRejectOrder,
  handleProgressStatus,
  handleCancelOrder,
  handleUpdatePayment,
  handleUpdateNote,
} from "../controllers/order.controller";
import { handleAssignRider } from "../controllers/rider.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { storeScope } from "../middlewares/storeScope.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { Permission } from "../constants/permissions";
import {
  orderIdParamSchema,
  orderListQuerySchema,
  acceptOrderSchema,
  rejectOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  updatePaymentSchema,
  updateNoteSchema,
  assignRiderSchema,
} from "../validators/order.validator";

const router = Router();

router.use(authenticate, storeScope);

router.get(
  "/live",
  requirePermission(Permission.ORDERS_READ),
  handleGetLiveOrders
);

router.get(
  "/",
  requirePermission(Permission.ORDERS_READ),
  validate({ query: orderListQuerySchema }),
  handleGetOrders
);

router.get(
  "/:orderId",
  requirePermission(Permission.ORDERS_READ),
  validate({ params: orderIdParamSchema }),
  handleGetOrder
);

router.post(
  "/:orderId/accept",
  requirePermission(Permission.ORDERS_WRITE),
  validate({ params: orderIdParamSchema, body: acceptOrderSchema }),
  handleAcceptOrder
);

router.post(
  "/:orderId/reject",
  requirePermission(Permission.ORDERS_WRITE),
  validate({ params: orderIdParamSchema, body: rejectOrderSchema }),
  handleRejectOrder
);

router.post(
  "/:orderId/status",
  requirePermission(Permission.ORDERS_WRITE),
  validate({ params: orderIdParamSchema, body: updateOrderStatusSchema }),
  handleProgressStatus
);

router.post(
  "/:orderId/cancel",
  requirePermission(Permission.ORDERS_WRITE),
  validate({ params: orderIdParamSchema, body: cancelOrderSchema }),
  handleCancelOrder
);

router.patch(
  "/:orderId/payment",
  requirePermission(Permission.ORDERS_WRITE),
  validate({ params: orderIdParamSchema, body: updatePaymentSchema }),
  handleUpdatePayment
);

router.patch(
  "/:orderId/note",
  requirePermission(Permission.ORDERS_WRITE),
  validate({ params: orderIdParamSchema, body: updateNoteSchema }),
  handleUpdateNote
);

router.post(
  "/:orderId/assign-rider",
  requirePermission(Permission.ORDERS_WRITE),
  validate({ params: orderIdParamSchema, body: assignRiderSchema }),
  handleAssignRider
);

export default router;
