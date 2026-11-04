import { loadEnv, parseList } from "../../../shared/config/loadEnv";

loadEnv();

export interface DeliveryConfig {
  PORT: number;
  NODE_ENV: string;
  MONGO_URI: string;
  JWT_ACCESS_SECRET: string;
  /** Rider sessions are long-lived on purpose (no refresh flow in the demo app). */
  DELIVERY_TOKEN_EXPIRES_IN: string;
  CORS_ORIGINS: string[];
  /** Create demo riders on boot if they do not exist yet. */
  SEED_DEMO_RIDERS: boolean;
  DEMO_RIDER_PASSWORD: string;
}

const requiredVars = ["MONGO_URI", "JWT_ACCESS_SECRET"] as const;

const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  throw new Error(
    `Missing required delivery environment variables: ${missing.join(", ")}`
  );
}

const config: DeliveryConfig = Object.freeze({
  PORT: parseInt(process.env.PORT || "5002", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  DELIVERY_TOKEN_EXPIRES_IN: process.env.DELIVERY_TOKEN_EXPIRES_IN || "7d",
  CORS_ORIGINS: parseList(process.env.CORS_ORIGINS, ["http://localhost:5173"]),
  SEED_DEMO_RIDERS: (process.env.SEED_DEMO_RIDERS ?? "true") === "true",
  DEMO_RIDER_PASSWORD: process.env.DEMO_RIDER_PASSWORD || "Rider@123",
});

export default config;
