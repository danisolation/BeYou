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

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  })();

  if (loading) return <DashboardSkeleton cards={4} />;
  if (error) return <ErrorState title="Không tải được" message="Vui lòng thử lại sau" />;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold text-on-background sm:text-2xl">
          {greeting}, {name}! 👋
        </h1>
        <p className="mt-1 text-sm text-on-background/60">
          Hôm nay em muốn làm gì?
        </p>
      </div>

      {/* Peerlight AI Quick Access */}
      <div className="animate-fade-in rounded-2xl bg-primary/5 p-4 border border-primary/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="text-primary" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-on-background">Peerlight AI</h3>
            <p className="text-xs text-on-background/60">Trò chuyện cùng AI hỗ trợ 24/7</p>
          </div>
          <Link
            href="/student/chat"
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary no-underline hover:opacity-90"
          >
            Chat
          </Link>
        </div>
      </div>

      {/* 4 Feature Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StitchCard
          variant="circular"
          icon={<Brain size={22} />}
          title="Test tâm lý"
          description="Kiểm tra sức khỏe tâm lý qua các bài test ngắn"
          ctaLabel="Vào test"
          ctaHref="/student/self-checks"
          className="animate-fade-in-up delay-100"
        />
        <StitchCard
          variant="circular"
          icon={<Heart size={22} />}
          title="Check-in cảm xúc"
          description="Ghi nhận cảm xúc mỗi ngày, theo dõi xu hướng tâm trạng"
          ctaLabel="Vào check-in"
          ctaHref="/student/mood-check-ins"
          className="animate-fade-in-up delay-200"
        />
        <StitchCard
          variant="circular"
          icon={<MessageCircle size={22} />}
          title="Tình huống xử lý"
          description="Luyện tập xử lý các tình huống thực tế ở trường"
          ctaLabel="Vào thực hành"
          ctaHref="/student/scenarios"
          className="animate-fade-in-up delay-300"
        />
        <StitchCard
          variant="circular"
          icon={<Settings size={22} />}
          title="Cài đặt"
          description="Tùy chỉnh thông báo, quyền riêng tư và cài đặt SOS"
          ctaLabel="Vào thiết lập"
          ctaHref="/student/notification-preferences"
          className="animate-fade-in-up delay-400"
        />
      </div>
    </div>
  );
}
