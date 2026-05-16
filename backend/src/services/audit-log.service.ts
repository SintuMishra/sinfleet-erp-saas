import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { logError, sanitizeForLog } from "./logger.js";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";

export type AuditLogInput = {
  companyId?: string | null;
  userId?: string | null;
  module: string;
  action: AuditAction;
  entityId?: string | null;
  oldValues?: Prisma.InputJsonValue | null;
  newValues?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue | null;
};

export async function createAuditLog(input: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: input.companyId ?? null,
        userId: input.userId ?? null,
        module: input.module,
        action: input.action,
        entityId: input.entityId ?? null,
        oldValues: input.oldValues ?? undefined,
        newValues: input.newValues ?? undefined,
        metadata: input.metadata ?? undefined
      }
    });
  } catch (error) {
    logError("audit_log_failed", {
      error: error instanceof Error ? error.message : "Unknown audit error",
      audit: sanitizeForLog(input)
    });
  }
}

export function toAuditJson(value: unknown): Prisma.InputJsonValue {
  return sanitizeForLog(value) as Prisma.InputJsonValue;
}
