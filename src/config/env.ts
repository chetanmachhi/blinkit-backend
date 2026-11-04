import { loadEnv, parseList } from "../shared/config/loadEnv";

loadEnv();

/**
 * Platform-level config for the monolith process only.
 * Each module still validates its own variables in modules/<name>/config/env.ts,
 * so a module keeps working unchanged when it is split into its own service.
 */
const config = Object.freeze({
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI || "",
  CORS_ORIGINS: parseList(process.env.CORS_ORIGINS, ["http://localhost:5173"]),
});

if (!config.MONGO_URI) {
  throw new Error("Missing required environment variable: MONGO_URI");
}

export default config;
