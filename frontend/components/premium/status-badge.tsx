const toneMap: Record<string, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  IDLE: "border-sky-200 bg-sky-50 text-sky-700",
  ON_TRIP: "border-cyan-200 bg-cyan-50 text-cyan-700",
  MAINTENANCE: "border-amber-200 bg-amber-50 text-amber-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
  BOOKED: "border-sky-200 bg-sky-50 text-sky-700",
  IN_TRANSIT: "border-cyan-200 bg-cyan-50 text-cyan-700"
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneMap[value] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
      {simple(value)}
    </span>
  );
}

function simple(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
