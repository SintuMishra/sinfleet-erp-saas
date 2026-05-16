import type { RequestHandler } from "express";

export const inputSanitizer: RequestHandler = (req, _res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query) as typeof req.query;
  next();
};

function sanitize(value: unknown): unknown {
  if (typeof value === "string") {
    return value.trim().replaceAll("\u0000", "");
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (["__proto__", "constructor", "prototype"].includes(key)) {
      continue;
    }

    sanitized[key] = sanitize(nestedValue);
  }

  return sanitized;
}
