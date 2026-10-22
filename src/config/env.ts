import dotenv from "dotenv";

dotenv.config();

interface Config {
  PORT: number;
  NODE_ENV: string;
  MONGO_URI: string;
  DEFAULT_STORE_ID: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  OTP_TTL_MINUTES: number;
  OTP_MAX_ATTEMPTS: number;
  DEV_FIXED_OTP: string;
  CORS_ORIGINS: string[];
  ADMIN_BOOTSTRAP_EMAIL: string;
  ADMIN_BOOTSTRAP_PASSWORD: string;
}

const requiredVars = [
  "PORT",
  "NODE_ENV",
  "MONGO_URI",
  "DEFAULT_STORE_ID",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_ACCESS_EXPIRES_IN",
  "JWT_REFRESH_EXPIRES_IN",
  "OTP_TTL_MINUTES",
  "OTP_MAX_ATTEMPTS",
  "DEV_FIXED_OTP",
  "CORS_ORIGINS",
  "ADMIN_BOOTSTRAP_EMAIL",
  "ADMIN_BOOTSTRAP_PASSWORD",
] as const;

const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}`
  );
}

const config: Config = Object.freeze({
  PORT: parseInt(process.env.PORT!, 10),
  NODE_ENV: process.env.NODE_ENV!,
  MONGO_URI: process.env.MONGO_URI!,
  DEFAULT_STORE_ID: process.env.DEFAULT_STORE_ID!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN!,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN!,
  OTP_TTL_MINUTES: parseInt(process.env.OTP_TTL_MINUTES!, 10),
  OTP_MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS!, 10),
  DEV_FIXED_OTP: process.env.DEV_FIXED_OTP!,
  CORS_ORIGINS: process.env.CORS_ORIGINS!.split(",").map((s) => s.trim()),
  ADMIN_BOOTSTRAP_EMAIL: process.env.ADMIN_BOOTSTRAP_EMAIL!,
  ADMIN_BOOTSTRAP_PASSWORD: process.env.ADMIN_BOOTSTRAP_PASSWORD!,
});

export default config;
