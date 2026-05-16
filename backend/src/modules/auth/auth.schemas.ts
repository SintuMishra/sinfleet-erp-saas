import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20)
});
