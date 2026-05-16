"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CompanyShell } from "@/components/company/company-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCompanyDrivers } from "@/lib/company-directory-api";
import { fetchDriverPerformanceReport } from "@/lib/company-payments-api";
import { companyLabels } from "@/lib/company-labels";

const labels = companyLabels.en;

export default function DriverPerformanceReportPage() {
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [driverId, setDriverId] = React.useState("");
  const reportQuery = useQuery({
    queryKey: ["driver-performance-report", fromDate, toDate, driverId],
    queryFn: () => fetchDriverPerformanceReport({ fromDate, toDate, driverId, limit: 100 })
  });
  const driversQuery = useQuery({ queryKey: ["report-drivers"], queryFn: () => fetchCompanyDrivers({ limit: 100 }) });
  const rows = reportQuery.data?.items ?? [];

  return (
    <CompanyShell>
      <section className="grid gap-6">
        <Header title={labels.driverPerformance} />
        <Card><CardContent className="grid gap-3 pt-5 md:grid-cols-3"><Select label="Driver" value={driverId} onChange={setDriverId} options={(driversQuery.data?.items ?? []).map((item) => ({ value: item.id, label: item.name }))} /><DateInput label="From Date" value={fromDate} onChange={setFromDate} /><DateInput label="To Date" value={toDate} onChange={setToDate} /></CardContent></Card>
        <Card>
          <CardHeader><CardTitle>Driver-wise Performance</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {rows.map((row) => (
              <div key={row.driverId} className="grid gap-3 premium-record rounded-2xl p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-lg font-semibold">{row.driverName}</p>
                  <p className="text-lg font-semibold">{money(row.freightAmount)}</p>
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-4">
                  <Detail label="Trips" value={String(row.totalTrips)} />
                  <Detail label="Delivered" value={String(row.deliveredTrips)} />
                  <Detail label="Cancelled" value={String(row.cancelledTrips)} />
                  <Detail label={labels.dieselCost} value={money(row.dieselAmount)} />
                  <Detail label={labels.otherExpense} value={money(row.expenseAmount)} />
                </div>
              </div>
            ))}
            {!rows.length ? <Empty loading={reportQuery.isLoading} /> : null}
          </CardContent>
        </Card>
      </section>
    </CompanyShell>
  );
}

function Header({ title }: { title: string }) { return <div><p className="text-sm font-medium text-muted-foreground">{labels.reports}</p><h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{title}</h1></div>; }
function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1 text-sm font-medium">{label}<input className="h-10 rounded-xl border bg-white/90 px-3 outline-none focus:ring-2 focus:ring-sky-200" type="date" value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) { return <label className="grid gap-1 text-sm font-medium">{label}<select className="h-10 rounded-xl border bg-white/90 px-3 outline-none focus:ring-2 focus:ring-sky-200" value={value} onChange={(event) => onChange(event.target.value)}><option value="">All</option>{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>; }
function Empty({ loading }: { loading: boolean }) { return <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">{loading ? "Loading report" : "No data found"}</div>; }
function money(value: string | number | undefined) { return `₹${Number(value ?? 0).toLocaleString("en-IN")}`; }
