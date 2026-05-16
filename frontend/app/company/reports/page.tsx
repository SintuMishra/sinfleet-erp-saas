"use client";

import { BarChart3, FileText, IdCard, Truck, UsersRound } from "lucide-react";
import Link from "next/link";
import { CompanyShell } from "@/components/company/company-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { companyLabels } from "@/lib/company-labels";

const labels = companyLabels.en;

const reports = [
  { title: labels.vehicleProfit, href: "/company/reports/vehicle-profit", icon: Truck, text: "Vehicle-wise income, diesel, expense, profit, and pending amount." },
  { title: labels.driverPerformance, href: "/company/reports/driver-performance", icon: UsersRound, text: "Driver-wise trips, delivered/cancelled count, freight, diesel, and expenses." },
  { title: labels.clientLedger, href: "/company/reports/client-ledger", icon: FileText, text: "Client-wise freight, received amount, outstanding, and trip breakdown." },
  { title: labels.documentExpiry, href: "/company/reports/document-expiry", icon: IdCard, text: "Vehicle documents and driver licenses expiring soon." },
  { title: labels.outstanding, href: "/company/reports/outstanding", icon: BarChart3, text: "Client-wise and trip-wise pending payments." }
];

export default function CompanyReportsPage() {
  return (
    <CompanyShell>
      <section className="grid gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{labels.companyPanel}</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{labels.reports}</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <Link key={report.href} href={report.href}>
              <Card className="h-full hover:border-primary/50">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <report.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <CardTitle>{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{report.text}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </CompanyShell>
  );
}
