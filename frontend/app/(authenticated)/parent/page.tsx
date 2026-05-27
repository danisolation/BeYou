"use client";

import { useEffect, useState } from "react";

import { AdultStudentList } from "@/components/adult-student-list";
import { ErrorState, LoadingState, PageHeader, PrivacyBoundaryCard, SurfaceCard } from "@/components/ui-primitives";
import { loadParentDashboard, type AdultDashboardData } from "@/lib/adult-dashboard-loader";

export default function ParentDashboardPage() {
  const [dashboardData, setDashboardData] = useState<AdultDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isActive = true;

    loadParentDashboard()
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
    return <AdultDashboardSkeleton roleContext="parent" />;
  }

  if (loadFailed || dashboardData === null) {
    return <ErrorState />;
  }

  return (
    <AdultStudentList
      roleContext="parent"
      title="Cổng phụ huynh"
      subtitle="Xem học sinh được liên kết và thông tin hỗ trợ được phép hiển thị ở tư thế đồng hành/read-only."
      summaryTitle="Tóm tắt hỗ trợ của con"
      summaryBasePath="/parent/students"
      summaryCta="Xem tóm tắt hỗ trợ"
      sosBasePath="/parent/sos-alerts"
      sosCta="Xem trạng thái SOS"
      supportOverviewState={dashboardData.supportOverview}
      notificationsState={dashboardData.notifications}
      students={dashboardData.students}
      emptyBody="Khi quản trị viên tạo liên kết, thông tin hỗ trợ được phép xem sẽ hiển thị tại đây."
    />
  );
}

function AdultDashboardSkeleton({ roleContext }: { roleContext: "parent" }) {
  const roleLabel = roleContext === "parent" ? "phụ huynh" : "người lớn";
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Vai trò phụ huynh"
        title="Cổng phụ huynh"
        description={`Peerlight AI đang tải phạm vi học sinh được liên kết và tóm tắt hỗ trợ được phép xem cho ${roleLabel}.`}
      />
      <LoadingState message="Đang tải thông tin... Đang tải tóm tắt hỗ trợ..." className="bg-white/80" />
      <PrivacyBoundaryCard
        title="Ranh giới hỗ trợ của phụ huynh"
        description="Thông tin chỉ mở trong phạm vi đồng hành/read-only và tín hiệu SOS/tóm tắt được phép xem."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SurfaceCard className="min-h-36 animate-pulse bg-white/80" />
        <SurfaceCard className="min-h-36 animate-pulse bg-white/80" />
      </div>
    </section>
  );
}
