"use client";

import { Activity, ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/premium/empty-state";
import { PageHeader } from "@/components/premium/page-header";
import { ResponsiveTable } from "@/components/premium/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AuditLogList, AuditLogParams } from "@/lib/audit-log-api";
import { cn } from "@/lib/utils";

const modules = ["", "exports", "companies", "vehicles", "drivers", "clients", "trips", "diesel", "expenses", "payments", "auth"];
const actions = ["", "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE", "EXPORT", "LOGIN", "LOGOUT"];

export function AuditLogView({
  title,
  eyebrow,
  description,
  scope,
  fetchLogs
}: {
  title: string;
  eyebrow: string;
  description: string;
  scope: "admin" | "company";
  fetchLogs: (params: AuditLogParams) => Promise<AuditLogList>;
}) {
  const [page, setPage] = React.useState(1);
  const [module, setModule] = React.useState("");
  const [action, setAction] = React.useState("");
  const [companyId, setCompanyId] = React.useState("");
  const params = React.useMemo(
    () => ({
      page,
      limit: 50,
      module,
      action,
      companyId: scope === "admin" ? companyId.trim() : undefined
    }),
    [action, companyId, module, page, scope]
  );

  const auditQuery = useQuery({
    queryKey: [scope, "audit-logs", params],
    queryFn: () => fetchLogs(params)
  });

  const logs = auditQuery.data?.items ?? [];
  const pagination = auditQuery.data?.pagination;

  React.useEffect(() => {
    setPage(1);
  }, [action, companyId, module]);

  return (
    <section className="responsive-page">
      <PageHeader eyebrow={eyebrow} title={title} description={description} icon={ShieldCheck} />

      <Card>
        <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Module
            <select className="h-11 rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200" value={module} onChange={(event) => setModule(event.target.value)}>
              {modules.map((item) => (
                <option key={item || "all-modules"} value={item}>{item ? labelize(item) : "All modules"}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Action
            <select className="h-11 rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200" value={action} onChange={(event) => setAction(event.target.value)}>
              {actions.map((item) => (
                <option key={item || "all-actions"} value={item}>{item ? labelize(item) : "All actions"}</option>
              ))}
            </select>
          </label>

          {scope === "admin" ? (
            <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
              Company ID
              <span className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <input
                  className="h-11 w-full rounded-xl border bg-white pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Filter by tenant company UUID"
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
                />
              </span>
            </label>
          ) : null}
        </CardContent>
      </Card>

      {auditQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Audit logs could not be loaded. Please check your session and try again.
        </div>
      ) : null}

      <Card>
        <CardContent className="pt-5">
          {logs.length ? (
            <ResponsiveTable minWidth={980}>
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Time</th>
                    <th className="px-3 py-3 font-semibold">Module</th>
                    <th className="px-3 py-3 font-semibold">Action</th>
                    <th className="px-3 py-3 font-semibold">Entity</th>
                    <th className="px-3 py-3 font-semibold">User</th>
                    {scope === "admin" ? <th className="px-3 py-3 font-semibold">Company</th> : null}
                    <th className="px-3 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id} className="align-top">
                      <td className="px-3 py-3 text-slate-600">{formatDateTime(log.createdAt)}</td>
                      <td className="px-3 py-3 font-medium text-slate-950">{labelize(log.module)}</td>
                      <td className="px-3 py-3"><ActionBadge action={log.action} /></td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-600">{shortId(log.entityId)}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-600">{shortId(log.userId)}</td>
                      {scope === "admin" ? <td className="px-3 py-3 font-mono text-xs text-slate-600">{shortId(log.companyId)}</td> : null}
                      <td className="max-w-[360px] px-3 py-3 text-xs leading-5 text-slate-600">{summarizeLog(log)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTable>
          ) : (
            <EmptyState
              title={auditQuery.isLoading ? "Loading audit trail" : "No audit logs found"}
              text={auditQuery.isLoading ? "Fetching recent operational activity." : "New creates, updates, deletes and exports will appear here."}
              icon={Activity}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-muted-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {pagination?.page ?? page} of {Math.max(pagination?.totalPages ?? 1, 1)} · {pagination?.total ?? 0} events
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="gap-2" disabled={page <= 1 || auditQuery.isFetching} onClick={() => setPage((value) => Math.max(value - 1, 1))}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </Button>
          <Button type="button" className="gap-2" disabled={page >= (pagination?.totalPages ?? 1) || auditQuery.isFetching} onClick={() => setPage((value) => value + 1)}>
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function ActionBadge({ action }: { action: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", actionClass(action))}>
      {labelize(action)}
    </span>
  );
}

function actionClass(action: string) {
  if (action === "EXPORT") return "bg-sky-50 text-sky-700";
  if (action === "DELETE") return "bg-rose-50 text-rose-700";
  if (action === "CREATE") return "bg-emerald-50 text-emerald-700";
  if (action === "UPDATE" || action === "STATUS_CHANGE") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function labelize(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function shortId(value?: string | null) {
  if (!value) return "-";
  return value.length > 13 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function summarizeLog(log: { metadata?: unknown; newValues?: unknown; oldValues?: unknown }) {
  return preview(log.metadata) || preview(log.newValues) || preview(log.oldValues) || "-";
}

function preview(value: unknown) {
  if (!value || (typeof value === "object" && Object.keys(value).length === 0)) return "";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}
