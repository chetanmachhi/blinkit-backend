import { z } from "zod";
import { ProductSort } from "../../../shared";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const productIdParamSchema = z
  .object({
    productId: z.string().regex(objectIdRegex, "Invalid product ID format"),
  })
  .strict();

export const productListQuerySchema = z
  .object({
    q: z.string().optional(),
    categoryId: z.string().regex(objectIdRegex).optional(),
    brand: z.string().optional(),
    isAvailable: z.enum(["true", "false"]).optional(),
    includeDeleted: z.enum(["true", "false"]).optional(),
    lowStock: z.enum(["true", "false"]).optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    sort: z.nativeEnum(ProductSort).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  })
  .strict();

export const createProductSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().default(""),
    brand: z.string().default(""),
    unit: z.string().min(1),
    categoryId: z.string().regex(objectIdRegex),
    mrp: z.number().int().positive(),
    price: z.number().int().positive(),
    stock: z.number().int().nonnegative().default(0),
    imageUrl: z.string().default(""),
    images: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    maxPerOrder: z.number().int().positive().default(10),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    lowStockThreshold: z.number().int().nonnegative().default(10),
  })
  .strict()
  .refine((data) => data.price <= data.mrp, {
    message: "Price must be less than or equal to MRP",
    path: ["price"],
  });

export const updateProductSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    brand: z.string().optional(),
    unit: z.string().min(1).optional(),
    categoryId: z.string().regex(objectIdRegex).optional(),
    mrp: z.number().int().positive().optional(),
    price: z.number().int().positive().optional(),
    stock: z.number().int().nonnegative().optional(),
    imageUrl: z.string().optional(),
    images: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    maxPerOrder: z.number().int().positive().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    lowStockThreshold: z.number().int().nonnegative().optional(),
    isAvailable: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.price !== undefined && data.mrp !== undefined) {
        return data.price <= data.mrp;
      }
      return true;
    },
    {
      message: "Price must be less than or equal to MRP",
      path: ["price"],
    }
  );

export const quickUpdateProductSchema = z
  .object({
    price: z.number().int().positive().optional(),
    mrp: z.number().int().positive().optional(),
    stock: z.number().int().nonnegative().optional(),
    isAvailable: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.price !== undefined && data.mrp !== undefined) {
        return data.price <= data.mrp;
      }
      return true;
    },
    {
      message: "Price must be less than or equal to MRP",
      path: ["price"],
    }
  );

export const updateStockSchema = z
  .object({
    stock: z.number().int().nonnegative().optional(),
    delta: z.number().int().optional(),
  })
  .strict()
  .refine((data) => data.stock !== undefined || data.delta !== undefined, {
    message: "Either stock or delta must be provided",
  });

export const bulkImportRowSchema = z
  .object({
    name: z.string().min(1),
    categorySlug: z.string().min(1),
    brand: z.string().optional(),
    unit: z.string().min(1),
    mrp: z.number().int().positive(),
    price: z.number().int().positive(),
    stock: z.number().int().nonnegative(),
    imageUrl: z.string().optional(),
    description: z.string().optional(),
  })
  .strict()
  .refine((row) => row.price <= row.mrp, {
    message: "Price must be less than or equal to MRP",
    path: ["price"],
  });

export const bulkImportSchema = z
  .object({
    dryRun: z.boolean(),
    rows: z.array(bulkImportRowSchema).max(500),
  })
  .strict();
