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

  useEffect(() => {
    let isActive = true;

    loadTeacherDashboard()
      .then((data) => {
        if (!isActive) return;
        setDashboardData(data);
        setLoadFailed(false);
      })
      .catch(() => {
        if (isActive) setLoadFailed(true);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => { isActive = false; };
  }, []);

  if (isLoading) return <DashboardSkeleton cards={2} />;
  if (loadFailed || dashboardData === null) return <ErrorState title="Không tải được" message="Vui lòng thử lại sau" />;

  const studentCount = dashboardData.students.length;
  const sosCount = dashboardData.notifications.status === "ready" ? dashboardData.notifications.data.length : 0;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold text-on-background sm:text-2xl">
          Xin chào, thầy/cô! 👋
        </h1>
        <p className="mt-1 text-sm text-on-background/60">
          Hôm nay có gì cần hỗ trợ?
        </p>
      </div>

      <div className="animate-fade-in rounded-2xl bg-primary/5 p-4 border border-primary/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="text-primary" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-on-background">Peerlight AI</h3>
            <p className="text-xs text-on-background/60">Hỏi AI cách hỗ trợ học sinh hiệu quả hơn</p>
          </div>
          <Link
            href="/teacher/chat"
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary no-underline hover:opacity-90"
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
