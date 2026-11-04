import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(10, "Password must be at least 10 characters long"),
  })
  .strict();
