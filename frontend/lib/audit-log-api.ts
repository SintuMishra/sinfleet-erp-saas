import { apiClient } from "@/lib/api-client";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type AuditLogRow = {
  id: string;
  companyId?: string | null;
  userId?: string | null;
  module: string;
  action: string;
  entityId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  metadata?: unknown;
  createdAt: string;
};

export type AuditLogParams = {
  page?: number;
  limit?: number;
  module?: string;
  action?: string;
  companyId?: string;
};

export type AuditLogList = {
  items: AuditLogRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function fetchCompanyAuditLogs(params: AuditLogParams = {}) {
  const response = await apiClient.get<ApiResponse<AuditLogList>>("/company/audit-logs", {
    params: cleanParams(params)
  });

  return response.data.data;
}

export async function fetchAdminAuditLogs(params: AuditLogParams = {}) {
  const response = await apiClient.get<ApiResponse<AuditLogList>>("/admin/audit-logs", {
    params: cleanParams(params)
  });

  return response.data.data;
}

function cleanParams(params: AuditLogParams) {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
    module: params.module || undefined,
    action: params.action || undefined,
    companyId: params.companyId || undefined
  };
}
