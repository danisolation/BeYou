"use client";

import Link from "next/link";
import { ShieldAlert, AlertTriangle, Clock, UserCheck, CheckCircle, RefreshCw, Radio } from "lucide-react";

import { ErrorState } from "@/components/ui-primitives";
import { DashboardSkeleton } from "@/components/skeletons";
import { useSosAlertPolling } from "@/hooks/use-sos-alert-polling";
import { listParentSosAlerts, sosStatusLabels } from "@/lib/sos-api";

export default function ParentSosAlertsPage() {
  const { alerts, loading, error, lastUpdated, refresh } = useSosAlertPolling(listParentSosAlerts, "SOS của con");

  if (loading) return <DashboardSkeleton cards={3} />;
  if (error) return <ErrorState title="Không tải được" message="Vui lòng thử lại sau" />;
  const pendingCount = alerts.filter((alert) => alert.current_status === "sent").length;
  const latestPending = alerts.find((alert) => alert.current_status === "sent");

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-on-background sm:text-2xl">
            Cảnh báo SOS
            {pendingCount > 0 ? (
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-bold text-white shadow-md shadow-red-600/25">
                {pendingCount}
              </span>
            ) : null}
          </h1>
          <p className="mt-2 text-base text-on-background/70">
            {alerts.length > 0 ? `${alerts.length} cảnh báo gần đây` : "Hiện không có cảnh báo mới"}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-on-background/45">
            <Radio size={13} className="text-emerald-600" aria-hidden="true" />
            Cập nhật gần realtime mỗi 8 giây{lastUpdated ? ` · ${lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh(false)}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant/30 bg-white px-3 text-xs font-bold text-on-background/70 hover:border-primary hover:text-primary dark:bg-[#1a2244]"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Làm mới
        </button>
      </div>

      {latestPending ? (
        <Link href={`/parent/sos-alerts/${latestPending.id}`} role="alert" className="block rounded-[22px] border-2 border-red-300 bg-red-50 p-5 no-underline shadow-lg shadow-red-500/10 dark:border-red-900/60 dark:bg-red-950/30">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white">
              <ShieldAlert size={24} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold uppercase tracking-wide text-red-700 dark:text-red-300">SOS của con chờ chú ý</p>
              <h2 className="truncate text-lg font-bold text-red-950 dark:text-red-100">{latestPending.student.full_name}</h2>
              <p className="text-sm text-red-900/70 dark:text-red-100/70">Bấm để xem trạng thái hỗ trợ và bước tiếp theo.</p>
            </div>
          </div>
        </Link>
      ) : null}

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
                className={`flex items-center gap-4 rounded-[24px] border bg-white p-5 no-underline transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-[#1a2244] ${bgClass} ${
                  alert.current_status === "sent" ? "ring-2 ring-red-300 shadow-lg shadow-red-500/10 dark:ring-red-800/50" : ""
                }`}
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
