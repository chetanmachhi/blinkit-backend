import { Request, Response } from "express";
import { ResponseModel } from "../models/response.model";
import { sendResponse, buildErrorResponse } from "../utils/response.util";
import { Store } from "../models/store.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { toGeoJSON, fromGeoJSON, haversineDistance, isStoreOpen } from "../utils/geo.util";
import { Role } from "../constants/enums";

const checkAdminStoreAccess = async (
  userId: string,
  targetStoreId: string
): Promise<void> => {
  const admin = await User.findById(userId);
  if (!admin || admin.role !== Role.ADMIN) {
    throw new AppError("Forbidden", 403);
  }
  if (
    admin.storeIds.length > 0 &&
    !admin.storeIds.some((id) => id.toString() === targetStoreId)
  ) {
    throw new AppError("Access denied to this store", 403);
  }
};

export const getStores = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const stores = await Store.find({ isActive: true });
    const data = stores.map((s) => {
      const obj = s.toObject();
      return {
        ...obj,
        location: fromGeoJSON(s.location),
      };
    });
    response.data = data;
    response.message = "Stores fetched";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const getNearbyStores = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = parseFloat(
      (req.query.radiusKm as string) || "10"
    );

    const stores = await Store.find({
      isActive: true,
      location: {
        $near: {
          $geometry: toGeoJSON(lat, lng),
          $maxDistance: radiusKm * 1000,
        },
      },
    });

    const data = stores.map((s) => ({
      ...s.toObject(),
      location: fromGeoJSON(s.location),
      distanceKm: parseFloat(
        haversineDistance(
          lat,
          lng,
          s.location.coordinates[1],
          s.location.coordinates[0]
        ).toFixed(2)
      ),
    }));

    response.data = data;
    response.message = "Nearby stores";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const getStore = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const store = await Store.findById(req.params.storeId);
    if (!store) {
      throw new AppError("Store not found", 404);
    }
    response.data = {
      ...store.toObject(),
      location: fromGeoJSON(store.location),
    };
    response.message = "Store details";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const getServiceability = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "",
  };
  try {
    const store = await Store.findById(req.params.storeId);
    if (!store) {
      throw new AppError("Store not found", 404);
    }

    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    const distanceKm = haversineDistance(
      lat,
      lng,
      store.location.coordinates[1],
      store.location.coordinates[0]
    );

    const serviceable = distanceKm <= store.deliveryRadiusKm;
    const open = isStoreOpen(
      store.opensAt,
      store.closesAt,
      store.timezone
    );

    response.data = {
      serviceable,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      isOpen: open,
      etaMinutes: serviceable ? store.avgPrepMinutes + Math.ceil(distanceKm * 3) : null,
      deliveryFee: store.deliveryFee,
      minOrderAmount: store.minOrderAmount,
    };
    response.message = "Serviceability check";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const createStore = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 201,
    showMessage: true,
    message: "",
  };
  try {
    const { location: loc, ...rest } = req.body;
    const store = await Store.create({
      ...rest,
      location: toGeoJSON(loc.lat, loc.lng),
    });
    response.data = {
      ...store.toObject(),
      location: fromGeoJSON(store.location),
    };
    response.message = "Store created";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const updateStore = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "",
  };
  try {
    await checkAdminStoreAccess(req.user!.id, req.params.storeId);

    const updateData: Record<string, any> = { ...req.body };
    if (req.body.location) {
      updateData.location = toGeoJSON(
        req.body.location.lat,
        req.body.location.lng
      );
      delete updateData.location;
      updateData.location = toGeoJSON(
        req.body.location.lat,
        req.body.location.lng
      );
    }

    const store = await Store.findByIdAndUpdate(
      req.params.storeId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!store) {
      throw new AppError("Store not found", 404);
    }
    response.data = {
      ...store.toObject(),
      location: fromGeoJSON(store.location),
    };
    response.message = "Store updated";
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
