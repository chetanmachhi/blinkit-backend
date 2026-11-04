import { Router } from "express";
import authRoutes from "./auth.route";
import storeRoutes from "./store.route";
import staffRoutes from "./staff.route";
import categoryRoutes from "./category.route";
import productRoutes from "./product.route";
import orderRoutes from "./order.route";
import customerRoutes from "./customer.route";
import couponRoutes from "./coupon.route";
import { dashboardRouter, reportsRouter } from "./dashboard.route";
import demoRoutes from "./demo.route";
import riderRoutes from "./rider.route";
import { sendResponse } from "../../../shared";

const router = Router();

router.get("/health", (_req, res) => {
  sendResponse(
    {
      statusCode: 200,
      showMessage: false,
      message: "Store API Health Check",
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    },
    res
  );
});

router.use("/auth", authRoutes);
router.use("/stores", storeRoutes);
router.use("/staff", staffRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/customers", customerRoutes);
router.use("/coupons", couponRoutes);
router.use("/dashboard", dashboardRouter);
router.use("/reports", reportsRouter);
router.use("/demo", demoRoutes);
router.use("/riders", riderRoutes);

export default router;
