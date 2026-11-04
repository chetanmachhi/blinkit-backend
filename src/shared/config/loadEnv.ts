import dotenv from "dotenv";
import path from "path";

let loaded = false;

/**
 * Loads the backend-root .env exactly once.
 * Path is resolved from this file, so it works from src/ (ts-node-dev)
 * and dist/ (compiled) regardless of the current working directory.
 * Real environment variables (e.g. on Render) always win over .env.
 */
export const loadEnv = (): void => {
  if (loaded) return;
  dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
  loaded = true;
};

export const parseList = (value: string | undefined, fallback: string[] = []): string[] =>
  value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : fallback;
