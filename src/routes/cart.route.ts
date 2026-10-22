import { Router } from "express";
import {
  getCart,
  upsertCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon,
} from "../controllers/cart.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { storeContext } from "../middlewares/storeContext.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  upsertCartItemSchema,
  removeCartItemParamSchema,
  applyCouponSchema,
} from "../validators/cart.validator";

const router = Router();

router.use(authenticate, storeContext);

router.get("/", getCart);

router.post(
  "/items",
  validate({ body: upsertCartItemSchema }),
  upsertCartItem
);

router.delete("/clear", clearCart);

router.delete(
  "/items/:productId",
  validate({ params: removeCartItemParamSchema }),
  removeCartItem
);

router.post(
  "/coupon",
  validate({ body: applyCouponSchema }),
  applyCoupon
);

router.delete("/coupon", removeCoupon);

export default router;
