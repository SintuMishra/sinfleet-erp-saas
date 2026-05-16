"use client";

import { Download, Search } from "lucide-react";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CompanyShell } from "@/components/company/company-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchOutstandingReport } from "@/lib/company-payments-api";
import { companyLabels } from "@/lib/company-labels";
import { downloadCompanyExport } from "@/lib/exports/company-export-api";

const labels = companyLabels.en;

export default function CompanyOutstandingReportPage() {
  const [search, setSearch] = React.useState("");
  const [downloadState, setDownloadState] = React.useState<"idle" | "loading" | "error">("idle");
  const outstandingQuery = useQuery({
    queryKey: ["company-outstanding", search],
    queryFn: () => fetchOutstandingReport(search)
  });

  const report = outstandingQuery.data;

  async function downloadExcel() {
    setDownloadState("loading");
    try {
      await downloadCompanyExport("/company/exports/outstanding.xlsx", "outstanding.xlsx", { search });
      setDownloadState("idle");
    } catch {
      setDownloadState("error");
    }
  }

  return (
    <CompanyShell>
      <section className="responsive-page">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{labels.companyPanel}</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{labels.outstanding}</h1>
        </div>

        <div className="responsive-summary-grid">
          <SummaryCard label="Pending Balance" value={money(report?.summary.balanceAmount)} />
          <SummaryCard label="Received Amount" value={money(report?.summary.receivedAmount)} />
          <SummaryCard label="Freight Amount" value={money(report?.summary.freightAmount)} />
          <SummaryCard label="Pending Trips" value={String(report?.summary.tripCount ?? 0)} />
        </div>

        <Card>
          <CardContent className="grid gap-3 pt-5 md:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                className="h-11 w-full rounded-xl border bg-white/90 pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-sky-200"
                placeholder={labels.searchOutstanding}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <Button type="button" className="h-11 w-full gap-2 md:w-auto" onClick={downloadExcel} disabled={downloadState === "loading"}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {downloadState === "loading" ? "Downloading" : "Download Excel"}
            </Button>
          </CardContent>
        </Card>
        {downloadState === "error" ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Export could not be downloaded.</p> : null}

        <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Client-wise Outstanding</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {(report?.clientOutstanding ?? []).map((client) => (
                <div key={client.clientId} className="grid gap-3 premium-record rounded-2xl p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold">{client.clientName}</p>
                      <p className="text-sm text-muted-foreground">{client.phone || "Phone not added"}</p>
                    </div>
                    <p className="text-lg font-semibold">{money(client.balanceAmount)}</p>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
                    <Detail label="Freight" value={money(client.freightAmount)} />
                    <Detail label="Received" value={money(client.receivedAmount)} />
                    <Detail label="Trips" value={String(client.tripCount)} />
                  </div>
                </div>
              ))}
              {!(report?.clientOutstanding.length ?? 0) ? <Empty loading={outstandingQuery.isLoading} /> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trip-wise Outstanding</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {(report?.tripOutstanding ?? []).map((trip) => (
                <div key={trip.id} className="grid gap-3 premium-record rounded-2xl p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold">{trip.tripNumber}</p>
                      <p className="text-sm text-muted-foreground">{trip.client.clientName} / {trip.vehicle.vehicleNumber}</p>
                      <p className="text-sm text-muted-foreground">{trip.sourceLocation} to {trip.destinationLocation}</p>
                    </div>
                    <p className="text-lg font-semibold">{money(trip.balanceAmount)}</p>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
                    <Detail label="Freight" value={money(trip.freightAmount)} />
                    <Detail label="Received" value={money(trip.receivedAmount)} />
                    <Detail label="Loading" value={new Date(trip.loadingDate).toLocaleDateString("en-IN")} />
                  </div>
                </div>
              ))}
              {!(report?.tripOutstanding.length ?? 0) ? <Empty loading={outstandingQuery.isLoading} /> : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </CompanyShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold sm:text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Empty({ loading }: { loading: boolean }) {
  return <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">{loading ? "Loading outstanding" : "No outstanding found"}</div>;
}

function money(value: string | number | undefined) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}
