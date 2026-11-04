import { createHttpApp } from "./shared";
import config from "./config/env";
import { storeModule } from "./modules/store";
import { deliveryModule } from "./modules/delivery";
import { customerModule } from "./modules/customer";

/**
 * Monolith: every module on one Express app, one port, one deploy.
 *
 *   /api/v1/store/*     store (admin panel)  -> store-web
 *   /api/v1/delivery/*  delivery (riders)    -> delivery-app
 *   /api/*              customer             -> customer-app
 *
 * The customer module is mounted last because "/api" is a prefix of the others.
 * To split a module out later, run src/modules/<name>/server.ts on its own.
 */
const app = createHttpApp({
  serviceName: "blinkit-backend",
  nodeEnv: config.NODE_ENV,
  corsOrigins: config.CORS_ORIGINS,
  mounts: [storeModule(), deliveryModule(), customerModule()],
});

export default app;
