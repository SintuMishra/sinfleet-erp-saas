"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser, type CurrentUser } from "@/lib/auth/auth-api";
import { clearAuthTokens, getAccessToken } from "@/lib/auth/auth-storage";

export function AuthGate({
  allowedRoles,
  loginPath,
  children
}: {
  allowedRoles: CurrentUser["role"][];
  loginPath: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hasToken = Boolean(getAccessToken());

  const currentUserQuery = useQuery({
    queryKey: ["current-user", pathname],
    queryFn: fetchCurrentUser,
    enabled: hasToken,
    retry: false
  });

  React.useEffect(() => {
    if (!hasToken) {
      router.replace(loginPath);
      return;
    }

    if (currentUserQuery.isError) {
      clearAuthTokens();
      router.replace(loginPath);
      return;
    }

    if (currentUserQuery.data && !allowedRoles.includes(currentUserQuery.data.role)) {
      clearAuthTokens();
      router.replace(loginPath);
    }
  }, [allowedRoles, currentUserQuery.data, currentUserQuery.isError, hasToken, loginPath, router]);

  if (!hasToken || currentUserQuery.isLoading || !currentUserQuery.data || !allowedRoles.includes(currentUserQuery.data.role)) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 px-4 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 text-sm font-medium text-slate-600 shadow-sm">
          Checking secure session...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
