import { createHttpApp } from "../../shared";
import config from "./config/env";
import { deliveryModule } from "./index";

/** Standalone delivery API (used only when this module runs as its own service). */
const app = createHttpApp({
  serviceName: "delivery-api",
  nodeEnv: config.NODE_ENV,
  corsOrigins: config.CORS_ORIGINS,
  bodyLimit: "100kb",
  mounts: [deliveryModule()],
});

export default app;
