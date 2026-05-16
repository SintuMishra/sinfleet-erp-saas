"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { AuditLogView } from "@/components/audit/audit-log-view";
import { fetchAdminAuditLogs } from "@/lib/audit-log-api";

export default function AdminAuditLogsPage() {
  return (
    <AdminShell>
      <AuditLogView
        title="Audit Logs"
        eyebrow="SinSoftware Control Center"
        description="Cross-tenant administrative audit trail with optional tenant filtering."
        scope="admin"
        fetchLogs={fetchAdminAuditLogs}
      />
    </AdminShell>
  );
}
