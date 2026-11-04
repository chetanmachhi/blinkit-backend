import { Router } from "express";
import { HttpMount } from "../../shared";
import storeRoutes from "./routes/index.routes";

/**
 * Store (admin panel) module: store owner & staff operations used by store-web.
 */
export const STORE_BASE_PATH = "/api/v1/store";

export const createStoreRouter = (): Router => storeRoutes;

export const storeModule = (): HttpMount => ({
  name: "store",
  basePath: STORE_BASE_PATH,
  router: createStoreRouter(),
});
