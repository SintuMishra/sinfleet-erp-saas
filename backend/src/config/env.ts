import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5001),
  API_PREFIX: z.string().default("/api"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  SUPER_ADMIN_NAME: z.string().default("SinSoftware Super Admin"),
  SUPER_ADMIN_EMAIL: z.string().email().default("admin@sinsoftware.in"),
  SUPER_ADMIN_PASSWORD: z.string().min(12).optional(),
  REDIS_URL: z.string().optional()
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  CORS_ORIGINS: parsedEnv.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
};
