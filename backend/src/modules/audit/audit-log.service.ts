import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { ListAuditLogsQuery } from "./audit-log.schemas.js";

export async function listAuditLogs(query: ListAuditLogsQuery, scopedCompanyId?: string | null) {
  const where: Prisma.AuditLogWhereInput = {
    ...(scopedCompanyId ? { companyId: scopedCompanyId } : {}),
    ...(!scopedCompanyId && query.companyId ? { companyId: query.companyId } : {}),
    ...(query.module ? { module: query.module } : {}),
    ...(query.action ? { action: query.action } : {})
  };

  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  };
}
