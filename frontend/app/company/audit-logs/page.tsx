"use client";

import { AuditLogView } from "@/components/audit/audit-log-view";
import { CompanyShell } from "@/components/company/company-shell";
import { fetchCompanyAuditLogs } from "@/lib/audit-log-api";

export default function CompanyAuditLogsPage() {
  return (
    <CompanyShell>
      <AuditLogView
        title="Audit Logs"
        eyebrow="Company Panel"
        description="Tenant-scoped activity for exports, record changes and operational controls."
        scope="company"
        fetchLogs={fetchCompanyAuditLogs}
      />
    </CompanyShell>
  );
}
