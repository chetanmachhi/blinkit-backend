import { z } from "zod";

export const upsertCartItemSchema = z
  .object({
    productId: z.string().regex(/^[a-fA-F0-9]{24}$/),
    quantity: z.number().int().min(0),
  })
  .strict();

export const removeCartItemParamSchema = z
  .object({
    productId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "Invalid product ID"),
  })
  .strict();

export const applyCouponSchema = z
  .object({
    code: z.string().min(1).max(50),
  })
  .strict();
