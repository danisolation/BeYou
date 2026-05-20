"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { apiFetch } from "@/lib/api";

type LinkedAdult = {
  id: string;
  full_name: string;
  email: string;
  relationship_type: "teacher" | "parent";
  link_status: string;
  is_demo: boolean;
};

type StudentProfile = {
  id: string;
  full_name: string;
  email: string;
  school: string | null;
  class_name: string | null;
  is_demo: boolean;
  linked_adults: LinkedAdult[];
};

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<StudentProfile>("/api/student/profile")
      .then(setProfile)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p>Đang tải thông tin...</p>;
  }

  if (profile === null) {
    return <EmptyState />;
  }

  const teachers = profile.linked_adults.filter((adult) => adult.relationship_type === "teacher");
  const parents = profile.linked_adults.filter((adult) => adult.relationship_type === "parent");

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-secondary p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display">Bảng điều khiển của em</h1>
          {profile.is_demo ? <DemoBadge /> : null}
        </div>
        <div className="mt-5 grid gap-3 text-body md:grid-cols-2">
          <p><strong>Họ tên:</strong> {profile.full_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Trường:</strong> {profile.school ?? "Chưa cập nhật"}</p>
          <p><strong>Lớp:</strong> {profile.class_name ?? "Chưa cập nhật"}</p>
        </div>
        <Link className="mt-5 inline-flex min-h-11 items-center font-semibold text-accent" href="/privacy?review=true">
          Ai có thể xem thông tin của em?
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LinkedAdultGroup title="Giáo viên hỗ trợ" adults={teachers} />
        <LinkedAdultGroup title="Phụ huynh hỗ trợ" adults={parents} />
      </div>
    </section>
  );
}

function LinkedAdultGroup({ title, adults }: { title: string; adults: LinkedAdult[] }) {
  if (adults.length === 0) {
    return <EmptyState heading={title} body="Chưa có người lớn hỗ trợ được liên kết trong mục này." />;
  }
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-heading">{title}</h2>
      <div className="mt-4 space-y-3">
        {adults.map((adult) => (
          <article key={adult.id} className="rounded-2xl border border-[#D7EFE8] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{adult.full_name}</h3>
              {adult.is_demo ? <DemoBadge /> : null}
            </div>
            <p className="text-label">{adult.email}</p>
            <p className="text-label">Trạng thái liên kết: {adult.link_status}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
