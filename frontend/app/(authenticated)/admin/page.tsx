"use client";

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

    return () => { isActive = false; };
  }, []);

  if (isLoading) return <DashboardSkeleton cards={6} />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-on-background">Quản trị hệ thống</h1>
        <p className="mt-1 text-sm text-on-background/60">Tổng quan và truy cập nhanh các chức năng quản trị.</p>
      </div>

      {loadError && (
        <p role="alert" className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-xs text-on-background">
          Không tải được thống kê nhanh. Hãy kiểm tra kết nối và tải lại trang.
        </p>
      )}

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-on-background">{previews.users}</p>
              <p className="text-xs text-on-background/50">Tài khoản</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Link2 size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-on-background">{previews.links}</p>
              <p className="text-xs text-on-background/50">Liên kết</p>
            </div>
          </div>
        </div>
        <Link href="/admin/operations" className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-4 no-underline transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-background">Thử nghiệm</p>
              <p className="text-xs text-on-background/50">Xem trạng thái →</p>
            </div>
          </div>
        </Link>
      </div>

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

function AdminCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl border border-outline-variant/30 bg-white p-4 no-underline transition-all hover:border-primary/30 hover:shadow-md dark:bg-[#1a2244]"
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
