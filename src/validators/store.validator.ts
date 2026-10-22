import { z } from "zod";

export const createStoreSchema = z
  .object({
    name: z.string().min(1).max(200),
    phone: z.string().min(10).max(15),
    address: z.string().min(1).max(500),
    location: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .strict(),
    deliveryRadiusKm: z.number().positive(),
    minOrderAmount: z.number().int().min(0),
    deliveryFee: z.number().int().min(0),
    freeDeliveryAbove: z.number().int().min(0),
    handlingFee: z.number().int().min(0).optional(),
    avgPrepMinutes: z.number().int().positive().optional(),
    opensAt: z.string().regex(/^\d{2}:\d{2}$/),
    closesAt: z.string().regex(/^\d{2}:\d{2}$/),
    timezone: z.string().optional(),
  })
  .strict();

export const updateStoreSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    phone: z.string().min(10).max(15).optional(),
    address: z.string().min(1).max(500).optional(),
    location: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .strict()
      .optional(),
    deliveryRadiusKm: z.number().positive().optional(),
    minOrderAmount: z.number().int().min(0).optional(),
    deliveryFee: z.number().int().min(0).optional(),
    freeDeliveryAbove: z.number().int().min(0).optional(),
    handlingFee: z.number().int().min(0).optional(),
    avgPrepMinutes: z.number().int().positive().optional(),
    opensAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    closesAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    timezone: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const storeIdParamSchema = z
  .object({
    storeId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "Invalid store ID"),
  })
  .strict();

export const nearbyQuerySchema = z.object({
  lat: z.string().regex(/^-?\d+(\.\d+)?$/),
  lng: z.string().regex(/^-?\d+(\.\d+)?$/),
  radiusKm: z.string().regex(/^\d+(\.\d+)?$/).optional(),
});

export const serviceabilityQuerySchema = z.object({
  lat: z.string().regex(/^-?\d+(\.\d+)?$/),
  lng: z.string().regex(/^-?\d+(\.\d+)?$/),
});
