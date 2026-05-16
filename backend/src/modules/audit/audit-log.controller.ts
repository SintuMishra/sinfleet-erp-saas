import { ROLES } from "../../constants/roles.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/role-guard.js";
import { getTenantCompanyId } from "../../middleware/tenant-context.js";
import { sendSuccess } from "../../services/api-response.js";
import { listAuditLogsQuerySchema } from "./audit-log.schemas.js";
import { listAuditLogs } from "./audit-log.service.js";

export const adminAuditLogGuards = [requireAuth, requireRole(ROLES.SUPER_ADMIN)];
export const companyAuditLogGuards = [requireAuth, requireRole(ROLES.COMPANY_ADMIN, ROLES.USER)];

export const listAdminAuditLogsController = asyncHandler(async (req, res) => {
  const query = listAuditLogsQuerySchema.parse(req.query);
  const logs = await listAuditLogs(query);
  return sendSuccess(res, logs, "Audit logs fetched");
});

export const listCompanyAuditLogsController = asyncHandler(async (req, res) => {
  const companyId = getTenantCompanyId(req.user!);
  const query = listAuditLogsQuerySchema.parse(req.query);
  const logs = await listAuditLogs(query, companyId);
  return sendSuccess(res, logs, "Audit logs fetched");
});
