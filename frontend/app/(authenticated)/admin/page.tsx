"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DemoGuideCard } from "@/components/demo-guide-card";
import { apiFetch } from "@/lib/api";

type AdminUser = { id: string };
type AdminLink = { id: string };

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState({ users: 0, links: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<AdminUser[]>("/api/admin/users"),
      apiFetch<AdminLink[]>("/api/admin/links"),
    ])
      .then(([users, links]) => setCounts({ users: users.length, links: links.length }))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-display">Cổng quản trị</h1>
        <p className="mt-3 max-w-2xl text-body">
          Quản lý tài khoản, vai trò và liên kết học sinh-người lớn một cách an toàn.
        </p>
      </div>
      <DemoGuideCard
        title="Đi theo luồng quản trị demo"
        body="Dùng cổng quản trị để chứng minh BeYou quản lý nội dung và vận hành bằng metadata, không mở dữ liệu riêng tư thô của học sinh."
        steps={[
          "Kiểm tra operations/readiness và báo cáo tổng hợp riêng tư.",
          "Mở cấu hình chatbot hoặc mood check-in để thấy guardrails.",
          "Xem tài khoản/liên kết demo để hiểu phân quyền học sinh-người lớn.",
        ]}
        actions={[
          { href: "/admin/operations", label: "Mở operations", primary: true },
          { href: "/admin/reports", label: "Báo cáo tổng hợp" },
          { href: "/admin/users", label: "Tài khoản demo" },
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminEntryCard
          href="/admin/operations"
          title="Vận hành metadata-only"
          description="Kiểm tra readiness, email SOS và audit metadata mà không mở dữ liệu riêng tư của học sinh."
          countLabel="Operations"
        />
        <AdminEntryCard
          href="/admin/reports"
          title="Báo cáo tổng hợp riêng tư"
          description="Xem xu hướng tổng hợp đã ẩn nhóm nhỏ, không xuất dữ liệu thô hoặc danh sách nguy cơ."
          countLabel="Riêng tư theo nhóm"
        />
        <AdminEntryCard
          href="/admin/chatbot"
          title="Cấu hình chatbot an toàn"
          description="Quản lý từ khóa nguy cơ và lời nhắc hỗ trợ mà không hiển thị khóa API hay tắt lớp bảo vệ."
          countLabel="Cài đặt an toàn"
        />
        <AdminEntryCard
          href="/admin/mood-checkins"
          title="Cấu hình mood check-in"
          description="Quản lý nhãn, prompt và guidance không chẩn đoán cho check-in cảm xúc."
          countLabel="Mood config"
        />
        <AdminEntryCard
          href="/admin/content"
          title="Nội dung tự kiểm tra và tình huống"
          description="Tạo, chỉnh sửa và xuất bản nội dung hỗ trợ học sinh theo đúng phạm vi an toàn."
          countLabel="Quản lý nội dung"
        />
        <AdminEntryCard
          href="/admin/privacy-policy"
          title="Chính sách riêng tư v1.4"
          description="Cấu hình nhắc nhở, chia sẻ và lý do truy cập bằng mặc định an toàn, không mở dữ liệu thô."
          countLabel="Privacy policy"
        />
        <AdminEntryCard
          href="/admin/users"
          title="Quản lý tài khoản"
          description="Tạo, cập nhật, tạm khóa hoặc xóa tài khoản theo đúng phạm vi demo."
          countLabel={isLoading ? "Đang tải thông tin..." : `${counts.users} tài khoản`}
        />
        <AdminEntryCard
          href="/admin/links"
          title="Liên kết học sinh và người lớn hỗ trợ"
          description="Tạo hoặc thu hồi liên kết giữa học sinh với giáo viên/phụ huynh."
          countLabel={isLoading ? "Đang tải thông tin..." : `${counts.links} liên kết`}
        />
      </div>
    </section>
  );
}

function AdminEntryCard({
  href,
  title,
  description,
  countLabel,
}: {
  href: string;
  title: string;
  description: string;
  countLabel: string;
}) {
  return (
    <Link
      href={href}
      className="block min-w-0 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-transparent hover:-translate-y-0.5 hover:ring-[#D7EFE8] sm:p-6"
    >
      <p className="text-label font-semibold text-accent">{countLabel}</p>
      <h2 className="mt-2 text-heading">{title}</h2>
      <p className="mt-3 text-body">{description}</p>
    </Link>
  );
}
