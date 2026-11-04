import { Store, IStore, AppError, fromGeoJSON, toGeoJSON } from "../../../shared";

export const listStores = async (userStoreIds: string[] = []): Promise<any[]> => {
  const query: any = {};
  if (userStoreIds.length > 0) {
    query._id = { $in: userStoreIds };
  }
  const stores = await Store.find(query);
  return stores.map((s) => ({
    ...s.toObject(),
    location: fromGeoJSON(s.location),
  }));
};

export const getStoreById = async (storeId: string): Promise<any> => {
  const store = await Store.findById(storeId);
  if (!store) {
    throw new AppError("Store not found", 404);
  }
  return {
    ...store.toObject(),
    location: fromGeoJSON(store.location),
  };
};

export const updateStoreSettings = async (
  storeId: string,
  data: any
): Promise<any> => {
  const updateData: any = { ...data };
  if (data.location) {
    updateData.location = toGeoJSON(data.location.lat, data.location.lng);
  }

  const store = await Store.findByIdAndUpdate(
    storeId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!store) {
    throw new AppError("Store not found", 404);
  }

  return {
    ...store.toObject(),
    location: fromGeoJSON(store.location),
  };
};

export const setAcceptingOrders = async (
  storeId: string,
  isAcceptingOrders: boolean,
  reason?: string
): Promise<any> => {
  const store = await Store.findByIdAndUpdate(
    storeId,
    {
      $set: {
        isAcceptingOrders,
        pausedReason: isAcceptingOrders ? undefined : reason || "Store paused",
      },
    },
    { new: true }
  );

  if (!store) {
    throw new AppError("Store not found", 404);
  }

  return {
    ...store.toObject(),
    location: fromGeoJSON(store.location),
  };
};
