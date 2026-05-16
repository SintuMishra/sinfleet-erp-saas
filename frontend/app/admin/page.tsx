"use client";

import { Building2, CreditCard, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Companies", value: "Manage", icon: Building2 },
  { label: "Subscriptions", value: "Ready", icon: CreditCard },
  { label: "Users", value: "Controlled", icon: UsersRound },
  { label: "Audit Trail", value: "Visible", icon: ShieldCheck }
];

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <section className="responsive-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">SinSoftware Solutions</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Super Admin Dashboard</h1>
          </div>
          <Link
            href="/admin/companies"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Manage Companies
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Link href="/admin/companies" className="block">
            <Card className="h-full hover:border-primary/50">
              <CardContent className="grid gap-2 pt-5">
                <Building2 className="h-6 w-6 text-primary" aria-hidden="true" />
                <p className="font-semibold text-slate-950">Tenant Operations</p>
                <p className="text-sm text-muted-foreground">Create companies, manage subscription status and review tenant capacity.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/audit-logs" className="block">
            <Card className="h-full hover:border-primary/50">
              <CardContent className="grid gap-2 pt-5">
                <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
                <p className="font-semibold text-slate-950">Audit Logs</p>
                <p className="text-sm text-muted-foreground">Review exports, record changes and cross-tenant activity from one protected screen.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </AdminShell>
  );
}
