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

export default function TeacherSosAlertsPage() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<SosAlert[]>("/api/teacher/sos-alerts")
      .then(setAlerts)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton cards={3} />;
  if (error) return <ErrorState title="Không tải được" message="Vui lòng thử lại sau" />;

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
        <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-8 text-center dark:bg-[var(--surface)]">
          <ShieldAlert className="mx-auto mb-4 text-on-background/30" size={48} />
          <p className="text-on-background/70">Không có cảnh báo SOS nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Link
              key={alert.id}
              href={`/teacher/sos-alerts/${alert.id}`}
              className="flex items-center gap-4 rounded-[24px] border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5 no-underline transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-[var(--surface)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
                <ShieldAlert size={20} className="text-error" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-on-background">{alert.student_name}</p>
                <p className="text-sm text-on-background/60">
                  {new Date(alert.created_at).toLocaleDateString("vi-VN")} · {alert.status}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
