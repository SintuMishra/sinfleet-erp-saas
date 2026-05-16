import type { RequestHandler } from "express";
import { AppError } from "../services/app-error.js";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix: string;
};

const buckets = new Map<string, { count: number; resetAt: number }>();

export function createRateLimit({ windowMs, max, keyPrefix }: RateLimitOptions): RequestHandler {
  return (req, _res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${req.ip}:${req.path}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > max) {
      throw new AppError("Too many requests. Please try again shortly.", 429, "RATE_LIMITED");
    }

    next();
  };
}
