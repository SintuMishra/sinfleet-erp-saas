import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { auditLogMiddleware } from "./middleware/audit-log.js";
import { errorHandler } from "./middleware/error-handler.js";
import { inputSanitizer } from "./middleware/input-sanitizer.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { requestLogger } from "./middleware/request-logger.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(requestIdMiddleware);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "same-site" }
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("CORS origin blocked"));
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"]
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(inputSanitizer);
  app.use(requestLogger);
  app.use(auditLogMiddleware);

  app.use(env.API_PREFIX, apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
