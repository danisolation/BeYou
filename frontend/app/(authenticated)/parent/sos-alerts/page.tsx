"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldAlert, AlertTriangle, Clock, UserCheck, CheckCircle } from "lucide-react";

import { ErrorState } from "@/components/ui-primitives";
import { DashboardSkeleton } from "@/components/skeletons";
import { listParentSosAlerts, SosAlert, sosStatusLabels } from "@/lib/sos-api";

export default function ParentSosAlertsPage() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    listParentSosAlerts()
      .then(setAlerts)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton cards={3} />;
  if (error) return <ErrorState title="Không tải được" message="Vui lòng thử lại sau" />;

  // Helper to map status to beautiful styles
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <AlertTriangle size={20} className="text-red-600 animate-pulse" />;
      case "received":
        return <Clock size={20} className="text-blue-500" />;
      case "supporting":
        return <UserCheck size={20} className="text-amber-500" />;
      case "completed":
        return <CheckCircle size={20} className="text-emerald-500" />;
      default:
        return <ShieldAlert size={20} className="text-error" />;
    }
  };

  const getStatusBgClass = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40";
      case "received":
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40";
      case "supporting":
        return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40";
      case "completed":
        return "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40";
      default:
        return "bg-error/10 border-outline-variant/30";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-on-background sm:text-2xl">
          Cảnh báo SOS
        </h1>
        <p className="mt-2 text-base text-on-background/70">
          {alerts.length > 0 ? `${alerts.length} cảnh báo gần đây` : "Hiện không có cảnh báo mới"}
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 text-on-background/30" size={48} />
          <p className="text-on-background/70">Không có cảnh báo SOS nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const bgClass = getStatusBgClass(alert.current_status);
            return (
              <Link
                key={alert.id}
                href={`/parent/sos-alerts/${alert.id}`}
                className={`flex items-center gap-4 rounded-[24px] border bg-white dark:bg-[#1a2244] p-5 no-underline transition-all hover:-translate-y-0.5 hover:shadow-md ${bgClass}`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#0f1530] shadow-sm">
                  {getStatusIcon(alert.current_status)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-on-background">{alert.student.full_name}</p>
                    {alert.student.class_name && (
                      <span className="text-[10px] bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#a084ff] px-2 py-0.5 rounded-full font-bold">
                        {alert.student.class_name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-background/60">
                    {new Date(alert.created_at).toLocaleDateString("vi-VN")} · {new Date(alert.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · {sosStatusLabels[alert.current_status] ?? alert.current_status}
                  </p>
                  {alert.note && (
                    <p className="mt-1.5 text-xs text-on-background/75 line-clamp-1 italic">
                      &quot;{alert.note}&quot;
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
