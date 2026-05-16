"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CompanyShell } from "@/components/company/company-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCompanyClients } from "@/lib/company-directory-api";
import { fetchClientLedgerReport } from "@/lib/company-payments-api";
import { companyLabels } from "@/lib/company-labels";

const labels = companyLabels.en;

export default function ClientLedgerReportPage() {
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const reportQuery = useQuery({
    queryKey: ["client-ledger-report", fromDate, toDate, clientId],
    queryFn: () => fetchClientLedgerReport({ fromDate, toDate, clientId, limit: 100 })
  });
  const clientsQuery = useQuery({ queryKey: ["report-clients"], queryFn: () => fetchCompanyClients({ limit: 100 }) });
  const rows = reportQuery.data?.items ?? [];

  return (
    <CompanyShell>
      <section className="grid gap-6">
        <Header title={labels.clientLedger} />
        <Card><CardContent className="grid gap-3 pt-5 md:grid-cols-3"><Select label="Client" value={clientId} onChange={setClientId} options={(clientsQuery.data?.items ?? []).map((item) => ({ value: item.id, label: item.clientName }))} /><DateInput label="From Date" value={fromDate} onChange={setFromDate} /><DateInput label="To Date" value={toDate} onChange={setToDate} /></CardContent></Card>
        <div className="grid gap-4">
          {rows.map((client) => (
            <Card key={client.clientId}>
              <CardHeader><CardTitle>{client.clientName}</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2 text-sm sm:grid-cols-4">
                  <Detail label="Trips" value={String(client.totalTrips)} />
                  <Detail label={labels.totalIncome} value={money(client.totalFreight)} />
                  <Detail label="Received Amount" value={money(client.totalReceived)} />
                  <Detail label={labels.pendingPayment} value={money(client.outstanding)} />
                </div>
                <div className="grid gap-2">
                  {client.tripBreakdown.slice(0, 8).map((trip) => (
                    <div key={trip.id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_auto]">
                      <div>
                        <p className="font-medium">{trip.tripNumber}</p>
                        <p className="text-sm text-muted-foreground">{trip.sourceLocation} to {trip.destinationLocation}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="font-medium">{money(trip.freightAmount)}</p>
                        <p className="text-sm text-muted-foreground">Pending {money(trip.balanceAmount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {!rows.length ? <Card><CardContent><Empty loading={reportQuery.isLoading} /></CardContent></Card> : null}
        </div>
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
