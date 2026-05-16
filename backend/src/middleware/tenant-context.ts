import { ROLES, type Role } from "../constants/roles.js";
import { AppError } from "../services/app-error.js";
import { asyncHandler } from "./async-handler.js";

export const requireTenant = asyncHandler(async (req, _res, next) => {
  if (req.user?.role === ROLES.SUPER_ADMIN) {
    next();
    return;
  }

  if (!req.companyId) {
    throw new AppError("Tenant context required", 400, "TENANT_REQUIRED");
  }

  next();
});

export function assertTenantAccess(user: { role: Role; companyId?: string | null }, companyId: string) {
  if (user.role === ROLES.SUPER_ADMIN) {
    return;
  }

  if (!user.companyId || user.companyId !== companyId) {
    throw new AppError("Tenant access denied", 403, "TENANT_ACCESS_DENIED");
  }
}

export function getTenantCompanyId(user: { role: Role; companyId?: string | null }) {
  if (!user.companyId) {
    throw new AppError("Tenant context required", 400, "TENANT_REQUIRED");
  }

  return user.companyId;
}
