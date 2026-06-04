"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, CheckCircle2, ShieldAlert, Users, ArrowRight, RefreshCw, LockKeyhole, HeartHandshake } from "lucide-react";

import { ErrorState } from "@/components/ui-primitives";
import { DashboardSkeleton } from "@/components/skeletons";
import {
  loadParentDashboard,
  type AdultDashboardData,
} from "@/lib/adult-dashboard-loader";

export default function ParentDashboardPage() {
  const [dashboardData, setDashboardData] = useState<AdultDashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  function load() {
    setIsLoading(true);
    setLoadFailed(false);
    loadParentDashboard()
      .then((data) => {
        setDashboardData(data);
        setLoadFailed(false);
        setLastUpdated(new Date());
      })
      .catch(() => {
        setLoadFailed(true);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (isLoading) return <DashboardSkeleton cards={2} />;
  if (loadFailed || dashboardData === null)
    return <ErrorState title="Không tải được" message="Vui lòng thử lại sau" onRetry={load} />;

  const childCount = dashboardData.students.length;
  const sosCount =
    dashboardData.notifications.status === "ready"
      ? dashboardData.notifications.data.length
      : 0;
  const priorityActions = [
    {
      title: sosCount > 0 ? "Xem SOS của con" : "Không có SOS mới",
      description: sosCount > 0 ? "Ưu tiên phản hồi theo hướng dẫn trong ứng dụng." : "Tiếp tục tạo không gian an toàn để con chủ động chia sẻ.",
      href: "/parent/sos-alerts",
      icon: ShieldAlert,
      tone: sosCount > 0 ? "text-red-600 bg-red-50 border-red-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Xem thông tin được phép",
      description: "Chỉ hiển thị tóm tắt cần thiết khi con đã gửi SOS.",
      href: "/parent/students",
      icon: HeartHandshake,
      tone: "text-primary bg-primary/10 border-primary/20",
    },
    {
      title: "Hỏi Peerlight AI",
      description: "Gợi ý cách mở lời với con nhẹ nhàng hơn.",
      href: "/parent/chat",
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
              Xin chào, phụ huynh! 👋
            </h1>
            <p className="mt-2 text-sm text-[#33416b] sm:text-base">
              Cùng đồng hành với con trong phạm vi quyền riêng tư — chỉ khi con
              đã gửi tín hiệu SOS bạn mới thấy tóm tắt hỗ trợ.
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
              src="/images/Phương tiện truyền thông (12).jpg"
              alt="Hỗ trợ con"
              className="w-full h-auto max-h-[140px] rounded-2xl object-cover shadow-sm bg-white/40 border border-white/60"
            />
          </div>

          <div className="absolute right-0 top-0 flex flex-col items-end gap-1">
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
                {lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
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
                {childCount}
              </strong>
              <small className="text-xs text-[#6d7394]">
                Con đang được đồng hành
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
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Việc nên làm tiếp theo</p>
          <h2 className="mt-1 text-lg font-bold text-on-background">Đồng hành mà vẫn tôn trọng con</h2>
          <p className="mt-1 text-sm text-on-background/60">Bắt đầu từ tín hiệu SOS nếu có; nếu không, hãy giữ kênh trò chuyện an toàn và không gây áp lực.</p>
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
            Quyền riêng tư của con
          </div>
          <ul className="mt-4 space-y-3 text-sm text-on-background/65">
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-600" aria-hidden="true" />Không xem nội dung chat riêng tư của con.</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-600" aria-hidden="true" />Chỉ thấy phần cần thiết để hỗ trợ khi có SOS.</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-600" aria-hidden="true" />Hãy hỏi con muốn được hỗ trợ thế nào trước.</li>
          </ul>
        </aside>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="soft-card card-lift rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <h3 className="flex items-center gap-2 text-base font-semibold text-on-background">
            <Users size={18} className="text-primary" aria-hidden="true" /> Con
            của bạn
          </h3>
          <p className="mt-1 min-h-[40px] text-sm text-on-background/60">
            {childCount} con đang được đồng hành
          </p>
          <Link
            href="/parent/students"
            className="btn-press cta-gradient mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold no-underline"
          >
            Xem thông tin <ArrowRight size={16} aria-hidden="true" />
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
            href="/parent/sos-alerts"
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
            Hỏi AI cách đồng hành cùng con hiệu quả hơn
          </p>
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
