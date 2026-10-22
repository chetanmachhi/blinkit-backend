import http from "http";
import mongoose from "mongoose";
import app from "./app";
import connectDB from "./config/db";
import config from "./config/env";

const server = http.createServer(app);

const startServer = async (): Promise<void> => {
  await connectDB();

  server.listen(config.PORT, () => {
    console.log(`[Server] Running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  });
};

const handleShutdown = async (signal: string): Promise<void> => {
  console.log(`[Server] Received ${signal}, shutting down gracefully`);
  server.close(async () => {
    console.log("[Server] HTTP server closed");
    await mongoose.connection.close(false);
    console.log("[DB] MongoDB connection closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("[Server] Forceful shutdown initiated");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

process.on("unhandledRejection", (reason: unknown) => {
  console.error("[Server] Unhandled rejection:", reason);
});

process.on("uncaughtException", (error: Error) => {
  console.error("[Server] Uncaught exception:", error);
  process.exit(1);
});

startServer();
