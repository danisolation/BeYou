"use client";

import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { apiFetch } from "@/lib/api";

type LinkedStudent = {
  id: string;
  full_name: string;
  email: string;
  school: string | null;
  class_name: string | null;
  relationship_type: string;
  link_status: string;
  is_demo: boolean;
};

export default function TeacherDashboardPage() {
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<LinkedStudent[]>("/api/teacher/students")
      .then(setStudents)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p>Đang tải thông tin...</p>;
  }

  return (
    <RoleStudentList
      title="Cổng giáo viên"
      subtitle="Xem học sinh được liên kết và các thông tin được phép xem để hỗ trợ các em."
      students={students}
      emptyBody="Khi quản trị viên tạo liên kết, học sinh được phép hỗ trợ sẽ hiển thị tại đây."
    />
  );
}

export function RoleStudentList({
  title,
  subtitle,
  students,
  emptyBody,
}: {
  title: string;
  subtitle: string;
  students: LinkedStudent[];
  emptyBody: string;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-display">{title}</h1>
        <p className="mt-3 max-w-2xl text-body">{subtitle}</p>
      </div>
      {students.length === 0 ? (
        <EmptyState heading="Chưa có học sinh được liên kết" body={emptyBody} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {students.map((student) => (
            <article key={student.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-heading">{student.full_name}</h2>
                {student.is_demo ? <DemoBadge /> : null}
              </div>
              <p className="mt-2 text-label">{student.email}</p>
              <p className="mt-3 text-body">Trường: {student.school ?? "Chưa cập nhật"}</p>
              <p className="text-body">Lớp: {student.class_name ?? "Chưa cập nhật"}</p>
              <p className="mt-3 text-label">Trạng thái liên kết: {student.link_status}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
