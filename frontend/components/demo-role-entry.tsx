"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { login, loginErrorCopy } from "@/lib/auth";
import { demoAccounts, DEMO_PASSWORD, type DemoRole } from "@/lib/demo-accounts";

type DemoRoleEntryProps = {
  compact?: boolean;
};

export function DemoRoleEntry({ compact = false }: DemoRoleEntryProps) {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<DemoRole | null>(null);
  const [error, setError] = useState("");

  async function enterDemo(role: DemoRole) {
    const account = demoAccounts.find((item) => item.role === role);
    if (!account || loadingRole) {
      return;
    }
    setLoadingRole(role);
    setError("");
    try {
      const user = await login(account.email, DEMO_PASSWORD);
      if (user.role === "student" && user.privacy_acknowledgement_required) {
        router.push(`/privacy?next=${encodeURIComponent(user.dashboard_route)}`);
        return;
      }
      router.push(user.dashboard_route);
    } catch (loginError) {
      setError(loginErrorCopy(loginError));
    } finally {
      setLoadingRole(null);
    }
  }

  return (
    <div className="space-y-3" aria-busy={loadingRole !== null}>
      <div className={compact ? "grid gap-2 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2"}>
        {demoAccounts.map((account) => (
          <button
            key={account.role}
            type="button"
            onClick={() => enterDemo(account.role)}
            disabled={loadingRole !== null}
            className="min-h-14 rounded-2xl border border-outline-variant/30 bg-white p-4 text-left shadow-sm hover:-translate-y-0.5 hover:border-primary hover:shadow-md disabled:opacity-60"
          >
            <span className="block font-semibold text-on-background">
              {loadingRole === account.role ? "Đang vào..." : `Vào vai ${account.label}`}
            </span>
            {!compact ? <span className="mt-1 block text-xs text-primary/70">{account.summary}</span> : null}
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="rounded-2xl border border-warning/30 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
