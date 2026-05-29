"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

import { ErrorState } from "@/components/ui-primitives";
import { DashboardSkeleton } from "@/components/skeletons";
import { apiFetch } from "@/lib/api";

interface SosAlert {
  id: string;
  student_name: string;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ["all", "pending", "acknowledged", "resolved"] as const;
const STATUS_LABELS: Record<string, string> = {
  all: "Tất cả",
  pending: "Chờ xử lý",
  acknowledged: "Đã nhận",
  resolved: "Đã xử lý",
};

export default function TeacherSosAlertsPage() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    apiFetch<SosAlert[]>("/api/teacher/sos-alerts")
      .then(setAlerts)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton cards={3} />;
  if (error) return <ErrorState title="Không tải được" message="Vui lòng thử lại sau" />;

  const filtered = statusFilter === "all" ? alerts : alerts.filter((a) => a.status === statusFilter);
  const pendingCount = alerts.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-on-background sm:text-2xl">
          Cảnh báo SOS
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
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
              {s === "pending" && pendingCount > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 text-on-background/30" size={48} />
          <p className="text-on-background/70">{statusFilter === "all" ? "Không có cảnh báo SOS nào" : `Không có cảnh báo "${STATUS_LABELS[statusFilter]}"`}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((alert) => (
            <Link
              key={alert.id}
              href={`/teacher/sos-alerts/${alert.id}`}
              className={`flex items-center gap-4 rounded-[24px] border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5 no-underline transition-all hover:-translate-y-0.5 hover:shadow-md ${
                alert.status === "pending" ? "ring-2 ring-red-200 dark:ring-red-800/40" : ""
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${alert.status === "pending" ? "bg-red-100 dark:bg-red-900/30" : "bg-outline-variant/10"}`}>
                <ShieldAlert size={20} className={alert.status === "pending" ? "text-red-600" : "text-on-background/50"} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-on-background">{alert.student_name}</p>
                <p className="text-sm text-on-background/60">
                  {new Date(alert.created_at).toLocaleDateString("vi-VN")} · {STATUS_LABELS[alert.status] ?? alert.status}
                </p>
              </div>
              {alert.status === "pending" && (
                <span className="h-3 w-3 rounded-full bg-red-500" aria-label="Chưa xử lý" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
