import { startServer } from "../../shared";
import app from "./app";
import config from "./config/env";
import { onDeliveryDatabaseReady } from "./index";

/** Standalone entry: `npm run dev:delivery`. The monolith entry is src/server.ts. */
startServer(app, {
  name: "Delivery-API",
  port: parseInt(process.env.DELIVERY_PORT || String(config.PORT), 10),
  mongoUri: config.MONGO_URI,
  nodeEnv: config.NODE_ENV,
  onDatabaseReady: onDeliveryDatabaseReady,
});
