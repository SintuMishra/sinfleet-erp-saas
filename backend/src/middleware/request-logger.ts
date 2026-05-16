import type { RequestHandler } from "express";
import { logInfo } from "../services/logger.js";

export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    logInfo("http_request", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user?.id,
      companyId: req.companyId,
      ip: req.ip
    });
  });

  next();
};
