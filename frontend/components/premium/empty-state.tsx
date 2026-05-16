import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({ title = "No records found", text = "New entries will appear here once added.", icon: Icon = Inbox }: { title?: string; text?: string; icon?: LucideIcon }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-3 font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
    </div>
  );
}
