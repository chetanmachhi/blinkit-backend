import { Router } from "express";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/address.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
} from "../validators/address.validator";

const router = Router();

router.use(authenticate);

router.get("/", getAddresses);

router.post(
  "/",
  validate({ body: createAddressSchema }),
  createAddress
);

router.patch(
  "/:addressId/default",
  validate({ params: addressIdParamSchema }),
  setDefaultAddress
);

router.patch(
  "/:addressId",
  validate({
    params: addressIdParamSchema,
    body: updateAddressSchema,
  }),
  updateAddress
);

router.delete(
  "/:addressId",
  validate({ params: addressIdParamSchema }),
  deleteAddress
);

export default router;
