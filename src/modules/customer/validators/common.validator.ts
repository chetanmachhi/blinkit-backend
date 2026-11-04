import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");

export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export const dashboardQuerySchema = z.object({
  storeId: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const lowStockQuerySchema = z.object({
  storeId: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
  threshold: z.string().regex(/^\d+$/).optional(),
});

export const adminUsersQuerySchema = z.object({
  q: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
