import { Router } from "express";
import { validate } from "../../../shared";
import {
  handleGetCoupons,
  handleGetCoupon,
  handleCreateCoupon,
  handleUpdateCoupon,
  handleDeleteCoupon,
  handleGetCouponUsage,
} from "../controllers/coupon.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { storeScope } from "../middlewares/storeScope.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { Permission } from "../constants/permissions";
import {
  couponIdParamSchema,
  createCouponSchema,
  updateCouponSchema,
} from "../validators/coupon.validator";

const router = Router();

router.use(authenticate, storeScope);

router.get("/", requirePermission(Permission.COUPONS_READ), handleGetCoupons);

router.post(
  "/",
  requirePermission(Permission.COUPONS_WRITE),
  validate({ body: createCouponSchema }),
  handleCreateCoupon
);

router.get(
  "/:couponId",
  requirePermission(Permission.COUPONS_READ),
  validate({ params: couponIdParamSchema }),
  handleGetCoupon
);

router.patch(
  "/:couponId",
  requirePermission(Permission.COUPONS_WRITE),
  validate({ params: couponIdParamSchema, body: updateCouponSchema }),
  handleUpdateCoupon
);

router.delete(
  "/:couponId",
  requirePermission(Permission.COUPONS_WRITE),
  validate({ params: couponIdParamSchema }),
  handleDeleteCoupon
);

router.get(
  "/:couponId/usage",
  requirePermission(Permission.COUPONS_READ),
  validate({ params: couponIdParamSchema }),
  handleGetCouponUsage
);

export default router;
