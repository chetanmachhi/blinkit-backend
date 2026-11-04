import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate, sendResponse } from "../../../shared";
import { authenticateRider } from "../middlewares/auth.middleware";
import {
  loginSchema,
  availabilitySchema,
  orderIdParamSchema,
} from "../validators/delivery.validator";
import {
  handleLogin,
  handleMe,
  handleAvailability,
  handleSummary,
  handleAvailable,
  handleActive,
  handleHistory,
  handleGetOrder,
  handleAccept,
  handleRelease,
  handlePickup,
  handleDeliver,
} from "../controllers/delivery.controller";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendResponse(
      {
        statusCode: 429,
        showMessage: true,
        message: "Too many login attempts. Try again in a few minutes.",
      },
      res
    );
  },
});

const router = Router();

// Public
router.post("/auth/login", loginLimiter, validate({ body: loginSchema }), handleLogin);

// Rider only
router.use(authenticateRider);

router.get("/me", handleMe);
router.patch("/me/availability", validate({ body: availabilitySchema }), handleAvailability);
router.get("/me/summary", handleSummary);

router.get("/orders/available", handleAvailable);
router.get("/orders/active", handleActive);
router.get("/orders/history", handleHistory);
router.get("/orders/:orderId", validate({ params: orderIdParamSchema }), handleGetOrder);
router.post("/orders/:orderId/accept", validate({ params: orderIdParamSchema }), handleAccept);
router.post("/orders/:orderId/release", validate({ params: orderIdParamSchema }), handleRelease);
router.post("/orders/:orderId/pickup", validate({ params: orderIdParamSchema }), handlePickup);
router.post("/orders/:orderId/deliver", validate({ params: orderIdParamSchema }), handleDeliver);

export default router;
