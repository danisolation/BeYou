"use client";

import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { login, loginErrorCopy } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const user = await login(email, password);
      if (user.role === "student" && user.privacy_acknowledgement_required) {
        router.push(`/privacy?next=${encodeURIComponent(user.dashboard_route)}`);
        return;
      }
      router.push(user.dashboard_route);
    } catch (loginError) {
      setError(loginErrorCopy(loginError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-md rounded-3xl bg-secondary p-6 shadow-sm">
        <p className="mb-2 text-label font-semibold text-accent">BeYou</p>
        <h1 className="text-display">Chào mừng đến với BeYou</h1>
        <p className="mt-3 text-body">
          Đăng nhập để vào không gian hỗ trợ phù hợp với vai trò của bạn.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-label font-semibold" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] bg-white px-4 outline-accent"
          />

          <label className="block text-label font-semibold" htmlFor="password">
            Mật khẩu
          </label>
          <div className="flex min-h-11 items-center rounded-2xl border border-[#CFE8E1] bg-white">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 flex-1 rounded-2xl px-4 outline-accent"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPassword((current) => !current)}
              className="min-h-11 min-w-11 text-[#27665B]"
            >
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-warning/30 bg-white px-4 py-3 text-label text-[#6B4A00]">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="min-h-11 w-full rounded-2xl bg-accent px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Đăng nhập
          </button>
        </form>
      </section>
    </main>
  );
}
