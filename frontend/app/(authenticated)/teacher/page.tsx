"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, CheckCircle2, ShieldAlert, Users, ArrowRight, RefreshCw, LockKeyhole } from "lucide-react";

import { ErrorState } from "@/components/ui-primitives";
import { DashboardSkeleton } from "@/components/skeletons";
import {
  loadTeacherDashboard,
  type AdultDashboardData,
} from "@/lib/adult-dashboard-loader";

export default function TeacherDashboardPage() {
  const [dashboardData, setDashboardData] = useState<AdultDashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  function load() {
    setIsLoading(true);
    setLoadFailed(false);
    loadTeacherDashboard()
      .then((data) => {
        setDashboardData(data);
        setLoadFailed(false);
        setLastUpdated(new Date());
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (isLoading) return <DashboardSkeleton cards={2} />;
  if (loadFailed || dashboardData === null)
    return (
      <ErrorState
        title="Không tải được"
        message="Vui lòng thử lại sau"
        onRetry={load}
      />
    );

  const studentCount = dashboardData.students.length;
  const sosCount =
    dashboardData.notifications.status === "ready"
      ? dashboardData.notifications.data.length
      : 0;
  const priorityActions = [
    {
      title: sosCount > 0 ? "Ưu tiên xem SOS mới" : "Không có SOS mới",
      description: sosCount > 0 ? "Bắt đầu từ các tín hiệu cần hỗ trợ gần đây." : "Tiếp tục duy trì quan sát trong phạm vi được phép.",
      href: "/teacher/sos-alerts",
      icon: ShieldAlert,
      tone: sosCount > 0 ? "text-red-600 bg-red-50 border-red-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Xem danh sách học sinh",
      description: "Chỉ hiện học sinh/liên kết đúng quyền và tóm tắt được phép xem.",
      href: "/teacher/students",
      icon: Users,
      tone: "text-primary bg-primary/10 border-primary/20",
    },
    {
      title: "Hỏi Peerlight AI",
      description: "Gợi ý cách mở lời hỗ trợ, không thay thế quy trình trường học.",
      href: "/teacher/chat",
      icon: Bot,
      tone: "text-accent-violet bg-accent-violet/10 border-accent-violet/20",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="hero-gradient soft-card animate-fade-in relative overflow-hidden rounded-[20px] p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl flex-1">
            <h1 className="text-2xl font-bold text-[#17204c] sm:text-3xl">
              Xin chào, thầy/cô! 👋
            </h1>
            <p className="mt-2 text-sm text-[#33416b] sm:text-base">
              Đồng hành cùng học sinh trong phạm vi quyền riêng tư — chỉ các em
              đã gửi tín hiệu SOS mới hiển thị tóm tắt hỗ trợ.
            </p>
            <Link
              href="/teacher/chat"
              className="btn-press cta-gradient mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold no-underline"
            >
              Trò chuyện cùng AI <Bot size={18} aria-hidden="true" />
            </Link>
          </div>

          <div className="hidden md:block w-full md:w-[240px] shrink-0">
            <img
              src="/images/Phương tiện truyền thông (11).jpg"
              alt="Hỗ trợ học sinh"
              className="w-full h-auto max-h-[140px] rounded-2xl object-cover shadow-sm bg-white/40 border border-white/60"
            />
          </div>

          <div className="flex flex-col items-end gap-1 absolute top-0 right-0">
            <button
              type="button"
              onClick={load}
              aria-label="Làm mới dữ liệu"
              className="rounded-xl bg-white/70 p-2 text-[#33416b] backdrop-blur transition-colors hover:bg-white"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
            {lastUpdated && (
              <span className="text-[10px] text-[#33416b]/70">
                {lastUpdated.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/30 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 right-10 h-44 w-44 rounded-full bg-accent-violet/30 blur-2xl"
        />

        {/* Stats bar */}
        <div className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 backdrop-blur">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <Users size={20} />
            </span>
            <div className="min-w-0">
              <strong className="block text-base text-[#5b88dc]">
                {studentCount}
              </strong>
              <small className="text-xs text-[#6d7394]">
                Học sinh đang đồng hành
              </small>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 backdrop-blur">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl bg-accent-pink/15 text-accent-pink"
              aria-hidden="true"
            >
              <ShieldAlert size={20} />
            </span>
            <div className="min-w-0">
              <strong className="block text-base text-[#e8669c]">
                {sosCount}
              </strong>
              <small className="text-xs text-[#6d7394]">
                Cảnh báo SOS gần đây
              </small>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="soft-card rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Việc nên làm tiếp theo</p>
              <h2 className="mt-1 text-lg font-bold text-on-background">Ưu tiên hỗ trợ an toàn</h2>
              <p className="mt-1 text-sm text-on-background/60">Tập trung vào SOS và liên kết đang hoạt động, không xem dữ liệu riêng tư ngoài phạm vi.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {priorityActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href} className="group rounded-2xl border border-outline-variant/30 bg-surface p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md dark:bg-[#20284b]">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${action.tone}`}>
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-on-background">{action.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-on-background/60">{action.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">Mở <ArrowRight size={13} aria-hidden="true" /></span>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="soft-card rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <div className="flex items-center gap-2 text-sm font-bold text-on-background">
            <LockKeyhole size={17} className="text-primary" aria-hidden="true" />
            Ranh giới riêng tư
          </div>
          <ul className="mt-4 space-y-3 text-sm text-on-background/65">
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-600" aria-hidden="true" />Chỉ xem tóm tắt khi có SOS/liên kết hợp lệ.</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-600" aria-hidden="true" />Không có câu trả lời riêng tư hoặc nội dung chat học sinh.</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-600" aria-hidden="true" />Mọi thao tác hỗ trợ nên bắt đầu bằng lắng nghe.</li>
          </ul>
        </aside>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="soft-card card-lift rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <h3 className="flex items-center gap-2 text-base font-semibold text-on-background">
            <Users size={18} className="text-primary" aria-hidden="true" /> Học
            sinh đang đồng hành
          </h3>
          <p className="mt-1 min-h-[40px] text-sm text-on-background/60">
            {studentCount} học sinh đang được đồng hành
          </p>
          <Link
            href="/teacher/students"
            className="btn-press cta-gradient mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold no-underline"
          >
            Xem danh sách <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>

        <article className="soft-card card-lift rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <h3 className="flex items-center gap-2 text-base font-semibold text-on-background">
            <ShieldAlert
              size={18}
              className="text-accent-pink"
              aria-hidden="true"
            />{" "}
            Cảnh báo SOS
          </h3>
          <p className="mt-1 min-h-[40px] text-sm text-on-background/60">
            {sosCount > 0
              ? `${sosCount} cảnh báo gần đây`
              : "Hiện không có cảnh báo mới"}
          </p>
          <Link
            href="/teacher/sos-alerts"
            className="btn-press cta-gradient mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold no-underline"
          >
            Xem cảnh báo <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>

        <article className="soft-card card-lift rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <h3 className="flex items-center gap-2 text-base font-semibold text-on-background">
            <Bot size={18} className="text-primary" aria-hidden="true" />{" "}
            Peerlight AI
          </h3>
          <p className="mt-1 min-h-[40px] text-sm text-on-background/60">
            Hỏi AI cách hỗ trợ học sinh hiệu quả hơn
          </p>
          <Link
            href="/teacher/chat"
            className="btn-press cta-gradient mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold no-underline"
          >
            Trò chuyện <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>
      </section>
    </div>
  );
}
