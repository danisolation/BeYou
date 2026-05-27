"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, ShieldAlert, Users } from "lucide-react";

import { StitchCard } from "@/components/stitch-card";
import { ErrorState } from "@/components/ui-primitives";
import { DashboardSkeleton } from "@/components/skeletons";
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

  if (isLoading) return <DashboardSkeleton cards={2} />;
  if (loadFailed || dashboardData === null) return <ErrorState title="Không tải được" message="Vui lòng thử lại sau" />;

  const childCount = dashboardData.students.length;
  const sosCount = dashboardData.notifications.status === "ready" ? dashboardData.notifications.data.length : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-on-background sm:text-headline-lg">
          Xin chào, phụ huynh!
        </h1>
        <p className="mt-2 text-body-lg text-on-background/70">
          Cùng đồng hành với con hôm nay nhé
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <StitchCard
          variant="circular"
          icon={<Users size={28} />}
          title="Con của bạn"
          description={`${childCount} con đang được đồng hành`}
          ctaLabel="Xem thông tin"
          ctaHref="/parent/students"
        />

        <StitchCard
          variant="circular"
          icon={<ShieldAlert size={28} />}
          title="Cảnh báo SOS"
          description={sosCount > 0 ? `${sosCount} cảnh báo gần đây` : "Hiện không có cảnh báo mới"}
          ctaLabel="Xem cảnh báo"
          ctaHref="/parent/sos-alerts"
        />
      </div>

      <div className="rounded-[32px] bg-primary-container p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Bot className="text-on-primary-container" size={32} />
          <div className="flex-1">
            <h3 className="text-headline-md font-semibold text-on-primary-container">
              Peerlight AI
            </h3>
            <p className="text-body-md text-on-primary-container/80">
              Hỏi AI cách đồng hành cùng con hiệu quả hơn
            </p>
          </div>
          <Link
            href="/parent/chat"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[16px] bg-primary px-6 py-3 font-semibold text-on-primary no-underline hover:opacity-90 sm:w-auto"
          >
            Trò chuyện
          </Link>
        </div>
      </div>
    </div>
  );
}
