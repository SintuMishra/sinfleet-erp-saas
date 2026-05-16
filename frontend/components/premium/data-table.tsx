import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DataTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur", className)}>{children}</div>;
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur md:grid-cols-3 xl:grid-cols-5">{children}</div>;
}

export function FormSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      {title ? <h3 className="font-semibold text-slate-950">{title}</h3> : null}
      {children}
    </section>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  children
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-gradient-to-r from-rose-600 to-red-500 shadow-rose-500/20 hover:shadow-rose-500/25"
                onClick={() => {
                  onConfirm();
                  setOpen(false);
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
