import { Router } from "express";
import { HttpMount } from "../../shared";
import deliveryRoutes from "./routes";
import config from "./config/env";
import { ensureDemoRiders } from "./services/demoRiders.service";

/**
 * Delivery module: everything the rider (delivery partner) app talks to.
 */
export const DELIVERY_BASE_PATH = "/api/v1/delivery";

export const createDeliveryRouter = (): Router => deliveryRoutes;

export const deliveryModule = (): HttpMount => ({
  name: "delivery",
  basePath: DELIVERY_BASE_PATH,
  router: createDeliveryRouter(),
});

/** Runs once the DB is connected (monolith and standalone). */
export const onDeliveryDatabaseReady = async (): Promise<void> => {
  if (!config.SEED_DEMO_RIDERS) return;
  const created = await ensureDemoRiders(config.DEMO_RIDER_PASSWORD);
  if (created > 0) {
    console.log(`[Delivery] Created ${created} demo rider account(s)`);
  }
};
