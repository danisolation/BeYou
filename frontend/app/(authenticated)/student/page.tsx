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
    <div className="space-y-5">
      {/* Welcome hero */}
      <div className="hero-gradient soft-card animate-fade-in relative overflow-hidden rounded-[20px] p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl font-bold text-[#17204c] sm:text-3xl">
            {greeting}, {name}! 👋
          </h1>
          <p className="mt-2 text-sm text-[#33416b] sm:text-base">
            Bạn không đơn độc đâu! Peerlight AI luôn ở đây để lắng nghe, đồng hành và giúp bạn tỏa sáng.
          </p>
          <Link
            href="/student/chat"
            className="btn-press cta-gradient mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold no-underline"
          >
            Trò chuyện cùng AI 💬
          </Link>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/30 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 right-10 h-44 w-44 rounded-full bg-accent-violet/30 blur-2xl"
        />
      </div>

      {/* Peerlight AI Quick Access */}
      <div className="animate-fade-in card-lift rounded-2xl border border-primary/10 bg-primary/5 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="text-primary" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-on-background">Peerlight AI</h3>
            <p className="text-xs text-on-background/60">Trò chuyện cùng AI hỗ trợ 24/7</p>
          </div>
          <Link
            href="/student/chat"
            className="btn-press inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary no-underline hover:opacity-90 sm:w-auto"
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
          title="Khám phá cảm xúc"
          description="Làm bài ngắn để hiểu cảm xúc của mình hơn"
          ctaLabel="Bắt đầu"
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
