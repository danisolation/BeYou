"use client";

import { useEffect, useState } from "react";
import { Bot, ShieldAlert, Users } from "lucide-react";

import { StitchCard } from "@/components/stitch-card";
import { ErrorState, LoadingState, PageHeader } from "@/components/ui-primitives";
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

  if (isLoading) {
    return (
      <section className="space-y-6">
        <PageHeader
          eyebrow="Vai trò giáo viên"
          title="Cổng giáo viên"
          description="Đang tải thông tin..."
        />
        <LoadingState message="Đang tải thông tin..." className="bg-white/80" />
      </section>
    );
  }

  if (loadFailed || dashboardData === null) {
    return <ErrorState />;
  }

  const studentCount = dashboardData.students.length;
  const sosCount = dashboardData.notifications?.length ?? 0;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Vai trò giáo viên"
        title="Cổng giáo viên"
        description="Xem học sinh được liên kết và thông tin SOS/tóm tắt được phép xem để phối hợp hỗ trợ."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StitchCard
          variant="circular"
          icon={<Users size={28} />}
          title="Học sinh liên kết"
          description={`${studentCount} học sinh được liên kết`}
          ctaLabel="Xem danh sách"
          ctaHref="/teacher/students"
        />

        <StitchCard
          variant="circular"
          icon={<ShieldAlert size={28} />}
          title="Cảnh báo SOS"
          description={sosCount > 0 ? `${sosCount} cảnh báo gần đây` : "Không có cảnh báo mới"}
          ctaLabel="Xem cảnh báo"
          ctaHref="/teacher/sos-alerts"
        />

        <StitchCard
          variant="circular"
          icon={<Bot size={28} />}
          title="Peerlight AI"
          description="Trò chuyện với AI để được hướng dẫn hỗ trợ học sinh"
          ctaLabel="Trò chuyện"
          ctaHref="/teacher/chat"
        />
      </div>
    </section>
  );
}
