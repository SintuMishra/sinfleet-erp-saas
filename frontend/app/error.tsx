"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-6 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-950">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">Please retry. If this continues, contact support with the current time and page.</p>
        <Button className="mt-5" onClick={reset}>
          Retry
        </Button>
      </section>
    </main>
  );
}
