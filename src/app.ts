import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/env";
import { globalLimiter } from "./middlewares/rateLimit.middleware";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import apiRoutes from "./routes";

const app: Application = express();

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (config.NODE_ENV !== "test") {
  app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use(globalLimiter);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
