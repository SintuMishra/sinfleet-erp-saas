"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CompanyShell } from "@/components/company/company-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDocumentExpiryReport } from "@/lib/company-payments-api";
import { companyLabels } from "@/lib/company-labels";

const labels = companyLabels.en;

export default function DocumentExpiryReportPage() {
  const [days, setDays] = React.useState(30);
  const reportQuery = useQuery({
    queryKey: ["document-expiry-report", days],
    queryFn: () => fetchDocumentExpiryReport({ days, limit: 100 })
  });
  const report = reportQuery.data;

  return (
    <CompanyShell>
      <section className="grid gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{labels.reports}</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{labels.documentExpiry}</h1>
        </div>
        <Card>
          <CardContent className="grid gap-3 pt-5 sm:grid-cols-[220px_1fr]">
            <label className="grid gap-1 text-sm font-medium">
              Days
              <input className="h-10 rounded-xl border bg-white/90 px-3 outline-none focus:ring-2 focus:ring-sky-200" type="number" min={1} max={365} value={days} onChange={(event) => setDays(Number(event.target.value))} />
            </label>
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <Detail label="Vehicle Documents" value={String(report?.summary.vehicleDocumentsExpiring ?? 0)} />
              <Detail label="Driver Licenses" value={String(report?.summary.driverLicensesExpiring ?? 0)} />
              <Detail label="Total Expiring" value={String(report?.summary.totalExpiring ?? 0)} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Vehicle Documents</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {(report?.vehicles ?? []).map((vehicle) => (
                <div key={vehicle.id} className="grid gap-2 premium-record rounded-2xl p-4">
                  <p className="text-lg font-semibold">{vehicle.vehicleNumber}</p>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <Detail label="Insurance" value={date(vehicle.insuranceExpiryDate)} />
                    <Detail label="Fitness" value={date(vehicle.fitnessExpiryDate)} />
                    <Detail label="Permit" value={date(vehicle.permitExpiryDate)} />
                    <Detail label="Pollution" value={date(vehicle.pollutionExpiryDate)} />
                  </div>
                </div>
              ))}
              {!report?.vehicles.length ? <Empty loading={reportQuery.isLoading} /> : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Driver Licenses</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {(report?.drivers ?? []).map((driver) => (
                <div key={driver.id} className="grid gap-2 premium-record rounded-2xl p-4 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-lg font-semibold">{driver.name}</p>
                    <p className="text-sm text-muted-foreground">{driver.phone} / {driver.licenseNumber}</p>
                  </div>
                  <p className="font-medium">{date(driver.licenseExpiryDate)}</p>
                </div>
              ))}
              {!report?.drivers.length ? <Empty loading={reportQuery.isLoading} /> : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </CompanyShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>; }
function Empty({ loading }: { loading: boolean }) { return <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">{loading ? "Loading report" : "No expiring documents found"}</div>; }
function date(value: string) { return new Date(value).toLocaleDateString("en-IN"); }
