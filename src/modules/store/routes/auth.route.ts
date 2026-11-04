import { Router } from "express";
import { validate } from "../../../shared";
import {
  handleLogin,
  handleRefresh,
  handleLogout,
  handleLogoutAll,
  handleChangePassword,
  handleGetMe,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { loginLimiter } from "../middlewares/rateLimit.middleware";
import {
  loginSchema,
  refreshSchema,
  changePasswordSchema,
} from "../validators/auth.validator";

const router = Router();

router.post("/login", loginLimiter, validate({ body: loginSchema }), handleLogin);
router.post("/refresh", validate({ body: refreshSchema }), handleRefresh);
router.post("/logout", authenticate, handleLogout);
router.post("/logout-all", authenticate, handleLogoutAll);
router.patch(
  "/password",
  authenticate,
  validate({ body: changePasswordSchema }),
  handleChangePassword
);
router.get("/me", authenticate, handleGetMe);

export default router;
