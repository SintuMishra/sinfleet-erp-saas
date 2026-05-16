import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { sendSuccess } from "../../services/api-response.js";
import { loginSchema, logoutSchema, refreshSchema } from "./auth.schemas.js";
import { getCurrentUser, login, logout, refreshAccessToken } from "./auth.service.js";

export const loginController = asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const data = await login(body.email, body.password);
  return sendSuccess(res, data, "Login successful");
});

export const refreshController = asyncHandler(async (req, res) => {
  const body = refreshSchema.parse(req.body);
  const data = await refreshAccessToken(body.refreshToken);
  return sendSuccess(res, data, "Token refreshed");
});

export const logoutController = asyncHandler(async (req, res) => {
  const body = logoutSchema.parse(req.body);
  const data = await logout(body.refreshToken);
  return sendSuccess(res, data, "Logout successful");
});

export const meGuards = [requireAuth];

export const meController = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user!.id);
  return sendSuccess(res, user, "Current user fetched");
});
