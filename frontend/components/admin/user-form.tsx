"use client";

import { FormEvent, useState } from "react";

import { AdminUserCreate } from "@/lib/admin-api";

const roleOptions: AdminUserCreate["role"][] = ["student", "teacher", "parent", "admin"];
const statusOptions: AdminUserCreate["status"][] = ["active", "disabled", "deleted"];

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role === "student" && (!school.trim() || !className.trim())) {
      setError("Tài khoản học sinh cần có trường và lớp.");
      return;
    }
    setError("");
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
  }

  return (
    <form className="rounded-2xl bg-white p-5 shadow-sm sm:p-6" onSubmit={handleSubmit}>
      <h2 className="text-sm font-semibold">Tạo tài khoản</h2>
      <p className="mt-2 text-xs">
        Tài khoản demo chỉ dùng để giới thiệu sản phẩm, không phải hồ sơ học sinh thật.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-xs font-semibold">
          Họ tên
          <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="min-h-12 w-full rounded-xl border border-outline-variant/30 px-3" />
        </label>
        <label className="space-y-2 text-xs font-semibold">
          Email
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 w-full rounded-xl border border-outline-variant/30 px-3" />
        </label>
        <label className="space-y-2 text-xs font-semibold">
          Mật khẩu
          <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-outline-variant/30 px-3" />
        </label>
        <label className="space-y-2 text-xs font-semibold">
          Vai trò
          <select value={role} onChange={(event) => setRole(event.target.value as AdminUserCreate["role"])} className="min-h-12 w-full rounded-xl border border-outline-variant/30 px-3">
            {roleOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-semibold">
          Trạng thái tài khoản
          <select value={status} onChange={(event) => setStatus(event.target.value as AdminUserCreate["status"])} className="min-h-12 w-full rounded-xl border border-outline-variant/30 px-3">
            {statusOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-semibold">
          Trường
          <input value={school} onChange={(event) => setSchool(event.target.value)} className="min-h-12 w-full rounded-xl border border-outline-variant/30 px-3" />
        </label>
        <label className="space-y-2 text-xs font-semibold">
          Lớp
          <input value={className} onChange={(event) => setClassName(event.target.value)} className="min-h-12 w-full rounded-xl border border-outline-variant/30 px-3" />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={isDemo} onChange={(event) => setIsDemo(event.target.checked)} className="min-h-5 min-w-5 accent-primary" />
          Demo
        </label>
      </div>
      {error ? <p className="mt-4 rounded-2xl border border-amber-300 dark:border-amber-700 px-4 py-3 text-xs">{error}</p> : null}
      <button type="submit" className="mt-5 min-h-12 w-full rounded-xl bg-primary px-4 font-semibold text-white hover:bg-primary/80 sm:w-auto">
        Tạo tài khoản
      </button>
    </form>
  );
}
