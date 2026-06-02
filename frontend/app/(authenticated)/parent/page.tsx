"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, ShieldAlert, Users, ArrowRight } from "lucide-react";

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
    <div className="space-y-5">
      {/* Hero */}
      <section className="hero-gradient soft-card animate-fade-in relative overflow-hidden rounded-[20px] p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl flex-1">
            <h1 className="text-2xl font-bold text-[#17204c] sm:text-3xl">Xin chào, phụ huynh! 👋</h1>
            <p className="mt-2 text-sm text-[#33416b] sm:text-base">
              Cùng đồng hành với con trong phạm vi quyền riêng tư — chỉ khi con đã gửi tín hiệu SOS bạn mới thấy tóm tắt hỗ trợ.
            </p>
            <Link
              href="/parent/chat"
              className="btn-press cta-gradient mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold no-underline"
            >
              Trò chuyện cùng AI <Bot size={18} aria-hidden="true" />
            </Link>
          </div>

          <div className="hidden md:block w-full md:w-[240px] shrink-0">
            <img
              src="/images/d576ea7099444821be6bb70965e3299b.png"
              alt="Hỗ trợ con"
              className="w-full h-auto max-h-[140px] rounded-2xl object-cover shadow-sm bg-white/40 border border-white/60"
            />
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/30 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-10 h-44 w-44 rounded-full bg-accent-violet/30 blur-2xl" />

        {/* Stats bar */}
        <div className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 backdrop-blur">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true"><Users size={20} /></span>
            <div className="min-w-0">
              <strong className="block text-base text-[#5b88dc]">{childCount}</strong>
              <small className="text-xs text-[#6d7394]">Con đang được đồng hành</small>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 backdrop-blur">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-pink/15 text-accent-pink" aria-hidden="true"><ShieldAlert size={20} /></span>
            <div className="min-w-0">
              <strong className="block text-base text-[#e8669c]">{sosCount}</strong>
              <small className="text-xs text-[#6d7394]">Cảnh báo SOS gần đây</small>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="soft-card card-lift rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <h3 className="flex items-center gap-2 text-base font-semibold text-on-background">
            <Users size={18} className="text-primary" aria-hidden="true" /> Con của bạn
          </h3>
          <p className="mt-1 min-h-[40px] text-sm text-on-background/60">{childCount} con đang được đồng hành</p>
          <Link
            href="/parent/students"
            className="btn-press cta-gradient mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold no-underline"
          >
            Xem thông tin <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>

        <article className="soft-card card-lift rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <h3 className="flex items-center gap-2 text-base font-semibold text-on-background">
            <ShieldAlert size={18} className="text-accent-pink" aria-hidden="true" /> Cảnh báo SOS
          </h3>
          <p className="mt-1 min-h-[40px] text-sm text-on-background/60">
            {sosCount > 0 ? `${sosCount} cảnh báo gần đây` : "Hiện không có cảnh báo mới"}
          </p>
          <Link
            href="/parent/sos-alerts"
            className="btn-press cta-gradient mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold no-underline"
          >
            Xem cảnh báo <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>

        <article className="soft-card card-lift rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <h3 className="flex items-center gap-2 text-base font-semibold text-on-background">
            <Bot size={18} className="text-primary" aria-hidden="true" /> Peerlight AI
          </h3>
          <p className="mt-1 min-h-[40px] text-sm text-on-background/60">Hỏi AI cách đồng hành cùng con hiệu quả hơn</p>
          <Link
            href="/parent/chat"
            className="btn-press cta-gradient mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold no-underline"
          >
            Trò chuyện <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>
      </section>
    </div>
  );
}
