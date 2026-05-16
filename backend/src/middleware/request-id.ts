import { randomUUID } from "crypto";
import type { RequestHandler } from "express";

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const incomingRequestId = req.headers["x-request-id"];
  req.requestId = Array.isArray(incomingRequestId) ? incomingRequestId[0] : incomingRequestId || randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};
