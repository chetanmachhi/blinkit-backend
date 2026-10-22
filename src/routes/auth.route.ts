import { Router } from "express";
import {
  handleRequestOtp,
  handleVerifyOtp,
  handleRefresh,
  handleLogout,
  handleLogoutAll,
  handleAdminLogin,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { otpLimiter } from "../middlewares/rateLimit.middleware";
import {
  requestOtpSchema,
  verifyOtpSchema,
  refreshSchema,
  logoutSchema,
  adminLoginSchema,
} from "../validators/auth.validator";

const router = Router();

router.post(
  "/request-otp",
  otpLimiter,
  validate({ body: requestOtpSchema }),
  handleRequestOtp
);

router.post(
  "/verify-otp",
  validate({ body: verifyOtpSchema }),
  handleVerifyOtp
);

router.post(
  "/refresh",
  validate({ body: refreshSchema }),
  handleRefresh
);

router.post(
  "/admin/login",
  validate({ body: adminLoginSchema }),
  handleAdminLogin
);

router.post(
  "/logout",
  authenticate,
  validate({ body: logoutSchema }),
  handleLogout
);

router.post(
  "/logout-all",
  authenticate,
  handleLogoutAll
);

export default router;
