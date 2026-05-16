import type { LucideIcon } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300 shadow-xl shadow-slate-900/20">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? <p className="text-sm font-medium text-sky-700">{eyebrow}</p> : null}
          <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
