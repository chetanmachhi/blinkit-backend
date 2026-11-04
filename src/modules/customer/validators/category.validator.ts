import { z } from "zod";

export const createCategorySchema = z
  .object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100),
    imageUrl: z.string().optional(),
    parentId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/)
      .nullable()
      .optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateCategorySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).optional(),
    imageUrl: z.string().optional(),
    parentId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/)
      .nullable()
      .optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const categoryIdParamSchema = z
  .object({
    categoryId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "Invalid category ID"),
  })
  .strict();

export const categoryQuerySchema = z.object({
  parentId: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
