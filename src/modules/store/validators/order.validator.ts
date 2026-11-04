import { z } from "zod";
import { OrderStatus, PaymentStatus } from "../../../shared";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const orderIdParamSchema = z
  .object({
    orderId: z.string().regex(objectIdRegex, "Invalid order ID format"),
  })
  .strict();

export const orderListQuerySchema = z
  .object({
    status: z.nativeEnum(OrderStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    q: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  })
  .strict();

export const assignRiderSchema = z
  .object({
    riderId: z.string().regex(objectIdRegex, "Invalid rider ID format"),
  })
  .strict();

export const acceptOrderSchema = z
  .object({
    prepMinutes: z.number().int().positive().optional(),
  })
  .strict();

export const rejectOrderSchema = z
  .object({
    reason: z.string().min(1, "Rejection reason is required"),
  })
  .strict();

export const updateOrderStatusSchema = z
  .object({
    status: z.enum([
      OrderStatus.PREPARING,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ]),
    note: z.string().optional(),
  })
  .strict();

export const cancelOrderSchema = z
  .object({
    reason: z.string().min(1, "Cancellation reason is required"),
  })
  .strict();

export const updatePaymentSchema = z
  .object({
    paymentStatus: z.nativeEnum(PaymentStatus),
  })
  .strict();

export const updateNoteSchema = z
  .object({
    internalNote: z.string(),
  })
  .strict();
