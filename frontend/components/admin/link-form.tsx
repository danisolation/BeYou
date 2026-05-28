"use client";

import { FormEvent, useMemo, useState } from "react";

import { AdminLinkCreate, AdminUser } from "@/lib/admin-api";

const relationshipOptions: AdminLinkCreate["relationship_type"][] = ["teacher", "parent"];

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ student_id: studentId, adult_id: adultId, relationship_type: relationshipType });
  }

  return (
    <form className="rounded-2xl bg-white p-5 shadow-sm sm:p-6" onSubmit={handleSubmit}>
      <h2 className="text-sm font-semibold">Tạo liên kết</h2>
      <p className="mt-2 text-xs">
        Liên kết này quyết định người lớn nào được xem thông tin hỗ trợ được phép hiển thị.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-2 text-xs font-semibold">
          Học sinh
          <select required value={studentId} onChange={(event) => setStudentId(event.target.value)} className="min-h-12 w-full rounded-2xl border border-outline-variant/30 px-3">
            <option value="">Chọn học sinh</option>
            {students.map((user) => (
              <option key={user.id} value={user.id}>{user.full_name}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-semibold">
          Người lớn hỗ trợ
          <select required value={adultId} onChange={(event) => setAdultId(event.target.value)} className="min-h-12 w-full rounded-2xl border border-outline-variant/30 px-3">
            <option value="">Chọn người lớn</option>
            {adults.map((user) => (
              <option key={user.id} value={user.id}>{user.full_name}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-semibold">
          Loại liên kết
          <select value={relationshipType} onChange={(event) => setRelationshipType(event.target.value as AdminLinkCreate["relationship_type"])} className="min-h-12 w-full rounded-2xl border border-outline-variant/30 px-3">
            {relationshipOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit" className="mt-5 min-h-12 w-full rounded-2xl bg-primary px-4 font-semibold text-white hover:bg-primary/80 sm:w-auto">
        Tạo liên kết
      </button>
    </form>
  );
}
