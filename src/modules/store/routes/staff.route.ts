import { Router } from "express";
import { validate } from "../../../shared";
import {
  handleGetStaff,
  handleCreateStaff,
  handleUpdateStaff,
  handleResetPassword,
} from "../controllers/staff.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { Permission } from "../constants/permissions";
import {
  userIdParamSchema,
  createStaffSchema,
  updateStaffSchema,
  resetPasswordSchema,
} from "../validators/staff.validator";

const router = Router();

router.use(authenticate, requirePermission(Permission.STAFF_MANAGE));

router.get("/", handleGetStaff);

router.post("/", validate({ body: createStaffSchema }), handleCreateStaff);

router.patch(
  "/:userId",
  validate({ params: userIdParamSchema, body: updateStaffSchema }),
  handleUpdateStaff
);

router.post(
  "/:userId/reset-password",
  validate({ params: userIdParamSchema, body: resetPasswordSchema }),
  handleResetPassword
);

export default router;
