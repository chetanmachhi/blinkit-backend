import { z } from "zod";
import { OrderStatus, PaymentMethod } from "../constants/enums";

export const createOrderSchema = z
  .object({
    addressId: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
    deliveryAddress: z
      .object({
        label: z.string().optional(),
        addressLine: z.string().min(1),
        landmark: z.string().optional(),
        coordinates: z
          .object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
          })
          .strict(),
      })
      .strict()
      .optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    couponCode: z.string().optional(),
    notes: z.string().max(500).optional(),
    items: z
      .array(
        z
          .object({
            productId: z.string().regex(/^[a-fA-F0-9]{24}$/),
            quantity: z.number().int().positive(),
          })
          .strict()
      )
      .optional(),
  })
  .strict()
  .refine((data) => data.addressId || data.deliveryAddress, {
    message: "Either addressId or deliveryAddress is required",
  });

export const orderIdParamSchema = z
  .object({
    orderId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "Invalid order ID"),
  })
  .strict();

export const cancelOrderSchema = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .strict();

export const updateOrderStatusSchema = z
  .object({
    status: z.nativeEnum(OrderStatus),
    note: z.string().max(500).optional(),
  })
  .strict();

export const orderListQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export const storeOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export const storeOrdersParamSchema = z
  .object({
    storeId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "Invalid store ID"),
  })
  .strict();
