import { z } from "zod";
import { AddressLabel } from "../constants/enums";

export const createAddressSchema = z
  .object({
    label: z.nativeEnum(AddressLabel).optional(),
    receiverName: z.string().min(1).max(100),
    receiverPhone: z.string().min(10).max(15),
    addressLine: z.string().min(1).max(500),
    landmark: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    pincode: z.string().min(4).max(10),
    coordinates: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .strict(),
  })
  .strict();

export const updateAddressSchema = z
  .object({
    label: z.nativeEnum(AddressLabel).optional(),
    receiverName: z.string().min(1).max(100).optional(),
    receiverPhone: z.string().min(10).max(15).optional(),
    addressLine: z.string().min(1).max(500).optional(),
    landmark: z.string().max(200).optional(),
    city: z.string().min(1).max(100).optional(),
    pincode: z.string().min(4).max(10).optional(),
    coordinates: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .strict()
      .optional(),
  })
  .strict();

export const addressIdParamSchema = z
  .object({
    addressId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "Invalid address ID"),
  })
  .strict();
