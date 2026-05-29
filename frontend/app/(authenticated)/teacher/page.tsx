"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, ShieldAlert, Users } from "lucide-react";

import { StitchCard } from "@/components/stitch-card";
import { ErrorState } from "@/components/ui-primitives";
import { DashboardSkeleton } from "@/components/skeletons";
import { loadTeacherDashboard, type AdultDashboardData } from "@/lib/adult-dashboard-loader";

export default function TeacherDashboardPage() {
  const [dashboardData, setDashboardData] = useState<AdultDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  function load() {
    setIsLoading(true);
    setLoadFailed(false);
    loadTeacherDashboard()
      .then((data) => {
        setDashboardData(data);
        setLoadFailed(false);
        setLastUpdated(new Date());
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (isLoading) return <DashboardSkeleton cards={2} />;
  if (loadFailed || dashboardData === null) return <ErrorState title="Không tải được" message="Vui lòng thử lại sau" onRetry={load} />;

  const studentCount = dashboardData.students.length;
  const sosCount = dashboardData.notifications.status === "ready" ? dashboardData.notifications.data.length : 0;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-background sm:text-2xl">
            Xin chào, thầy/cô! 👋
          </h1>
          <p className="mt-1 text-sm text-on-background/60">
            Hôm nay có gì cần hỗ trợ?
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button type="button" onClick={load} aria-label="Làm mới dữ liệu" className="rounded-xl p-2 text-on-background/50 hover:bg-outline-variant/15 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          </button>
          {lastUpdated && (
            <span className="text-[10px] text-on-background/40">
              Cập nhật lúc {lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      <div className="animate-fade-in card-lift rounded-2xl border border-primary/10 bg-primary/5 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="text-primary" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-on-background">Peerlight AI</h3>
            <p className="text-xs text-on-background/60">Hỏi AI cách hỗ trợ học sinh hiệu quả hơn</p>
          </div>
          <Link
            href="/teacher/chat"
            className="btn-press inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary no-underline hover:opacity-90 sm:w-auto"
          >
            Chat
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StitchCard
          variant="circular"
          icon={<Users size={22} />}
          title="Học sinh liên kết"
          description={`${studentCount} học sinh đang được đồng hành`}
          ctaLabel="Xem danh sách"
          ctaHref="/teacher/students"
          className="animate-fade-in-up delay-100"
        />

        <StitchCard
          variant="circular"
          icon={<ShieldAlert size={22} />}
          title="Cảnh báo SOS"
          description={sosCount > 0 ? `${sosCount} cảnh báo gần đây` : "Hiện không có cảnh báo mới"}
          ctaLabel="Xem cảnh báo"
          ctaHref="/teacher/sos-alerts"
          className="animate-fade-in-up delay-200"
        />
      </div>
    </div>
  );
}
