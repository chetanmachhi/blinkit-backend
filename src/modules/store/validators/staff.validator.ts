import { z } from "zod";
import { StoreRole } from "../../../shared";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const userIdParamSchema = z
  .object({
    userId: z.string().regex(objectIdRegex, "Invalid user ID format"),
  })
  .strict();

export const createStaffSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(10, "Password must be at least 10 characters"),
    storeRole: z.nativeEnum(StoreRole),
    storeIds: z.array(z.string().regex(objectIdRegex)).default([]),
  })
  .strict();

export const updateStaffSchema = z
  .object({
    name: z.string().min(1).optional(),
    storeRole: z.nativeEnum(StoreRole).optional(),
    storeIds: z.array(z.string().regex(objectIdRegex)).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(10, "Password must be at least 10 characters"),
  })
  .strict();
