import { z } from "zod";
import { CouponType } from "../constants/enums";

export const createCouponSchema = z
  .object({
    code: z.string().min(1).max(50),
    description: z.string().max(500).optional(),
    type: z.nativeEnum(CouponType),
    value: z.number().positive(),
    maxDiscount: z.number().positive().optional(),
    minOrderAmount: z.number().int().min(0).optional(),
    validFrom: z.string(),
    validTo: z.string(),
    usageLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive().optional(),
    storeId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/)
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateCouponSchema = z
  .object({
    description: z.string().max(500).optional(),
    type: z.nativeEnum(CouponType).optional(),
    value: z.number().positive().optional(),
    maxDiscount: z.number().positive().nullable().optional(),
    minOrderAmount: z.number().int().min(0).optional(),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    perUserLimit: z.number().int().positive().optional(),
    storeId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/)
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const couponIdParamSchema = z
  .object({
    couponId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "Invalid coupon ID"),
  })
  .strict();
