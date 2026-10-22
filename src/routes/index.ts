import { Router } from "express";
import authRoutes from "./auth.route";
import userRoutes from "./user.route";
import addressRoutes from "./address.route";
import storeRoutes from "./store.route";
import categoryRoutes from "./category.route";
import productRoutes from "./product.route";
import cartRoutes from "./cart.route";
import couponRoutes from "./coupon.route";
import orderRoutes from "./order.route";
import adminRoutes from "./admin.route";
import catalogRoutes from "./catalog.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/addresses", addressRoutes);
router.use("/stores", storeRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/coupons", couponRoutes);
router.use("/orders", orderRoutes);
router.use("/admin", adminRoutes);
router.use("/catalog", catalogRoutes);

export default router;
