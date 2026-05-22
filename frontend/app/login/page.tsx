"use client";

import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { login, loginErrorCopy } from "@/lib/auth";
import { demoAccounts, DEMO_PASSWORD } from "@/lib/demo-accounts";

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
    <main className="min-h-dvh px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl items-center">
        <section className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="rounded-[2rem] bg-white/75 p-6 shadow-sm ring-1 ring-[#D7EFE8] backdrop-blur sm:p-8 lg:p-10">
            <p className="text-label font-semibold uppercase tracking-[0.22em] text-accent">BeYou</p>
            <h1 className="mt-3 max-w-xl text-display">Chào mừng đến với BeYou</h1>
            <p className="mt-4 max-w-2xl text-body">
              Đăng nhập để vào không gian hỗ trợ phù hợp với vai trò của bạn.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Riêng tư trước", "Hỗ trợ đúng vai trò", "Dữ liệu demo rõ ràng"].map((item) => (
                <div key={item} className="rounded-2xl bg-secondary px-4 py-3 text-label font-semibold text-[#12332E]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <section className="rounded-[2rem] bg-white p-5 shadow-xl shadow-[#12332E]/10 ring-1 ring-[#D7EFE8] sm:p-6 lg:p-8">
            <div className="rounded-3xl border border-[#CFE8E1] bg-secondary p-4">
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
                    className="min-h-11 rounded-2xl border border-[#CFE8E1] bg-white px-3 text-left text-label font-semibold text-[#27665B] hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <div>
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
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#CFE8E1] bg-white px-4 outline-accent"
                />
              </div>

              <div>
                <label className="block text-label font-semibold" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="mt-2 flex min-h-12 items-center rounded-2xl border border-[#CFE8E1] bg-white">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="min-h-12 min-w-0 flex-1 rounded-2xl px-4 outline-accent"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword((current) => !current)}
                    className="min-h-12 min-w-12 text-[#27665B]"
                  >
                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {error ? (
                <div role="alert" className="rounded-2xl border border-warning/30 bg-[#FFF8E8] px-4 py-3 text-label text-[#6B4A00]">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className="min-h-12 w-full rounded-2xl bg-accent px-4 font-semibold text-white shadow-sm hover:bg-[#238C78] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Đăng nhập
              </button>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
