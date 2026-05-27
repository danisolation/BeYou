"use client";

import { useEffect, useState } from "react";
import { Bot, ShieldAlert, Users } from "lucide-react";

import { StitchCard } from "@/components/stitch-card";
import { ErrorState, LoadingState, PageHeader } from "@/components/ui-primitives";
import { loadParentDashboard, type AdultDashboardData } from "@/lib/adult-dashboard-loader";

export default function ParentDashboardPage() {
  const [dashboardData, setDashboardData] = useState<AdultDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isActive = true;

    loadParentDashboard()
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
          eyebrow="Vai trò phụ huynh"
          title="Cổng phụ huynh"
          description="Đang tải thông tin..."
        />
        <LoadingState message="Đang tải thông tin..." className="bg-white/80" />
      </section>
    );
  }

  if (loadFailed || dashboardData === null) {
    return <ErrorState />;
  }

  const childCount = dashboardData.students.length;
  const sosCount = dashboardData.notifications?.length ?? 0;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Vai trò phụ huynh"
        title="Cổng phụ huynh"
        description="Xem thông tin hỗ trợ được phép hiển thị ở tư thế đồng hành."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StitchCard
          variant="circular"
          icon={<Users size={28} />}
          title="Con của bạn"
          description={`${childCount} học sinh được liên kết`}
          ctaLabel="Xem thông tin"
          ctaHref="/parent/students"
        />

        <StitchCard
          variant="circular"
          icon={<ShieldAlert size={28} />}
          title="Cảnh báo SOS"
          description={sosCount > 0 ? `${sosCount} cảnh báo gần đây` : "Không có cảnh báo mới"}
          ctaLabel="Xem cảnh báo"
          ctaHref="/parent/sos-alerts"
        />

        <StitchCard
          variant="circular"
          icon={<Bot size={28} />}
          title="Peerlight AI"
          description="Trò chuyện với AI để được hướng dẫn đồng hành cùng con"
          ctaLabel="Trò chuyện"
          ctaHref="/parent/chat"
        />
      </div>
    </section>
  );
}
