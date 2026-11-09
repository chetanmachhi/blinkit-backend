import { z } from "zod";
import { CouponType } from "../../../shared";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const couponIdParamSchema = z
  .object({
    couponId: z.string().regex(objectIdRegex, "Invalid coupon ID format"),
  })
  .strict();

export const createCouponSchema = z
  .object({
    code: z.string().min(1).toUpperCase(),
    description: z.string().default(""),
    type: z.nativeEnum(CouponType),
    value: z.number().int().positive(),
    maxDiscount: z.number().int().positive().optional(),
    minOrderAmount: z.number().int().nonnegative().default(0),
    validFrom: z.string().datetime().or(z.string().min(1)),
    validTo: z.string().datetime().or(z.string().min(1)),
    usageLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive().default(1),
    storeId: z.string().regex(objectIdRegex).nullable().optional(),
  })
  .strict()
  .refine((c) => c.type !== CouponType.PERCENT || c.value <= 100, {
    message: "Percentage discount cannot exceed 100%",
    path: ["value"],
  });

export const updateCouponSchema = z
  .object({
    code: z.string().min(1).toUpperCase().optional(),
    description: z.string().optional(),
    type: z.nativeEnum(CouponType).optional(),
    value: z.number().int().positive().optional(),
    maxDiscount: z.number().int().positive().optional(),
    minOrderAmount: z.number().int().nonnegative().optional(),
    validFrom: z.string().datetime().or(z.string().min(1)).optional(),
    validTo: z.string().datetime().or(z.string().min(1)).optional(),
    usageLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((c) => c.type !== CouponType.PERCENT || c.value === undefined || c.value <= 100, {
    message: "Percentage discount cannot exceed 100%",
    path: ["value"],
  });
