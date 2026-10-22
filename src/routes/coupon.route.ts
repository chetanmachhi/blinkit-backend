import { Router } from "express";
import {
  getApplicableCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAllCouponsAdmin,
} from "../controllers/coupon.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { storeContext } from "../middlewares/storeContext.middleware";
import { validate } from "../middlewares/validate.middleware";
import { Role } from "../constants/enums";
import { paginationQuerySchema } from "../validators/common.validator";
import {
  createCouponSchema,
  updateCouponSchema,
  couponIdParamSchema,
} from "../validators/coupon.validator";

const router = Router();

router.get("/applicable", storeContext, getApplicableCoupons);

router.get(
  "/admin",
  authenticate,
  authorize(Role.ADMIN),
  validate({ query: paginationQuerySchema }),
  getAllCouponsAdmin
);

router.post(
  "/",
  authenticate,
  authorize(Role.ADMIN),
  validate({ body: createCouponSchema }),
  createCoupon
);

router.patch(
  "/:couponId",
  authenticate,
  authorize(Role.ADMIN),
  validate({
    params: couponIdParamSchema,
    body: updateCouponSchema,
  }),
  updateCoupon
);

router.delete(
  "/:couponId",
  authenticate,
  authorize(Role.ADMIN),
  validate({ params: couponIdParamSchema }),
  deleteCoupon
);

export default router;
