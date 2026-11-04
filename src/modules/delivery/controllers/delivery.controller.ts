import { Request, Response } from "express";
import { sendResponse, buildErrorResponse } from "../../../shared";
import {
  loginRider,
  getRiderProfile,
  setRiderAvailability,
} from "../services/auth.service";
import {
  listAvailableOrders,
  listActiveOrders,
  listHistory,
  getOrderForRider,
  acceptOrder,
  releaseOrder,
  markPickedUp,
  markDelivered,
  getRiderSummary,
} from "../services/order.service";

/**
 * Wraps a service call in the standard ResponseModel envelope.
 * showMessage=true for actions so the app can toast the server message.
 */
const handle =
  (message: string, fn: (req: Request) => Promise<unknown>, showMessage = false) =>
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const data = await fn(req);
      return sendResponse({ statusCode: 200, showMessage, message, data }, res);
    } catch (error) {
      return sendResponse(buildErrorResponse(error), res);
    }
  };

const riderId = (req: Request): string => req.user!.id;

export const handleLogin = handle("Logged in", (req) =>
  loginRider(req.body.phone, req.body.password)
);

export const handleMe = handle("Rider profile", (req) => getRiderProfile(riderId(req)));

export const handleAvailability = handle(
  "Availability updated",
  (req) => setRiderAvailability(riderId(req), req.body.isOnline),
  true
);

export const handleSummary = handle("Rider summary", (req) => getRiderSummary(riderId(req)));

export const handleAvailable = handle("Available orders", (req) =>
  listAvailableOrders(riderId(req))
);

export const handleActive = handle("Active orders", (req) => listActiveOrders(riderId(req)));

export const handleHistory = handle("Delivery history", (req) => listHistory(riderId(req)));

export const handleGetOrder = handle("Order", (req) =>
  getOrderForRider(riderId(req), req.params.orderId)
);

export const handleAccept = handle(
  "Order assigned to you",
  (req) => acceptOrder(riderId(req), req.params.orderId),
  true
);

export const handleRelease = handle(
  "Order released",
  (req) => releaseOrder(riderId(req), req.params.orderId),
  true
);

export const handlePickup = handle(
  "Order picked up",
  (req) => markPickedUp(riderId(req), req.params.orderId),
  true
);

export const handleDeliver = handle(
  "Order delivered",
  (req) => markDelivered(riderId(req), req.params.orderId),
  true
);
