import { AppError } from "../services/app-error.js";
import type { Role } from "../constants/roles.js";
import { asyncHandler } from "./async-handler.js";

export function requireRole(...roles: Role[]) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError("Permission denied", 403, "PERMISSION_DENIED");
    }

    next();
  });
}
