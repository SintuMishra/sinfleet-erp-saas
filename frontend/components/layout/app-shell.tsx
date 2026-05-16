import { BarChart3, Building2, CircleDollarSign, Fuel, Menu, Route, Truck, UserRoundCog } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", icon: BarChart3 },
  { label: "Vehicles", icon: Truck },
  { label: "Drivers", icon: UserRoundCog },
  { label: "Trips", icon: Route },
  { label: "Diesel", icon: Fuel },
  { label: "Payments", icon: CircleDollarSign }
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="premium-shell">
      <div className="mx-auto grid min-h-screen w-full max-w-[1500px] lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden max-h-screen overflow-y-auto border-r border-white/10 bg-slate-950/72 px-4 py-5 backdrop-blur-xl lg:sticky lg:top-0 lg:block">
          <div className="flex min-w-0 items-center gap-3 rounded-2xl px-2 py-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-300 text-slate-950">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-5 text-white">SinFleet ERP</p>
              <p className="text-xs text-cyan-100/70">Fleet SaaS</p>
            </div>
          </div>
          <nav className="mt-6 grid min-w-0 gap-1">
            {navItems.map((item) => (
              <span key={item.label} className="premium-nav-link">
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span className="min-w-0 truncate">{item.label}</span>
              </span>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 overflow-x-hidden bg-slate-100/80">
          <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">Smart Transport Management Platform</p>
                <p className="hidden text-xs text-slate-500 sm:block">Built for fleet owners, transport contractors and logistics operators</p>
              </div>
              <Button variant="secondary" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </header>
          <main className="min-w-0 px-3 py-5 sm:px-5 sm:py-6 lg:px-6 xl:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
