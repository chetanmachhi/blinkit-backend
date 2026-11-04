import express, { Application, Request, Response, Router } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { notFoundHandler } from "../middlewares/notFound.middleware";
import { createErrorHandler } from "../middlewares/error.middleware";

export interface HttpMount {
  /** Human readable module name, shown on /health */
  name: string;
  /** Base path the module router is mounted on, e.g. "/api/v1/store" */
  basePath: string;
  router: Router;
}

export interface HttpAppOptions {
  serviceName: string;
  nodeEnv: string;
  corsOrigins: string[];
  bodyLimit?: string;
  /** Mount order matters: put more specific base paths first. */
  mounts: HttpMount[];
}

/**
 * Builds an Express app with the common middleware stack.
 * Used by the monolith (src/server.ts) AND by every module's standalone
 * server, so splitting a module into its own service needs no new wiring.
 */
export const createHttpApp = (options: HttpAppOptions): Application => {
  const app = express();
  const isProduction = options.nodeEnv === "production";

  // Render / most PaaS sit behind one proxy hop. Needed so rate limiting
  // is per client IP instead of per proxy IP.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors({ origin: options.corsOrigins, credentials: true }));
  app.use(express.json({ limit: options.bodyLimit || "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: options.bodyLimit || "1mb" }));

  if (options.nodeEnv !== "test") {
    app.use(morgan(isProduction ? "combined" : "dev"));
  }

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: options.serviceName,
      modules: options.mounts.map((m) => ({ name: m.name, basePath: m.basePath })),
      timestamp: new Date().toISOString(),
    });
  });

  for (const mount of options.mounts) {
    app.use(mount.basePath, mount.router);
  }

  app.use(notFoundHandler);
  app.use(createErrorHandler({ isProduction }));

  return app;
};
