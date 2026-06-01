"use client";

import { FormEvent, useState } from "react";

import { AdminUserCreate } from "@/lib/admin-api";

const roleOptions: { value: AdminUserCreate["role"]; label: string }[] = [
  { value: "student", label: "Học sinh" },
  { value: "teacher", label: "Giáo viên" },
  { value: "parent", label: "Phụ huynh" },
  { value: "admin", label: "Quản trị" },
];

const statusOptions: { value: AdminUserCreate["status"]; label: string }[] = [
  { value: "active", label: "Hoạt động" },
  { value: "disabled", label: "Đã khóa" },
  { value: "deleted", label: "Đã xóa" },
];

type UserFormProps = {
  onSubmit: (payload: AdminUserCreate) => Promise<void> | void;
};

export function UserForm({ onSubmit }: UserFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminUserCreate["role"]>("student");
  const [status, setStatus] = useState<AdminUserCreate["status"]>("active");
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [className, setClassName] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role === "student" && (!school.trim() || !className.trim())) {
      setError("Tài khoản học sinh cần có trường và lớp.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit({
        email,
        password,
        role,
        full_name: fullName,
        school: school || null,
        class_name: className || null,
        status,
        is_demo: isDemo,
      });
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-5 sm:p-6" onSubmit={handleSubmit}>
      <h2 className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Tạo tài khoản mới</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Họ tên
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background"
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background"
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Mật khẩu
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background"
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Vai trò
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminUserCreate["role"])}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background"
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Trạng thái
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AdminUserCreate["status"])}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Trường
          <input
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background"
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Lớp
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background"
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-xs font-medium text-on-background/70 sm:col-span-2">
          <input
            type="checkbox"
            checked={isDemo}
            onChange={(e) => setIsDemo(e.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          Tài khoản demo
        </label>
      </div>
      {error ? <p className="mt-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-xs text-on-background">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-press mt-5 min-h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
      >
        {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
      </button>
    </form>
  );
}
