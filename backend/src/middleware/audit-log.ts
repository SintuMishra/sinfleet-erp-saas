import type { RequestHandler } from "express";
import { createAuditLog, toAuditJson, type AuditAction } from "../services/audit-log.service.js";

const auditableMethods = new Set(["POST", "PATCH", "DELETE"]);

export const auditLogMiddleware: RequestHandler = (req, res, next) => {
  res.on("finish", () => {
    if (!req.user || !auditableMethods.has(req.method) || res.statusCode >= 400) {
      return;
    }

    const auditTarget = getAuditTarget(req.method, req.originalUrl);

    if (!auditTarget) {
      return;
    }

    void createAuditLog({
      companyId: getAuditCompanyId(req.originalUrl, req.companyId),
      userId: req.user.id,
      module: auditTarget.module,
      action: auditTarget.action,
      entityId: getEntityId(req.originalUrl),
      oldValues: null,
      newValues: toAuditJson(req.body ?? {}),
      metadata: toAuditJson({
        method: req.method,
        path: req.originalUrl,
        params: req.params,
        requestId: req.requestId
      })
    });
  });

  next();
};

function getAuditTarget(method: string, path: string): { module: string; action: AuditAction } | null {
  const normalizedPath = path.split("?")[0] ?? path;
  const action = getAction(method, normalizedPath);

  if (normalizedPath.includes("/company/vehicles")) return { module: "vehicles", action };
  if (normalizedPath.includes("/company/drivers")) return { module: "drivers", action };
  if (normalizedPath.includes("/company/clients")) return { module: "clients", action };
  if (normalizedPath.includes("/company/trips")) return { module: "trips", action };
  if (normalizedPath.includes("/company/diesel")) return { module: "diesel", action };
  if (normalizedPath.includes("/company/expenses")) return { module: "expenses", action };
  if (normalizedPath.includes("/company/payments")) return { module: "payments", action };
  if (normalizedPath.includes("/admin/companies") && normalizedPath.endsWith("/status")) return { module: "companies", action: "STATUS_CHANGE" };
  if (normalizedPath.includes("/admin/companies")) return { module: "companies", action };

  return null;
}

function getAction(method: string, path: string): AuditAction {
  if (method === "DELETE") return "DELETE";
  if (path.endsWith("/status")) return "STATUS_CHANGE";
  if (method === "POST") return "CREATE";
  return "UPDATE";
}

function getEntityId(path: string) {
  const segments = path.split("?")[0]?.split("/").filter(Boolean) ?? [];
  const lastSegment = segments.at(-1);
  const candidate = lastSegment === "status" ? segments.at(-2) : lastSegment;
  return candidate && candidate !== "companies" && candidate !== "vehicles" ? candidate : null;
}

function getAuditCompanyId(path: string, requestCompanyId?: string | null) {
  if (path.includes("/admin/companies/")) {
    return getEntityId(path);
  }

  return requestCompanyId ?? null;
}
