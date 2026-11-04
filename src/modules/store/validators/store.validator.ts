import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const storeIdParamSchema = z
  .object({
    storeId: z.string().regex(objectIdRegex, "Invalid store ID format"),
  })
  .strict();

export const updateStoreSchema = z
  .object({
    name: z.string().min(1).optional(),
    phone: z.string().min(10).optional(),
    address: z.string().min(1).optional(),
    location: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .strict()
      .optional(),
    deliveryRadiusKm: z.number().positive().optional(),
    minOrderAmount: z.number().nonnegative().optional(),
    deliveryFee: z.number().nonnegative().optional(),
    freeDeliveryAbove: z.number().nonnegative().optional(),
    handlingFee: z.number().nonnegative().optional(),
    avgPrepMinutes: z.number().positive().optional(),
    opensAt: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:mm")
      .optional(),
    closesAt: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:mm")
      .optional(),
  })
  .strict();

export const updateAcceptingSchema = z
  .object({
    isAcceptingOrders: z.boolean(),
    reason: z.string().optional(),
  })
  .strict();
