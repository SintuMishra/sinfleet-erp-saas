"use client";

import { AlertTriangle, CircleDollarSign, Fuel, ReceiptText, Route, Settings, Truck } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CompanyShell } from "@/components/company/company-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/premium/empty-state";
import { PageHeader } from "@/components/premium/page-header";
import { StatCard } from "@/components/premium/stat-card";
import { StatusBadge } from "@/components/premium/status-badge";
import { fetchDashboardReport } from "@/lib/company-payments-api";
import { companyLabels } from "@/lib/company-labels";

const labels = companyLabels.en;

export default function CompanyDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["company-dashboard-report"],
    queryFn: () => fetchDashboardReport({})
  });

  const report = dashboardQuery.data;
  const stats = [
    { label: labels.totalVehicles, value: report?.totalVehicles ?? 0, icon: Truck, tone: "cyan" as const, helper: "Registered fleet" },
    { label: labels.onTrip, value: report?.onTripVehicles ?? 0, icon: Route, tone: "blue" as const, helper: "Currently moving" },
    { label: labels.totalIncome, value: money(report?.totalFreight), icon: CircleDollarSign, tone: "emerald" as const, helper: "Freight booked" },
    { label: labels.pendingPayment, value: money(report?.totalOutstanding), icon: ReceiptText, tone: "amber" as const, helper: "To collect" },
    { label: labels.netProfit, value: money(report?.netProfit), icon: CircleDollarSign, tone: "emerald" as const, helper: "After costs" },
    { label: labels.dieselCost, value: money(report?.totalDieselAmount), icon: Fuel, tone: "rose" as const, helper: "Fuel spend" },
    { label: labels.otherExpense, value: money(report?.totalExpenseAmount), icon: Settings, tone: "amber" as const, helper: "Operational cost" },
    { label: labels.expiringDocuments, value: report?.expiringDocumentsCount ?? 0, icon: AlertTriangle, tone: "rose" as const, helper: "Needs attention" }
  ];

  return (
    <CompanyShell>
      <section className="responsive-page">
        <PageHeader
          eyebrow={labels.companyPanel}
          title={labels.dashboard}
          description="A clean control room for fleet position, collections, cost and profit."
          icon={Truck}
          actions={
            <Link
              href="/company/reports"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/25"
            >
              Open Reports
            </Link>
          }
        />

        <Card className="relative overflow-hidden bg-slate-950 text-white">
          <div className="premium-hero-grid absolute inset-0 opacity-80" />
          <CardContent className="relative grid gap-6 pt-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-cyan-200">Today&apos;s transport pulse</p>
              <h2 className="mt-2 max-w-2xl text-2xl font-semibold leading-tight tracking-normal text-white sm:text-3xl">
                {report?.onTripVehicles ?? 0} vehicles on route, {money(report?.totalOutstanding)} pending collection.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Prioritize active trips, expiring documents, fuel cost and client dues from one place.
              </p>
            </div>
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-300">Income</span>
                <span className="font-semibold text-emerald-200">{money(report?.totalFreight)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-300">Received {money(report?.totalReceived)}</span>
                <span className="text-amber-200">Pending {money(report?.totalOutstanding)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="responsive-summary-grid">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Trips</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {(report?.recentTrips ?? []).map((trip) => (
                <div key={trip.id} className="grid gap-2 premium-record rounded-2xl p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <p className="font-semibold">{trip.tripNumber}</p>
                    <p className="text-sm text-muted-foreground">{trip.sourceLocation} to {trip.destinationLocation}</p>
                    <p className="text-sm text-muted-foreground">{trip.client.clientName} / {trip.vehicle.vehicleNumber}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-medium">{money(trip.freightAmount)}</p>
                    <StatusBadge value={trip.status} />
                  </div>
                </div>
              ))}
              {!report?.recentTrips.length ? <Empty loading={dashboardQuery.isLoading} label="No recent trips" /> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Clients By Revenue</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {(report?.topClientsByRevenue ?? []).map((client) => (
                <div key={client.clientId} className="grid gap-2 premium-record rounded-2xl p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <p className="font-semibold">{client.clientName}</p>
                    <p className="text-sm text-muted-foreground">{client.totalTrips} trips</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-medium">{money(client.totalFreight)}</p>
                    <p className="text-sm text-muted-foreground">Pending {money(client.outstanding)}</p>
                  </div>
                </div>
              ))}
              {!report?.topClientsByRevenue.length ? <Empty loading={dashboardQuery.isLoading} label="No client revenue yet" /> : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </CompanyShell>
  );
}

function Empty({ loading, label }: { loading: boolean; label: string }) {
  return (
    <EmptyState
      title={loading ? "Loading dashboard" : label}
      text={loading ? "Fetching latest fleet analytics." : "Operational records will appear here as your team works."}
    />
  );
}

function money(value: string | number | undefined) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}
