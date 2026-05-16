"use client";

import { Building2, CreditCard, UsersRound } from "lucide-react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Companies", value: "Manage", icon: Building2 },
  { label: "Subscriptions", value: "Ready", icon: CreditCard },
  { label: "Users", value: "Controlled", icon: UsersRound }
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

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
      </section>
    </AdminShell>
  );
}
