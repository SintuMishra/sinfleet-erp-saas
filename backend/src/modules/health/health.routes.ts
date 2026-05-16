import { Router } from "express";
import { env } from "../../config/env.js";
import { sendSuccess } from "../../services/api-response.js";

export const healthRouter = Router();

healthRouter.get("/", (req, res) => {
  return sendSuccess(res, {
    service: "sinfleet-erp-api",
    status: "ok",
    environment: env.NODE_ENV,
    version: process.env.npm_package_version ?? "0.1.0",
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime())
  });
});
