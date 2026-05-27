"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brain, Heart, MessageCircle, Settings, Bot } from "lucide-react";
import { StitchCard } from "@/components/stitch-card";
import { ErrorState } from "@/components/ui-primitives";
import { DashboardSkeleton } from "@/components/skeletons";
import { apiFetch } from "@/lib/api";

interface ProfileData {
  full_name?: string;
}

export default function StudentDashboardPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<ProfileData>("/api/student/profile")
      .then((data) => {
        setName(data.full_name || "bạn");
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) return <DashboardSkeleton cards={4} />;
  if (error) return <ErrorState title="Không tải được" message="Vui lòng thử lại sau" />;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold text-on-background sm:text-headline-lg">
          Chào {name}!
        </h1>
        <p className="mt-2 text-body-lg text-on-background/70">
          Hôm nay em muốn làm gì?
        </p>
      </div>

      {/* 4 Feature Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <StitchCard
          variant="circular"
          icon={<Brain size={28} />}
          title="Test tâm lý"
          description="Kiểm tra sức khỏe tâm lý qua các bài test ngắn"
          ctaLabel="Vào test"
          ctaHref="/student/self-checks"
          className="animate-fade-in-up delay-100"
        />
        <StitchCard
          variant="circular"
          icon={<Heart size={28} />}
          title="Check-in cảm xúc"
          description="Ghi nhận cảm xúc mỗi ngày, theo dõi xu hướng tâm trạng"
          ctaLabel="Vào check-in"
          ctaHref="/student/mood-check-ins"
          className="animate-fade-in-up delay-200"
        />
        <StitchCard
          variant="circular"
          icon={<MessageCircle size={28} />}
          title="Tình huống xử lý"
          description="Luyện tập xử lý các tình huống thực tế ở trường"
          ctaLabel="Vào thực hành"
          ctaHref="/student/scenarios"
          className="animate-fade-in-up delay-300"
        />
        <StitchCard
          variant="circular"
          icon={<Settings size={28} />}
          title="Cài đặt"
          description="Tùy chỉnh thông báo, quyền riêng tư và cài đặt SOS"
          ctaLabel="Vào thiết lập"
          ctaHref="/student/notification-preferences"
          className="animate-fade-in-up delay-400"
        />
      </div>

      {/* Peerlight AI Quick Access */}
      <div className="animate-fade-in delay-300 rounded-[32px] bg-primary-container p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Bot className="text-on-primary-container" size={32} />
          <div className="flex-1">
            <h3 className="text-headline-md font-semibold text-on-primary-container">
              Peerlight AI
            </h3>
            <p className="text-body-md text-on-primary-container/80">
              Trò chuyện cùng AI hỗ trợ 24/7
            </p>
          </div>
          <Link
            href="/student/chat"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[16px] bg-primary px-6 py-3 font-semibold text-on-primary no-underline hover:opacity-90 sm:w-auto"
          >
            Trò chuyện
          </Link>
        </div>
      </div>
    </div>
  );
}
