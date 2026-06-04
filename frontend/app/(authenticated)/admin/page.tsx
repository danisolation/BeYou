"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import {
  Bot,
  Heart,
  FileText,
  Link2,
  Settings,
  Shield,
  Users,
  Activity,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";

import { DashboardSkeleton } from "@/components/skeletons";
import { listLinks, listUsers } from "@/lib/admin-api";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [previews, setPreviews] = useState({ users: 0, links: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isActive = true;

    Promise.all([listUsers({ limit: 100 }), listLinks({ limit: 100 })])
      .then(([users, links]) => {
        if (!isActive) return;
        setPreviews({ users: users.length, links: links.length });
      })
      .catch(() => {
        if (isActive) setLoadError(true);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) return <DashboardSkeleton cards={6} />;

  const priorityOps = [
    {
      href: "/admin/operations",
      icon: <Activity size={18} />,
      title: "Kiểm tra vận hành",
      description: "Xem readiness, smoke profile và trạng thái pilot trước khi demo.",
    },
    {
      href: "/admin/privacy-policy",
      icon: <LockKeyhole size={18} />,
      title: "Rà quyền riêng tư",
      description: "Kiểm tra policy hiển thị và mặc định chia sẻ theo vai trò.",
    },
    {
      href: "/admin/users",
      icon: <Users size={18} />,
      title: "Quản lý tài khoản",
      description: "Tạo/sửa vai trò, khóa/mở và rà demo account.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="hero-gradient soft-card animate-fade-in relative overflow-hidden rounded-[20px] p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl flex-1">
            <h1 className="text-2xl font-bold text-[#17204c] sm:text-3xl">
              Quản trị hệ thống
            </h1>
            <p className="mt-2 text-sm text-[#33416b] sm:text-base">
              Tổng quan và truy cập nhanh các chức năng quản trị — chỉ hiển thị
              dữ liệu tổng hợp, không có thông tin riêng của từng học sinh.
            </p>
            {loadError && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-[#33416b] backdrop-blur">
                <AlertTriangle size={14} aria-hidden="true" /> Không tải được
                thống kê nhanh. Hãy kiểm tra kết nối và tải lại trang.
              </p>
            )}
          </div>

          <div className="hidden md:block w-full md:w-[240px] shrink-0">
            <img
              src="/images/Phương tiện truyền thông.jpg"
              alt="Hỗ trợ quản trị"
              className="w-full h-auto max-h-[140px] rounded-2xl object-cover shadow-sm bg-white/40 border border-white/60"
            />
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
        <div className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 backdrop-blur">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <Users size={18} />
            </span>
            <div className="min-w-0">
              <strong className="block text-xl text-[#5b88dc]">
                {previews.users}
              </strong>
              <small className="text-xs text-[#6d7394]">Tài khoản</small>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 backdrop-blur">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl bg-accent-violet/15 text-accent-violet"
              aria-hidden="true"
            >
              <Link2 size={18} />
            </span>
            <div className="min-w-0">
              <strong className="block text-xl text-[#7457e8]">
                {previews.links}
              </strong>
              <small className="text-xs text-[#6d7394]">Liên kết</small>
            </div>
          </div>
          <Link
            href="/admin/operations"
            className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 no-underline backdrop-blur transition-shadow hover:shadow-md"
          >
            <span
              className="grid h-10 w-10 place-items-center rounded-xl bg-accent-cyan/20 text-[#3aa6c2]"
              aria-hidden="true"
            >
              <Activity size={18} />
            </span>
            <div className="min-w-0">
              <strong className="block text-sm text-[#17204c]">Pilot</strong>
              <small className="inline-flex items-center gap-1 text-xs text-[#6d7394]">
                Xem trạng thái <ArrowRight size={12} aria-hidden="true" />
              </small>
            </div>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="soft-card rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Ưu tiên quản trị</p>
          <h2 className="mt-1 text-lg font-bold text-on-background">Bắt đầu từ các kiểm tra an toàn</h2>
          <p className="mt-1 text-sm text-on-background/60">Các thao tác này giúp demo/pilot ổn định mà không mở rộng quyền xem dữ liệu riêng tư.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {priorityOps.map((item) => (
              <AdminPriorityCard key={item.href} {...item} />
            ))}
          </div>
        </div>

        <aside className="soft-card rounded-[20px] border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
          <div className="flex items-center gap-2 text-sm font-bold text-on-background">
            <Shield size={17} className="text-primary" aria-hidden="true" />
            Nguyên tắc dữ liệu
          </div>
          <ul className="mt-4 space-y-3 text-sm text-on-background/65">
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-600" aria-hidden="true" />Không xuất raw nội dung nhạy cảm.</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-600" aria-hidden="true" />Báo cáo dùng tổng hợp và suppression nhóm nhỏ.</li>
            <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-600" aria-hidden="true" />Mọi truy cập đều theo vai trò và audit metadata.</li>
          </ul>
        </aside>
      </section>

      {/* Monitoring & Operations */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-on-background/50">
          <BarChart3 size={14} /> Giám sát & Vận hành
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminCard
            href="/admin/operations"
            icon={<Activity size={18} />}
            title="Bảng vận hành"
            description="Mức sẵn sàng thử nghiệm, kiểm tra trước khi mở và rà soát SOS"
          />
          <AdminCard
            href="/admin/reports"
            icon={<Shield size={18} />}
            title="Báo cáo tổng hợp"
            description="Xu hướng sức khỏe tinh thần (đã ẩn nhóm nhỏ)"
          />
        </div>
      </section>

      {/* Configuration */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-on-background/50">
          <Settings size={14} /> Cấu hình nội dung
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AdminCard
            href="/admin/chatbot"
            icon={<Bot size={18} />}
            title="Chatbot AI"
            description="Từ khóa nguy cơ, lời nhắc an toàn"
          />
          <AdminCard
            href="/admin/mood-checkins"
            icon={<Heart size={18} />}
            title="Mood check-in"
            description="Nhãn cảm xúc, prompt, context tags"
          />
          <AdminCard
            href="/admin/content"
            icon={<FileText size={18} />}
            title="Nội dung test & tình huống"
            description="Quản lý bài tự kiểm tra và tình huống luyện tập"
          />
          <AdminCard
            href="/admin/privacy-policy"
            icon={<AlertTriangle size={18} />}
            title="Chính sách riêng tư"
            description="Quyền truy cập và điều khoản chia sẻ dữ liệu"
          />
        </div>
      </section>

      {/* User Management */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-on-background/50">
          <Users size={14} /> Quản lý người dùng
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminCard
            href="/admin/users"
            icon={<Users size={18} />}
            title="Tài khoản"
            description={`${previews.users} tài khoản — tạo, sửa vai trò, khóa/mở`}
          />
          <AdminCard
            href="/admin/links"
            icon={<Link2 size={18} />}
            title="Liên kết"
            description={`${previews.links} liên kết — gắn học sinh với người lớn hỗ trợ`}
          />
        </div>
      </section>
    </div>
  );
}

function AdminPriorityCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group rounded-2xl border border-outline-variant/30 bg-surface p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md dark:bg-[#20284b]">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
        {icon}
      </span>
      <h3 className="mt-3 text-sm font-bold text-on-background">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-on-background/60">{description}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">Mở <ArrowRight size={13} aria-hidden="true" /></span>
    </Link>
  );
}

function AdminCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group soft-card card-lift flex items-start gap-3 rounded-[20px] border border-outline-variant/30 bg-white p-4 no-underline transition-all hover:border-primary/30 dark:bg-[#1a2244]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-on-background">{title}</p>
        <p className="mt-0.5 text-xs text-on-background/60">{description}</p>
      </div>
    </Link>
  );
}
