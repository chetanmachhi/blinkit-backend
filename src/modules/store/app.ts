import { createHttpApp } from "../../shared";
import config from "./config/env";
import { storeModule } from "./index";

/** Standalone store/admin API (used only when this module runs as its own service). */
const app = createHttpApp({
  serviceName: "store-api",
  nodeEnv: config.NODE_ENV,
  corsOrigins: config.CORS_ORIGINS,
  bodyLimit: "100kb",
  mounts: [storeModule()],
});

export default app;
