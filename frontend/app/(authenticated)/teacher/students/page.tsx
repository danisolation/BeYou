"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { ErrorState } from "@/components/ui-primitives";
import { DashboardSkeleton } from "@/components/skeletons";
import { apiFetch } from "@/lib/api";

interface LinkedStudent {
  id: string;
  full_name: string;
  email: string;
  relationship_type: string;
  link_status: string;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<LinkedStudent[]>("/api/teacher/students")
      .then(setStudents)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton cards={3} />;
  if (error) return <ErrorState title="Không tải được" message="Vui lòng thử lại sau" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-on-background sm:text-headline-lg">
          Học sinh liên kết
        </h1>
        <p className="mt-2 text-body-lg text-on-background/70">
          {students.length} học sinh đang được đồng hành
        </p>
      </div>

      {students.length === 0 ? (
        <div className="rounded-[32px] border border-outline-variant/30 bg-white p-8 text-center dark:bg-[var(--surface)]">
          <Users className="mx-auto mb-4 text-on-background/30" size={48} />
          <p className="text-on-background/70">Chưa có học sinh nào được liên kết</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {students.map((s) => (
            <Link
              key={s.id}
              href={`/teacher/students/${s.id}/support-summary`}
              className="flex items-center gap-4 rounded-[24px] border border-outline-variant/30 bg-white p-5 no-underline transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-[var(--surface)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users size={20} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-on-background">{s.full_name}</p>
                <p className="text-sm text-on-background/60">{s.email}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
