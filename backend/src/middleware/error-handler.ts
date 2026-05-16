import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../services/app-error.js";
import { sendError } from "../services/api-response.js";
import { logError, logWarn } from "../services/logger.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logError("app_error", { requestId: req.requestId, code: error.code, message: error.message });
    }
    return sendError(res, error.message, error.statusCode, error.code, error.details);
  }

  if (error instanceof ZodError) {
    logWarn("validation_error", { requestId: req.requestId, issues: error.issues });
    return sendError(
      res,
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    );
  }

  logError("unhandled_error", {
    requestId: req.requestId,
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error && process.env.NODE_ENV !== "production" ? error.stack : undefined
  });
  return sendError(res, "Internal server error", 500, "SERVER_ERROR", { requestId: req.requestId });
};
