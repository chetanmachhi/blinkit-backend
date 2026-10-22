import { Router } from "express";
import {
  getMe,
  updateMe,
  deleteMe,
} from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { updateUserSchema } from "../validators/user.validator";

const router = Router();

router.use(authenticate);

router.get("/me", getMe);
router.patch("/me", validate({ body: updateUserSchema }), updateMe);
router.delete("/me", deleteMe);

export default router;
