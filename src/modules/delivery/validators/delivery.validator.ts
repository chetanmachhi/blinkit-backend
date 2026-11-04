import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const loginSchema = z
  .object({
    phone: z.string().trim().min(10, "Enter a valid phone number").max(15),
    password: z.string().min(1, "Password is required").max(100),
  })
  .strict();

export const availabilitySchema = z
  .object({
    isOnline: z.boolean(),
  })
  .strict();

export const orderIdParamSchema = z
  .object({
    orderId: z.string().regex(objectIdRegex, "Invalid order ID format"),
  })
  .strict();
