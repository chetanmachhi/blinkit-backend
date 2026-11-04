import { Router } from "express";
import { HttpMount } from "../../shared";
import { globalLimiter } from "./middlewares/rateLimit.middleware";
import apiRoutes from "./routes";

/**
 * Customer module: everything the customer mobile app talks to.
 * Mounted under /api (kept for backward compatibility with the released app).
 */
export const CUSTOMER_BASE_PATH = "/api";

export const createCustomerRouter = (): Router => {
  const router = Router();
  router.use(globalLimiter);
  router.use(apiRoutes);
  return router;
};

export const customerModule = (): HttpMount => ({
  name: "customer",
  basePath: CUSTOMER_BASE_PATH,
  router: createCustomerRouter(),
});
