import { createHttpApp } from "../../shared";
import config from "./config/env";
import { customerModule } from "./index";

/** Standalone customer API (used only when this module runs as its own service). */
const app = createHttpApp({
  serviceName: "customer-api",
  nodeEnv: config.NODE_ENV,
  corsOrigins: config.CORS_ORIGINS,
  mounts: [customerModule()],
});

export default app;
