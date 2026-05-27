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
import { PrivacyBoundaryCard } from "@/components/ui-primitives";
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
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-on-background sm:text-headline-lg">
          Xin chào, quản trị viên!
        </h1>
        <p className="mt-2 text-body-lg text-on-background/70">
          Quản lý hệ thống an toàn và hiệu quả
        </p>
      </div>

      <PrivacyBoundaryCard
        title="Vận hành metadata-only"
        description="Cổng quản trị chỉ hiển thị metadata vận hành và số lượng tổng hợp — không mở dữ liệu riêng tư của học sinh."
      />

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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StitchCard
          variant="circular"
          icon={<Activity size={28} />}
          title="Vận hành"
          description="Readiness, email SOS và audit metadata"
          ctaLabel="Mở bảng vận hành"
          ctaHref="/admin/operations"
        />
        <StitchCard
          variant="circular"
          icon={<Shield size={28} />}
          title="Báo cáo tổng hợp"
          description="Xu hướng tổng hợp đã ẩn nhóm nhỏ"
          ctaLabel="Xem báo cáo"
          ctaHref="/admin/reports"
        />
        <StitchCard
          variant="circular"
          icon={<Bot size={28} />}
          title="Cấu hình chatbot"
          description="Từ khóa nguy cơ và lời nhắc hỗ trợ"
          ctaLabel="Cài đặt chatbot"
          ctaHref="/admin/chatbot"
        />
        <StitchCard
          variant="circular"
          icon={<Heart size={28} />}
          title="Mood check-in"
          description="Nhãn, prompt và guidance check-in"
          ctaLabel="Cấu hình"
          ctaHref="/admin/mood-checkins"
        />
        <StitchCard
          variant="circular"
          icon={<FileText size={28} />}
          title="Nội dung"
          description="Tự kiểm tra, tình huống và bài test"
          ctaLabel="Quản lý nội dung"
          ctaHref="/admin/content"
        />
        <StitchCard
          variant="circular"
          icon={<Settings size={28} />}
          title="Chính sách riêng tư"
          description="Cấu hình nhắc nhở và quyền truy cập"
          ctaLabel="Mở chính sách"
          ctaHref="/admin/privacy-policy"
        />
        <StitchCard
          variant="circular"
          icon={<Users size={28} />}
          title="Tài khoản"
          description={`${previews.users} tài khoản demo`}
          ctaLabel="Quản lý tài khoản"
          ctaHref="/admin/users"
        />
        <StitchCard
          variant="circular"
          icon={<Link2 size={28} />}
          title="Liên kết"
          description={`${previews.links} liên kết hiện có`}
          ctaLabel="Quản lý liên kết"
          ctaHref="/admin/links"
        />
      </div>
    </div>
  );
}
