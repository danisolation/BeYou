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
    <form className="rounded-3xl bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <h2 className="text-heading">Tạo tài khoản</h2>
      <p className="mt-2 text-label">
        Tài khoản demo chỉ dùng để giới thiệu sản phẩm, không phải hồ sơ học sinh thật.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-label font-semibold">
          Họ tên
          <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3" />
        </label>
        <label className="space-y-2 text-label font-semibold">
          Email
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3" />
        </label>
        <label className="space-y-2 text-label font-semibold">
          Mật khẩu
          <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3" />
        </label>
        <label className="space-y-2 text-label font-semibold">
          Vai trò
          <select value={role} onChange={(event) => setRole(event.target.value as AdminUserCreate["role"])} className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3">
            {roleOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-label font-semibold">
          Trạng thái tài khoản
          <select value={status} onChange={(event) => setStatus(event.target.value as AdminUserCreate["status"])} className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3">
            {statusOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-label font-semibold">
          Trường
          <input value={school} onChange={(event) => setSchool(event.target.value)} className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3" />
        </label>
        <label className="space-y-2 text-label font-semibold">
          Lớp
          <input value={className} onChange={(event) => setClassName(event.target.value)} className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3" />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-label font-semibold">
          <input type="checkbox" checked={isDemo} onChange={(event) => setIsDemo(event.target.checked)} className="min-h-5 min-w-5 accent-[#2CA58D]" />
          Demo
        </label>
      </div>
      {error ? <p className="mt-4 rounded-2xl border border-warning/40 px-4 py-3 text-label">{error}</p> : null}
      <button type="submit" className="mt-5 min-h-11 rounded-2xl bg-accent px-4 font-semibold text-white">
        Tạo tài khoản
      </button>
    </form>
  );
}
