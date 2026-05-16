"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loginSuperAdmin } from "@/lib/admin-api";
import { adminLabels } from "@/lib/admin-labels";
import { setAuthTokens } from "@/lib/auth/auth-storage";

const labels = adminLabels.en;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = await loginSuperAdmin(email, password);

      if (session.user.role !== "SUPER_ADMIN") {
        setError("Only Super Admin users can access this panel.");
        return;
      }

      setAuthTokens(session.accessToken, session.refreshToken);
      router.push("/admin/companies");
    } catch {
      setError("Login failed. Check email and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="premium-shell flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-white/20 bg-white/95 shadow-2xl shadow-cyan-950/30">
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{labels.owner}</p>
          <CardTitle className="text-2xl">{labels.loginTitle}</CardTitle>
          <p className="text-sm text-slate-500">Secure SaaS control for company onboarding and subscription operations.</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium">
              Email
              <input
                className="h-11 rounded-xl border bg-white/90 px-3 text-base outline-none focus:ring-2 focus:ring-sky-200"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Password
              <input
                className="h-11 rounded-xl border bg-white/90 px-3 text-base outline-none focus:ring-2 focus:ring-sky-200"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            {error ? <p className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">{error}</p> : null}
            <Button className="h-11 text-base" disabled={loading}>
              {loading ? "Signing in" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
