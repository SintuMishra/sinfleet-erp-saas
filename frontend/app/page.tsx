import { ArrowRight, BarChart3, CircleDollarSign, Fuel, Route, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const metrics = [
  { label: "Fleet Utilisation", value: "Live", icon: Truck },
  { label: "Trip Profit", value: "Clear", icon: BarChart3 },
  { label: "Diesel Control", value: "Tight", icon: Fuel },
  { label: "Outstanding", value: "Tracked", icon: CircleDollarSign },
  { label: "Invoices", value: "PDF", icon: ShieldCheck },
  { label: "Audit Trail", value: "Ready", icon: ShieldCheck }
];

export default function HomePage() {
  return (
    <main className="premium-shell min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-sky-400 text-slate-950 shadow-lg shadow-cyan-300/20">
              <Truck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-5 text-white">SinFleet ERP</p>
              <p className="text-xs text-cyan-100/70">SinSoftware Solutions</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/company/login"><Button variant="secondary">Company Login</Button></Link>
            <Link href="/admin/login"><Button>Admin</Button></Link>
          </div>
        </header>

        <section className="grid min-w-0 flex-1 items-center gap-10 py-10 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:py-12">
          <div className="min-w-0">
            <span className="premium-badge border-cyan-300/30 bg-cyan-300/10 text-cyan-100">Indian transport SaaS · Hindi / English ready</span>
            <h1 className="mt-6 max-w-4xl break-words text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Smart Transport Management Platform
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Built for fleet owners, transport contractors and logistics operators who need trips, diesel, expenses,
                payments, invoices, Excel exports, audit logs and profit in one premium workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/company/login">
                <Button className="h-12 gap-2 px-5 text-base">Start Company Panel <ArrowRight className="h-5 w-5" /></Button>
              </Link>
              <Link href="/admin/login">
                <Button variant="secondary" className="h-12 gap-2 px-5 text-base"><ShieldCheck className="h-5 w-5" /> Super Admin</Button>
              </Link>
            </div>
          </div>

          <Card className="border-white/20 bg-white/90 shadow-2xl shadow-cyan-950/30">
            <CardContent className="grid gap-5 p-5">
              <div className="rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-sm text-cyan-200">Today&apos;s control room</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <metric.icon className="h-5 w-5 text-cyan-300" aria-hidden="true" />
                      <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
                      <p className="text-sm text-slate-300">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {["Trips", "Diesel", "Payments", "Reports", "Exports", "Audit"].map((item) => (
                  <div key={item} className="rounded-2xl border bg-slate-50 p-4">
                    <Route className="h-5 w-5 text-sky-600" aria-hidden="true" />
                    <p className="mt-2 font-semibold text-slate-950">{item}</p>
                    <p className="text-sm text-slate-500">Ready</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
