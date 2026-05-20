"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
      <div className="grid gap-4 md:grid-cols-2">
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
    <Link href={href} className="block rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-label font-semibold text-accent">{countLabel}</p>
      <h2 className="mt-2 text-heading">{title}</h2>
      <p className="mt-3 text-body">{description}</p>
    </Link>
  );
}
