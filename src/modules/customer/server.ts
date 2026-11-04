import { startServer } from "../../shared";
import app from "./app";
import config from "./config/env";

/** Standalone entry: `npm run dev:customer`. The monolith entry is src/server.ts. */
startServer(app, {
  name: "Customer-API",
  port: parseInt(process.env.CUSTOMER_PORT || String(config.PORT), 10),
  mongoUri: config.MONGO_URI,
  nodeEnv: config.NODE_ENV,
});
