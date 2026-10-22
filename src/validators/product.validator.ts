import { z } from "zod";
import { ProductSort } from "../constants/enums";

export const createProductSchema = z
  .object({
    storeId: z.string().regex(/^[a-fA-F0-9]{24}$/),
    categoryId: z.string().regex(/^[a-fA-F0-9]{24}$/),
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    brand: z.string().max(100).optional(),
    unit: z.string().min(1).max(50),
    mrp: z.number().int().positive(),
    price: z.number().int().positive(),
    stock: z.number().int().min(0),
    maxPerOrder: z.number().int().positive().optional(),
    imageUrl: z.string().optional(),
    images: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    isAvailable: z.boolean().optional(),
  })
  .strict()
  .refine((data) => data.price <= data.mrp, {
    message: "Price must be less than or equal to MRP",
    path: ["price"],
  });

export const updateProductSchema = z
  .object({
    categoryId: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    brand: z.string().max(100).optional(),
    unit: z.string().min(1).max(50).optional(),
    mrp: z.number().int().positive().optional(),
    price: z.number().int().positive().optional(),
    stock: z.number().int().min(0).optional(),
    maxPerOrder: z.number().int().positive().optional(),
    imageUrl: z.string().optional(),
    images: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    isAvailable: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
  .strict();

export const updateStockSchema = z
  .object({
    stock: z.number().int().min(0).optional(),
    delta: z.number().int().optional(),
  })
  .strict()
  .refine((data) => data.stock !== undefined || data.delta !== undefined, {
    message: "Either stock or delta must be provided",
  });

export const productIdParamSchema = z
  .object({
    productId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "Invalid product ID"),
  })
  .strict();

export const productQuerySchema = z.object({
  storeId: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
  categoryId: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
  q: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.string().regex(/^\d+$/).optional(),
  maxPrice: z.string().regex(/^\d+$/).optional(),
  inStock: z.string().regex(/^(true|false)$/).optional(),
  sort: z.nativeEnum(ProductSort).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
