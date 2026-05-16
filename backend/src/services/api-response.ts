import type { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Request completed",
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  error = "SERVER_ERROR",
  details?: unknown
) {
  const body: {
    success: false;
    message: string;
    error: string;
    details?: unknown;
  } = {
    success: false,
    message,
    error
  };

  if (details) {
    body.details = details;
  }

  return res.status(statusCode).json(body);
}
