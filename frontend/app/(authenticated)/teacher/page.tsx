"use client";

import { useEffect, useState } from "react";

import { AdultStudentList } from "@/components/adult-student-list";
import { ErrorState, LoadingState, PageHeader, PrivacyBoundaryCard, SurfaceCard } from "@/components/ui-primitives";
import { loadTeacherDashboard, type AdultDashboardData } from "@/lib/adult-dashboard-loader";

export default function TeacherDashboardPage() {
  const [dashboardData, setDashboardData] = useState<AdultDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isActive = true;

    loadTeacherDashboard()
      .then((data) => {
        if (!isActive) {
          return;
        }
        setDashboardData(data);
        setLoadFailed(false);
      })
      .catch(() => {
        if (isActive) {
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) {
    return <AdultDashboardSkeleton roleContext="teacher" />;
  }

  if (loadFailed || dashboardData === null) {
    return <ErrorState />;
  }

  return (
    <AdultStudentList
      roleContext="teacher"
      title="Cổng giáo viên"
      subtitle="Xem học sinh được liên kết và thông tin SOS/tóm tắt được phép xem để phối hợp hỗ trợ, không giám sát."
      summaryTitle="Tóm tắt tự kiểm tra được phép xem"
      summaryBasePath="/teacher/students"
      summaryCta="Xem tóm tắt hỗ trợ"
      sosBasePath="/teacher/sos-alerts"
      sosCta="Xem và cập nhật SOS"
      supportOverviewState={dashboardData.supportOverview}
      notificationsState={dashboardData.notifications}
      students={dashboardData.students}
      emptyBody="Khi quản trị viên tạo liên kết, học sinh được phép hỗ trợ sẽ hiển thị tại đây."
    />
  );
}

function AdultDashboardSkeleton({ roleContext }: { roleContext: "teacher" }) {
  const roleLabel = roleContext === "teacher" ? "giáo viên" : "người lớn";
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Vai trò giáo viên"
        title="Cổng giáo viên"
        description={`Peerlight AI đang tải phạm vi học sinh được liên kết và tóm tắt hỗ trợ được phép xem cho ${roleLabel}.`}
      />
      <LoadingState message="Đang tải thông tin... Đang tải tóm tắt hỗ trợ..." className="bg-white/80" />
      <PrivacyBoundaryCard
        title="Ranh giới hỗ trợ của giáo viên"
        description="Thông tin chỉ mở trong phạm vi học sinh được liên kết và tín hiệu SOS/tóm tắt được phép xem."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SurfaceCard className="min-h-36 animate-pulse bg-white/80" />
        <SurfaceCard className="min-h-36 animate-pulse bg-white/80" />
      </div>
    </section>
  );
}
