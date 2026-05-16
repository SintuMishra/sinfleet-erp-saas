import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({ label, value, icon: Icon, tone = "cyan", helper }: { label: string; value: string | number; icon?: LucideIcon; tone?: "cyan" | "blue" | "emerald" | "amber" | "rose"; helper?: string }) {
  const toneClass = {
    cyan: "from-cyan-500 to-sky-500",
    blue: "from-blue-500 to-indigo-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-red-500"
  }[tone];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="min-w-0 text-sm font-medium text-slate-500">{label}</CardTitle>
        {Icon ? (
          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${toneClass}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{value}</p>
        {helper ? <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
