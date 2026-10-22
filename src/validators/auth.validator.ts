import { z } from "zod";

export const requestOtpSchema = z
  .object({
    phone: z.string().min(10).max(15),
  })
  .strict();

export const verifyOtpSchema = z
  .object({
    phone: z.string().min(10).max(15),
    otp: z.string().length(6),
    name: z.string().min(1).max(100).optional(),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

export const logoutSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

export const adminLoginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .strict();
