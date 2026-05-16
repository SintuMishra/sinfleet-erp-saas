"use client";

import {
  BarChart3,
  CircleDollarSign,
  ChevronRight,
  Fuel,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ReceiptText,
  Truck,
  UsersRound,
  Warehouse,
  Handshake,
  Route
} from "lucide-react";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth/auth-gate";
import { Button } from "@/components/ui/button";
import { clearAuthTokens } from "@/lib/auth/auth-storage";
import { companyLabels } from "@/lib/company-labels";

const labels = companyLabels.en;

const navItems = [
  { href: "/company/dashboard", label: labels.dashboard, icon: LayoutDashboard },
  { href: "/company/vehicles", label: labels.vehicles, icon: Truck },
  { href: "/company/drivers", label: labels.drivers, icon: UsersRound },
  { href: "/company/trips", label: labels.trips, icon: Route },
  { href: "/company/diesel", label: labels.diesel, icon: Fuel },
  { href: "/company/expenses", label: labels.expenses, icon: ReceiptText },
  { href: "/company/payments", label: labels.payments, icon: CircleDollarSign },
  { href: "/company/reports", label: labels.reports, icon: BarChart3 },
  { href: "/company/clients", label: labels.clients, icon: Handshake }
];

export function CompanyShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  function handleLogout() {
    clearAuthTokens();
    router.push("/company/login");
  }

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <AuthGate allowedRoles={["COMPANY_ADMIN", "USER"]} loginPath="/company/login">
      <div className="premium-shell">
        <div className="mx-auto grid min-h-screen w-full max-w-[1500px] lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden max-h-screen overflow-y-auto border-r border-white/10 bg-slate-950/78 px-4 py-5 backdrop-blur-xl lg:sticky lg:top-0 lg:block">
          <CompanyNav pathname={pathname} />
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-full w-[min(88vw,330px)] min-w-0 flex-col overflow-y-auto border-r border-white/10 bg-slate-950 px-4 py-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <CompanyBrand />
                <Button variant="ghost" size="icon" aria-label="Close menu" className="text-white hover:bg-white/10" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
              <CompanyNav pathname={pathname} showBrand={false} />
            </aside>
          </div>
        ) : null}

        <div className="min-w-0 overflow-x-hidden bg-slate-100/80">
          <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">Smart Transport Management Platform</p>
                <p className="hidden text-xs text-slate-500 sm:block">Built for fleet owners, transport contractors and logistics operators</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 sm:inline-flex">English / Hindi Ready</span>
                <Button variant="secondary" size="icon" aria-label="Open menu" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Logout" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </header>
          <main className="min-w-0 px-3 py-5 sm:px-5 sm:py-6 lg:px-6 xl:px-8">{children}</main>
        </div>
        </div>
      </div>
    </AuthGate>
  );
}

function CompanyBrand() {
  return (
    <Link href="/company/dashboard" className="flex min-w-0 items-center gap-3 rounded-2xl px-2 py-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/20">
        <Warehouse className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-semibold leading-5 text-white">{labels.product}</p>
        <p className="text-xs text-cyan-100/70">Smart Transport Management</p>
      </div>
    </Link>
  );
}

function CompanyNav({ pathname, showBrand = true }: { pathname: string; showBrand?: boolean }) {
  return (
    <>
      {showBrand ? <CompanyBrand /> : null}
      <nav className="mt-6 grid min-w-0 gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href === "/company/reports" && pathname.startsWith("/company/reports"));
          return (
            <Link key={item.href} href={item.href} className={`premium-nav-link group ${active ? "is-active" : ""}`}>
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {active ? <ChevronRight className="h-4 w-4 text-cyan-200" aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
