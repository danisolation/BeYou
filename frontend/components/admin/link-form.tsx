"use client";

import { FormEvent, useMemo, useState } from "react";

import { AdminLinkCreate, AdminUser } from "@/lib/admin-api";

const relationshipOptions: { value: AdminLinkCreate["relationship_type"]; label: string }[] = [
  { value: "teacher", label: "Giáo viên" },
  { value: "parent", label: "Phụ huynh" },
];

type LinkFormProps = {
  users: AdminUser[];
  onSubmit: (payload: AdminLinkCreate) => Promise<void> | void;
};

export function LinkForm({ users, onSubmit }: LinkFormProps) {
  const students = useMemo(() => users.filter((user) => user.role === "student"), [users]);
  const adults = useMemo(() => users.filter((user) => user.role === "teacher" || user.role === "parent"), [users]);
  const [studentId, setStudentId] = useState("");
  const [adultId, setAdultId] = useState("");
  const [relationshipType, setRelationshipType] = useState<AdminLinkCreate["relationship_type"]>("teacher");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ student_id: studentId, adult_id: adultId, relationship_type: relationshipType });
      setStudentId("");
      setAdultId("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-sm font-semibold text-on-background">Tạo liên kết mới</h2>
      <p className="mt-1 text-xs text-on-background/60">
        Liên kết quyết định người lớn nào được xem thông tin hỗ trợ được phép hiển thị.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Học sinh
          <select
            required
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background"
          >
            <option value="">Chọn học sinh</option>
            {students.map((user) => (
              <option key={user.id} value={user.id}>{user.full_name}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Người lớn hỗ trợ
          <select
            required
            value={adultId}
            onChange={(event) => setAdultId(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background"
          >
            <option value="">Chọn người lớn</option>
            {adults.map((user) => (
              <option key={user.id} value={user.id}>{user.full_name} ({user.role === "teacher" ? "GV" : "PH"})</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Loại liên kết
          <select
            value={relationshipType}
            onChange={(event) => setRelationshipType(event.target.value as AdminLinkCreate["relationship_type"])}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background"
          >
            {relationshipOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-press mt-4 min-h-11 w-full rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
      >
        {isSubmitting ? "Đang tạo..." : "Tạo liên kết"}
      </button>
    </form>
  );
}
