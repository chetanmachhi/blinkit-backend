import { loadEnv } from "../../../shared/config/loadEnv";

loadEnv();

export interface StoreConfig {
  PORT: number;
  NODE_ENV: string;
  MONGO_URI: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CORS_ORIGINS: string[];
  DEFAULT_STORE_ID: string;
  ENABLE_DEMO_TOOLS: boolean;
  STORE_OWNER_EMAIL: string;
  STORE_OWNER_PASSWORD: string;
}

const requiredVars = [
  "PORT",
  "NODE_ENV",
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_ACCESS_EXPIRES_IN",
  "JWT_REFRESH_EXPIRES_IN",
  "DEFAULT_STORE_ID",
] as const;

const missing = requiredVars.filter((v) => process.env[v] === undefined || process.env[v] === "");
if (missing.length > 0) {
  throw new Error(
    `Missing required store-backend environment variables: ${missing.join(", ")}`
  );
}

const config: StoreConfig = Object.freeze({
  PORT: parseInt(process.env.PORT || "5001", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN!,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN!,
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim()),
  DEFAULT_STORE_ID: process.env.DEFAULT_STORE_ID!,
  ENABLE_DEMO_TOOLS: (process.env.ENABLE_DEMO_TOOLS ?? "true") === "true",
  STORE_OWNER_EMAIL: process.env.STORE_OWNER_EMAIL || "owner@blinkit.com",
  // Only used by the seed script, which refuses to run without it.
  STORE_OWNER_PASSWORD: process.env.STORE_OWNER_PASSWORD || "",
});

export default config;
