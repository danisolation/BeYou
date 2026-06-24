"use client";

import { Eye, EyeOff, Heart, Leaf, LogIn, Sunrise } from "lucide-react";
import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  AuthCapabilities,
  getAuthCapabilities,
  googleLoginStartUrl,
  login,
  loginErrorCopy,
} from "@/lib/auth";
import { demoAccounts, DEMO_PASSWORD } from "@/lib/demo-accounts";
import { isInAppBrowser } from "@/lib/browser";

const DEMO_DISABLED_COPY =
  "Tài khoản truy cập nhanh hiện không khả dụng. Hãy đăng nhập bằng tài khoản em được cấp.";
const PROVIDER_DISABLED_COPY = "Đăng nhập bên ngoài chưa được kích hoạt.";
const CAPABILITIES_UNAVAILABLE_COPY = "Chưa xác minh được cấu hình. Hãy đăng nhập bằng email và mật khẩu được cấp.";
const GOOGLE_LOGIN_ERROR_COPY =
  "Không thể đăng nhập bằng Google. Hãy dùng tài khoản đã được nhà trường cấp quyền hoặc đăng nhập bằng email/mật khẩu.";

const brandingCards = [
  {
    icon: Leaf,
    title: "Góc nhỏ bình yên",
    description: "Không gian an toàn để em là chính mình, không phán xét, không áp lực.",
  },
  {
    icon: Heart,
    title: "Lắng nghe từng cảm xúc",
    description: "Mỗi cảm xúc đều có giá trị — Peerlight AI lắng nghe và đồng hành cùng em.",
  },
  {
    icon: Sunrise,
    title: "Bắt đầu từ bước nhỏ",
    description: "Em không cần hoàn hảo — chỉ cần bắt đầu, và em không đi một mình.",
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capabilities, setCapabilities] = useState<AuthCapabilities | null>(null);
  const [capabilitiesLoaded, setCapabilitiesLoaded] = useState(false);
  const canSubmit = !isSubmitting;
  const publicDemoEntryEnabled = capabilities?.public_demo_entry_enabled === true;
  const providerLoginEnabled = capabilities?.provider_login_enabled === true;
  const providerLabel = capabilities?.provider_label ?? "Google";

  useEffect(() => {
    let cancelled = false;

    getAuthCapabilities()
      .then((metadata) => {
        if (!cancelled) {
          setCapabilities(metadata);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCapabilities(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCapabilitiesLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError?.startsWith("google_")) {
      setError(GOOGLE_LOGIN_ERROR_COPY);
    }
  }, [searchParams]);

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
    <main className="min-h-dvh bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3 rounded-2xl bg-white/85 px-5 py-4 shadow-sm ring-1 ring-outline-variant/40 backdrop-blur dark:bg-[#0f1530]/85 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold font-bold text-primary no-underline">
            <Leaf className="h-5 w-5" aria-hidden="true" />
            Peerlight AI
          </Link>
          <Link href="/" className="font-semibold text-on-background no-underline hover:text-primary">
            Trang chủ
          </Link>
        </header>

        {/* Main content — split layout */}
        <div className="flex min-h-[calc(100dvh-8rem)] items-center">
          <section className="grid w-full gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            {/* Left: Login form */}
            <div className="order-1 rounded-2xl bg-white dark:bg-[#1a2244] p-5 shadow-xl shadow-primary/5 ring-1 ring-outline-variant/30 sm:p-8">
              <h1 className="text-2xl text-on-background">Đăng nhập</h1>
              <p className="mt-2 text-sm text-on-background/70">
                Chào mừng em quay lại! Đăng nhập để tiếp tục nhé.
              </p>

              {/* Login form — shown immediately */}
              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-semibold text-on-background" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    aria-required="true"
                    aria-describedby={error ? "login-error" : undefined}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 min-h-12 w-full rounded-xl border border-outline-variant/40 bg-white px-4 outline-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-background" htmlFor="password">
                    Mật khẩu
                  </label>
                  <div className="mt-2 flex min-h-12 items-center rounded-xl border border-outline-variant/40 bg-white">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      aria-required="true"
                      aria-describedby={error ? "login-error" : undefined}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="min-h-12 min-w-0 flex-1 rounded-xl px-4 outline-primary"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      onClick={() => setShowPassword((current) => !current)}
                      className="btn-press min-h-12 min-w-12 text-primary"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {error ? (
                  <div id="login-error" role="alert" className="rounded-xl border border-error/30 bg-error-container px-4 py-3 text-xs text-error">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn-press min-h-12 w-full rounded-xl bg-primary px-4 font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-on-background/60">
                Chưa có tài khoản?{" "}
                <Link href="/register" className="font-semibold text-primary no-underline hover:underline">
                  Đăng ký ngay
                </Link>
              </p>

              {capabilitiesLoaded && providerLoginEnabled ? (
                <div className="mt-5">
                  <div className="flex items-center gap-3" aria-hidden="true">
                    <div className="h-px flex-1 bg-outline-variant/50" />
                    <span className="text-xs font-semibold text-on-background/50">hoặc</span>
                    <div className="h-px flex-1 bg-outline-variant/50" />
                  </div>
                  <a
                    href={googleLoginStartUrl("/")}
                    onClick={(e) => {
                      if (isInAppBrowser()) {
                        e.preventDefault();
                        setError("Vui lòng mở trang web bằng trình duyệt ngoài (Safari, Chrome) bằng cách chọn 'Mở bằng trình duyệt' ở góc phải màn hình để đăng nhập bằng Google.");
                      }
                    }}
                    className="btn-press mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/50 bg-white px-4 text-sm font-semibold text-on-background no-underline shadow-sm transition-colors hover:border-primary hover:text-primary dark:bg-[#1e2d40]"
                  >
                    <LogIn className="h-5 w-5" aria-hidden="true" />
                    Đăng nhập với {providerLabel}
                  </a>
                </div>
              ) : null}

              {/* Demo accounts — loads async below form */}
              <div className="mt-6 rounded-2xl border border-outline-variant/40 bg-white dark:bg-[#1e2d40] p-4">
                <p className="text-xs font-semibold text-primary">Đăng nhập thử</p>
                {!capabilitiesLoaded ? (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-on-background/50">Đang kết nối...</p>
                  </div>
                ) : publicDemoEntryEnabled ? (
                  <>
                    <p className="mt-1 text-xs text-on-background/60">Chọn vai trò để vào nhanh.</p>
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
                          className="btn-press min-h-11 rounded-xl border border-outline-variant/40 bg-white px-3 text-left text-xs font-semibold text-primary transition-transform hover:-translate-y-0.5 hover:border-primary hover:shadow-sm"
                        >
                          {account.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-3 space-y-2 rounded-xl border border-warning/30 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
                    <p>{capabilities ? DEMO_DISABLED_COPY : CAPABILITIES_UNAVAILABLE_COPY}</p>
                    {capabilities?.provider_login_enabled === false ? <p>{PROVIDER_DISABLED_COPY}</p> : null}
                  </div>
                )}
              </div>
            </div>

            {/* Right: 3 Branding cards */}
            <div className="order-2 hidden flex-col gap-4 md:flex">
              {brandingCards.map((card) => (
                <div
                  key={card.title}
                  className="card-lift rounded-2xl bg-white p-6 ring-1 ring-outline-variant/20 transition-shadow hover:shadow-md dark:bg-[#1e2d40]"
                >
                  <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3 text-primary">
                    <card.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg text-on-background">{card.title}</h3>
                  <p className="mt-2 text-sm text-on-background/70">{card.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-dvh items-center justify-center text-sm text-on-background/50">Đang tải...</div>}>
      <LoginContent />
    </Suspense>
  );
}
