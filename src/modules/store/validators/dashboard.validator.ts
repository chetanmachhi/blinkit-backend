import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const dashboardQuerySchema = z
  .object({
    storeId: z.string().regex(objectIdRegex).optional(),
    range: z.enum(["today", "7d", "30d"]).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .strict();

export const salesReportQuerySchema = z
  .object({
    storeId: z.string().regex(objectIdRegex).optional(),
    groupBy: z.enum(["day"]).default("day").optional(),
    range: z.enum(["today", "7d", "30d"]).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .strict();

export const topProductsQuerySchema = z
  .object({
    storeId: z.string().regex(objectIdRegex).optional(),
    limit: z.string().optional(),
  })
  .strict();

export const categorySalesQuerySchema = z
  .object({
    storeId: z.string().regex(objectIdRegex).optional(),
    range: z.enum(["today", "7d", "30d"]).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .strict();
