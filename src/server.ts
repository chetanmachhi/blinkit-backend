import { startServer, repairOrderIndexes } from "./shared";
import app from "./app";
import config from "./config/env";
import { onDeliveryDatabaseReady } from "./modules/delivery";

startServer(app, {
  name: "Blinkit-Backend",
  port: config.PORT,
  mongoUri: config.MONGO_URI,
  nodeEnv: config.NODE_ENV,
  onDatabaseReady: async () => {
    await repairOrderIndexes();
    await onDeliveryDatabaseReady();
  },
});
