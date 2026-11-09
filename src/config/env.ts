import { loadEnv, parseList } from "../shared/config/loadEnv";

loadEnv();

/** Web apps that must always be able to call this API. */
const DEFAULT_WEB_ORIGINS = [
  "https://blinkit-store-web.vercel.app", // store panel (Vercel)
  "http://localhost:5173", // store panel (local dev)
  "http://localhost:3000",
];

/**
 * Platform-level config for the monolith process only.
 * Each module still validates its own variables in modules/<name>/config/env.ts,
 * so a module keeps working unchanged when it is split into its own service.
 */
const config = Object.freeze({
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI || "",
  // Env list (Render dashboard) plus the deployed web panels, so a fresh
  // environment never blocks the store panel. Duplicates are removed.
  CORS_ORIGINS: [
    ...new Set([
      ...parseList(process.env.CORS_ORIGINS),
      ...DEFAULT_WEB_ORIGINS,
    ]),
  ],
});

if (!config.MONGO_URI) {
  throw new Error("Missing required environment variable: MONGO_URI");
}

export default config;
