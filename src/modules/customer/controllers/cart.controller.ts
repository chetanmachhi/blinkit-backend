import { Request, Response } from "express";
import { Types } from "mongoose";
import { ResponseModel } from "../models/response.model";
import { sendResponse, buildErrorResponse } from "../utils/response.util";
import { Cart } from "../models/cart.model";
import { Product } from "../models/product.model";
import { getCartView } from "../services/cart.service";
import { AppError } from "../utils/AppError";

export const getCart = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const view = await getCartView(req.user!.id, req.storeId!);
    response.data = view;
    response.message = "Cart fetched";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const upsertCartItem = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const { productId, quantity } = req.body;
    const storeId = req.storeId!;
    const userId = req.user!.id;

    if (quantity > 0) {
      const product = await Product.findOne({
        _id: productId,
        storeId,
        isAvailable: true,
        isDeleted: false,
      });
      if (!product) {
        throw new AppError("Product not found or unavailable", 404);
      }
      if (quantity > product.maxPerOrder) {
        throw new AppError(
          `Maximum ${product.maxPerOrder} allowed per order`,
          409
        );
      }
      if (quantity > product.stock) {
        throw new AppError(
          `Only ${product.stock} units available`,
          409
        );
      }
    }

    let cart = await Cart.findOne({ userId, storeId });
    if (!cart) {
      cart = await Cart.create({ userId, storeId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (i) => i.productId.toString() === productId
    );

    if (quantity === 0) {
      if (existingIndex >= 0) {
        cart.items.splice(existingIndex, 1);
      }
      response.message = "Item removed from cart";
    } else {
      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity = quantity;
        response.message = "Cart updated";
      } else {
        cart.items.push({
          productId: new Types.ObjectId(productId),
          quantity,
        });
        response.message = "Item added to cart";
      }
    }

    await cart.save();

    const view = await getCartView(userId, storeId);
    response.data = view;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const removeCartItem = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const userId = req.user!.id;
    const storeId = req.storeId!;
    const { productId } = req.params;

    await Cart.updateOne(
      { userId, storeId },
      { $pull: { items: { productId } } }
    );

    const view = await getCartView(userId, storeId);
    response.data = view;
    response.message = "Item removed";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const clearCart = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    await Cart.updateOne(
      { userId: req.user!.id, storeId: req.storeId! },
      { $set: { items: [], couponCode: undefined } }
    );
    response.message = "Cart cleared";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const applyCoupon = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    const userId = req.user!.id;
    const storeId = req.storeId!;

    await Cart.updateOne(
      { userId, storeId },
      { $set: { couponCode: req.body.code.toUpperCase() } }
    );

    const view = await getCartView(userId, storeId);
    response.data = view;
    response.message = "Coupon applied";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const removeCoupon = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    await Cart.updateOne(
      { userId: req.user!.id, storeId: req.storeId! },
      { $unset: { couponCode: 1 } }
    );

    const view = await getCartView(req.user!.id, req.storeId!);
    response.data = view;
    response.message = "Coupon removed";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
