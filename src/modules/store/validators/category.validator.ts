import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const categoryIdParamSchema = z
  .object({
    categoryId: z.string().regex(objectIdRegex, "Invalid category ID format"),
  })
  .strict();

export const createCategorySchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().min(1),
    imageUrl: z.string().url().or(z.string().default("")),
    parentId: z.string().regex(objectIdRegex).nullable().optional(),
    sortOrder: z.number().int().default(0),
  })
  .strict();

export const updateCategorySchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    imageUrl: z.string().optional(),
    parentId: z.string().regex(objectIdRegex).nullable().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const reorderCategoriesSchema = z
  .array(
    z
      .object({
        id: z.string().regex(objectIdRegex),
        sortOrder: z.number().int(),
      })
      .strict()
  )
  .min(1);
