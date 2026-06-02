"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, UserCheck } from "lucide-react";

import { ErrorState } from "@/components/ui-primitives";
import { DashboardSkeleton } from "@/components/skeletons";
import { listTeacherSosAlerts, SosAlert, sosStatusLabels } from "@/lib/sos-api";

const STATUS_OPTIONS = ["all", "sent", "received", "supporting", "completed"] as const;
const STATUS_LABELS: Record<string, string> = {
  all: "Tất cả",
  sent: "Chờ xử lý (Mới gửi)",
  received: "Đã nhận",
  supporting: "Đang hỗ trợ",
  completed: "Đã hoàn tất",
};

export default function TeacherSosAlertsPage() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    listTeacherSosAlerts()
      .then(setAlerts)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton cards={3} />;
  if (error) return <ErrorState title="Không tải được" message="Vui lòng thử lại sau" />;

  const filtered = statusFilter === "all" ? alerts : alerts.filter((a) => a.current_status === statusFilter);
  const pendingCount = alerts.filter((a) => a.current_status === "sent").length;

  // Helper to map status to beautiful styles
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "sent":
        return {
          icon: AlertTriangle,
          iconClass: "text-red-600 animate-pulse",
          bgClass: "bg-red-50 dark:bg-red-950/20",
          borderClass: "border-red-200 dark:border-red-900/40 focus:ring-red-500",
        };
      case "received":
        return {
          icon: Clock,
          iconClass: "text-blue-500",
          bgClass: "bg-blue-50 dark:bg-blue-950/20",
          borderClass: "border-blue-200 dark:border-blue-900/40 focus:ring-blue-500",
        };
      case "supporting":
        return {
          icon: UserCheck,
          iconClass: "text-amber-500",
          bgClass: "bg-amber-50 dark:bg-amber-950/20",
          borderClass: "border-amber-200 dark:border-amber-900/40 focus:ring-amber-500",
        };
      case "completed":
        return {
          icon: CheckCircle,
          iconClass: "text-emerald-500",
          bgClass: "bg-emerald-50 dark:bg-emerald-950/20",
          borderClass: "border-emerald-200 dark:border-emerald-900/40 focus:ring-emerald-500",
        };
      default:
        return {
          icon: ShieldAlert,
          iconClass: "text-on-background/50",
          bgClass: "bg-outline-variant/10",
          borderClass: "border-outline-variant/30 focus:ring-primary",
        };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-on-background sm:text-2xl flex items-center gap-2">
          Cảnh báo SOS
          {pendingCount > 0 && (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {pendingCount}
            </span>
          )}
        </h1>
        <p className="mt-2 text-base text-on-background/70">
          {alerts.length > 0 ? `${alerts.length} cảnh báo gần đây` : "Hiện không có cảnh báo mới"}
        </p>
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-primary text-on-primary" : "bg-outline-variant/10 text-on-background/70 hover:bg-outline-variant/20"
              }`}
            >
              {STATUS_LABELS[s]}
              {s === "sent" && pendingCount > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 text-on-background/30" size={48} />
          <p className="text-on-background/70">
            {statusFilter === "all" ? "Không có cảnh báo SOS nào" : `Không có cảnh báo "${STATUS_LABELS[statusFilter]}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((alert) => {
            const styles = getStatusStyle(alert.current_status);
            const Icon = styles.icon;
            
            return (
              <Link
                key={alert.id}
                href={`/teacher/sos-alerts/${alert.id}`}
                className={`flex items-center gap-4 rounded-[24px] border bg-white dark:bg-[#1a2244] p-5 no-underline transition-all hover:-translate-y-0.5 hover:shadow-md ${styles.borderClass} ${
                  alert.current_status === "sent" ? "ring-2 ring-red-200 dark:ring-red-800/40" : ""
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${styles.bgClass}`}>
                  <Icon size={20} className={styles.iconClass} />
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
                {alert.current_status === "sent" && (
                  <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" aria-label="Mới gửi" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
