import http from "http";
import mongoose from "mongoose";
import { Application } from "express";

export interface StartServerOptions {
  name: string;
  port: number;
  mongoUri: string;
  nodeEnv: string;
  /** Runs after the DB connects and before the port opens. */
  onDatabaseReady?: () => Promise<void>;
}

/**
 * Connects MongoDB, starts HTTP and wires graceful shutdown.
 * Shared by the monolith and the per-module standalone servers.
 */
export const startServer = async (
  app: Application,
  options: StartServerOptions
): Promise<http.Server> => {
  const tag = `[${options.name}]`;

  try {
    await mongoose.connect(options.mongoUri);
    console.log(`${tag} MongoDB connected: ${mongoose.connection.name}`);
  } catch (error) {
    console.error(`${tag} MongoDB connection failed:`, error);
    process.exit(1);
  }

  if (options.onDatabaseReady) {
    try {
      await options.onDatabaseReady();
    } catch (error) {
      // Startup hooks (e.g. demo seeding) must never take the API down.
      console.error(`${tag} Startup hook failed:`, error);
    }
  }

  const server = http.createServer(app);
  server.listen(options.port, () => {
    console.log(`${tag} Listening on port ${options.port} (${options.nodeEnv})`);
  });

  const shutdown = (signal: string): void => {
    console.log(`${tag} Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      await mongoose.connection.close(false);
      console.log(`${tag} HTTP server and MongoDB connection closed`);
      process.exit(0);
    });
    setTimeout(() => {
      console.error(`${tag} Forceful shutdown`);
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason: unknown) => {
    console.error(`${tag} Unhandled rejection:`, reason);
  });
  process.on("uncaughtException", (error: Error) => {
    console.error(`${tag} Uncaught exception:`, error);
    process.exit(1);
  });

  return server;
};
