"use client";

import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { login, loginErrorCopy } from "@/lib/auth";

const DEMO_PASSWORD = "BeYouDemo!2026";
const demoAccounts = [
  { label: "Học sinh", email: "student.demo@beyou.local" },
  { label: "Giáo viên", email: "teacher.demo@beyou.local" },
  { label: "Phụ huynh", email: "parent.demo@beyou.local" },
  { label: "Quản trị", email: "admin.demo@beyou.local" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedEmail = String(formData.get("email") ?? "").trim();
    const submittedPassword = String(formData.get("password") ?? "");
    if (!submittedEmail || !submittedPassword) {
      event.currentTarget.reportValidity();
      return;
    }
    if (!canSubmit) {
      return;
    }
    setIsSubmitting(true);
    setError("");
    setEmail(submittedEmail);
    setPassword(submittedPassword);
    try {
      const user = await login(submittedEmail, submittedPassword);
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

        <div className="mt-6 rounded-2xl border border-[#CFE8E1] bg-white p-4">
          <p className="text-label font-semibold text-[#27665B]">Tài khoản demo</p>
          <p className="mt-1 text-label">Chọn một vai trò để BeYou tự điền email và mật khẩu demo.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                  setError("");
                }}
                className="min-h-11 rounded-2xl border border-[#CFE8E1] px-3 text-left text-label font-semibold text-[#27665B] hover:bg-secondary"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-label font-semibold" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
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
              required
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
