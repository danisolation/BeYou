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
} from "lucide-react";

import { DemoGuideCard } from "@/components/demo-guide-card";
import { DashboardSkeleton } from "@/components/skeletons";
import { StitchCard } from "@/components/stitch-card";
import { listLinks, listUsers } from "@/lib/admin-api";

export default function AdminDashboardPage() {
  const [previews, setPreviews] = useState({ users: 0, links: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    Promise.all([listUsers({ limit: 10 }), listLinks({ limit: 10 })])
      .then(([users, links]) => {
        if (!isActive) return;
        setPreviews({ users: users.length, links: links.length });
      })
      .catch(() => {})
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => { isActive = false; };
  }, []);

  if (isLoading) return <DashboardSkeleton cards={8} />;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-lg font-semibold text-on-background">
          Quản trị hệ thống
        </h1>
        <p className="mt-1 text-sm text-on-background/60">
          Quản lý hệ thống an toàn và hiệu quả
        </p>
      </div>

      <DemoGuideCard
        title="Luồng quản trị demo"
        body="Dùng cổng này để quản lý nội dung, vận hành và cấu hình hệ thống."
        steps={[
          "Kiểm tra operations và báo cáo tổng hợp.",
          "Cấu hình chatbot hoặc mood check-in.",
          "Quản lý tài khoản và liên kết.",
        ]}
        actions={[
          { href: "/admin/operations", label: "Mở operations", primary: true },
          { href: "/admin/reports", label: "Báo cáo" },
          { href: "/admin/users", label: "Tài khoản" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StitchCard
          variant="circular"
          icon={<Activity size={22} />}
          title="Vận hành"
          description="Readiness, email SOS và audit metadata"
          ctaLabel="Mở bảng vận hành"
          ctaHref="/admin/operations"
          className="animate-fade-in-up delay-100"
        />
        <StitchCard
          variant="circular"
          icon={<Shield size={22} />}
          title="Báo cáo tổng hợp"
          description="Xu hướng tổng hợp đã ẩn nhóm nhỏ"
          ctaLabel="Xem báo cáo"
          ctaHref="/admin/reports"
          className="animate-fade-in-up delay-200"
        />
        <StitchCard
          variant="circular"
          icon={<Bot size={22} />}
          title="Cấu hình chatbot"
          description="Từ khóa nguy cơ và lời nhắc hỗ trợ"
          ctaLabel="Cài đặt chatbot"
          ctaHref="/admin/chatbot"
          className="animate-fade-in-up delay-300"
        />
        <StitchCard
          variant="circular"
          icon={<Heart size={22} />}
          title="Mood check-in"
          description="Nhãn, prompt và guidance check-in"
          ctaLabel="Cấu hình"
          ctaHref="/admin/mood-checkins"
          className="animate-fade-in-up delay-100"
        />
        <StitchCard
          variant="circular"
          icon={<FileText size={22} />}
          title="Nội dung"
          description="Tự kiểm tra, tình huống và bài test"
          ctaLabel="Quản lý nội dung"
          ctaHref="/admin/content"
          className="animate-fade-in-up delay-200"
        />
        <StitchCard
          variant="circular"
          icon={<Settings size={22} />}
          title="Chính sách riêng tư"
          description="Cấu hình nhắc nhở và quyền truy cập"
          ctaLabel="Mở chính sách"
          ctaHref="/admin/privacy-policy"
          className="animate-fade-in-up delay-300"
        />
        <StitchCard
          variant="circular"
          icon={<Users size={22} />}
          title="Tài khoản"
          description={`${previews.users} tài khoản demo`}
          ctaLabel="Quản lý tài khoản"
          ctaHref="/admin/users"
          className="animate-fade-in-up delay-100"
        />
        <StitchCard
          variant="circular"
          icon={<Link2 size={22} />}
          title="Liên kết"
          description={`${previews.links} liên kết hiện có`}
          ctaLabel="Quản lý liên kết"
          ctaHref="/admin/links"
          className="animate-fade-in-up delay-200"
        />
      </div>
    </div>
  );
}
