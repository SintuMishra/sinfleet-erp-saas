import type { RequestHandler } from "express";
import { sendError } from "../services/api-response.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, "ROUTE_NOT_FOUND");
};
