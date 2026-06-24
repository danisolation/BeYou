"use client";

import { Leaf, LogIn, ArrowLeft, GraduationCap, BookOpen, Users, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { register, registerErrorCopy, googleLoginStartUrl, AuthCapabilities, getAuthCapabilities } from "@/lib/auth";
import { useEffect } from "react";

type Role = "student" | "teacher" | "parent";

const ROLES: { value: Role; label: string; description: string; icon: typeof GraduationCap }[] = [
  {
    value: "student",
    label: "Học sinh",
    description: "Tôi là học sinh muốn được hỗ trợ cảm xúc và tâm lý.",
    icon: GraduationCap,
  },
  {
    value: "teacher",
    label: "Giáo viên",
    description: "Tôi là giáo viên muốn đồng hành và theo dõi học sinh.",
    icon: BookOpen,
  },
  {
    value: "parent",
    label: "Phụ huynh",
    description: "Tôi là phụ huynh muốn kết nối và hỗ trợ con em.",
    icon: Users,
  },
];

function RegisterContent() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "form">("role");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capabilities, setCapabilities] = useState<AuthCapabilities | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [className, setClassName] = useState("");

  useEffect(() => {
    getAuthCapabilities()
      .then(setCapabilities)
      .catch(() => {});
  }, []);

  function handleRoleSelect(role: Role) {
    setSelectedRole(role);
    setStep("form");
    setError("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedRole || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const user = await register({
        email,
        password,
        full_name: fullName,
        role: selectedRole,
        school: school || undefined,
        class_name: className || undefined,
      });
      if (user.role === "student" && user.privacy_acknowledgement_required) {
        router.push(`/privacy?next=${encodeURIComponent(user.dashboard_route)}`);
        return;
      }
      router.push(user.dashboard_route);
    } catch (err) {
      setError(registerErrorCopy(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const providerLoginEnabled = capabilities?.provider_login_enabled === true;
  const providerLabel = capabilities?.provider_label ?? "Google";

  return (
    <main className="min-h-dvh bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3 rounded-2xl bg-white/85 px-5 py-4 shadow-sm ring-1 ring-outline-variant/40 backdrop-blur dark:bg-[#0f1530]/85 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold font-bold text-primary no-underline">
            <Leaf className="h-5 w-5" aria-hidden="true" />
            Peerlight AI
          </Link>
          <Link href="/login" className="font-semibold text-on-background no-underline hover:text-primary">
            Đăng nhập
          </Link>
        </header>

        <div className="flex min-h-[calc(100dvh-8rem)] items-center">
          <section className="grid w-full gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            {/* Left: Form */}
            <div className="order-1 rounded-2xl bg-white dark:bg-[#1a2244] p-5 shadow-xl shadow-primary/5 ring-1 ring-outline-variant/30 sm:p-8">

              {/* Step 1: Chọn vai trò */}
              {step === "role" && (
                <>
                  <h1 className="text-2xl text-on-background">Bạn là ai?</h1>
                  <p className="mt-2 text-sm text-on-background/70">
                    Chọn vai trò để mình tạo tài khoản phù hợp cho bạn nhé.
                  </p>
                  <div className="mt-6 space-y-3">
                    {ROLES.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => handleRoleSelect(role.value)}
                        className="btn-press w-full rounded-2xl border border-outline-variant/40 bg-white dark:bg-[#1e2d40] p-4 text-left transition-all hover:border-primary hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <div className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <role.icon className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div>
                            <p className="font-semibold text-on-background">{role.label}</p>
                            <p className="mt-0.5 text-xs text-on-background/60">{role.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {providerLoginEnabled && (
                    <div className="mt-5">
                      <div className="flex items-center gap-3" aria-hidden="true">
                        <div className="h-px flex-1 bg-outline-variant/50" />
                        <span className="text-xs font-semibold text-on-background/50">hoặc đăng ký nhanh</span>
                        <div className="h-px flex-1 bg-outline-variant/50" />
                      </div>
                      <a
                        href={googleLoginStartUrl("/")}
                        className="btn-press mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/50 bg-white px-4 text-sm font-semibold text-on-background no-underline shadow-sm transition-colors hover:border-primary hover:text-primary dark:bg-[#1e2d40]"
                      >
                        <LogIn className="h-5 w-5" aria-hidden="true" />
                        Đăng ký với {providerLabel}
                      </a>
                    </div>
                  )}

                  <p className="mt-6 text-center text-sm text-on-background/60">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="font-semibold text-primary no-underline hover:underline">
                      Đăng nhập
                    </Link>
                  </p>
                </>
              )}

              {/* Step 2: Điền form */}
              {step === "form" && selectedRole && (
                <>
                  <button
                    type="button"
                    onClick={() => { setStep("role"); setError(""); }}
                    className="btn-press mb-4 flex items-center gap-1 text-sm text-on-background/60 hover:text-primary"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </button>

                  <div className="flex items-center gap-3">
                    {(() => {
                      const role = ROLES.find((r) => r.value === selectedRole)!;
                      return (
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <role.icon className="h-5 w-5" />
                        </div>
                      );
                    })()}
                    <div>
                      <h1 className="text-xl text-on-background">
                        Đăng ký — {ROLES.find((r) => r.value === selectedRole)?.label}
                      </h1>
                      <p className="text-xs text-on-background/60">Điền thông tin để tạo tài khoản</p>
                    </div>
                  </div>

                  <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    {/* Họ và tên */}
                    <div>
                      <label className="block text-xs font-semibold text-on-background" htmlFor="full_name">
                        Họ và tên
                      </label>
                      <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        autoComplete="name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        className="mt-2 min-h-12 w-full rounded-xl border border-outline-variant/40 bg-white px-4 outline-primary dark:bg-[#0f1530]"
                      />
                    </div>

                    {/* Email */}
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="mt-2 min-h-12 w-full rounded-xl border border-outline-variant/40 bg-white px-4 outline-primary dark:bg-[#0f1530]"
                      />
                    </div>

                    {/* Mật khẩu */}
                    <div>
                      <label className="block text-xs font-semibold text-on-background" htmlFor="password">
                        Mật khẩu
                      </label>
                      <div className="mt-2 flex min-h-12 items-center rounded-xl border border-outline-variant/40 bg-white dark:bg-[#0f1530]">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          minLength={8}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Tối thiểu 8 ký tự"
                          className="min-h-12 min-w-0 flex-1 rounded-xl px-4 outline-primary bg-transparent"
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          onClick={() => setShowPassword((v) => !v)}
                          className="btn-press min-h-12 min-w-12 text-primary"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                        </button>
                      </div>
                    </div>

                    {/* Trường và lớp - chỉ hiện cho học sinh */}
                    {selectedRole === "student" && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-on-background" htmlFor="school">
                            Trường học <span className="text-error">*</span>
                          </label>
                          <input
                            id="school"
                            name="school"
                            type="text"
                            required
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                            placeholder="Ví dụ: THPT Nguyễn Du"
                            className="mt-2 min-h-12 w-full rounded-xl border border-outline-variant/40 bg-white px-4 outline-primary dark:bg-[#0f1530]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-background" htmlFor="class_name">
                            Lớp <span className="text-error">*</span>
                          </label>
                          <input
                            id="class_name"
                            name="class_name"
                            type="text"
                            required
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            placeholder="Ví dụ: 11A1"
                            className="mt-2 min-h-12 w-full rounded-xl border border-outline-variant/40 bg-white px-4 outline-primary dark:bg-[#0f1530]"
                          />
                        </div>
                      </>
                    )}

                    {/* Trường học tùy chọn cho giáo viên/phụ huynh */}
                    {(selectedRole === "teacher" || selectedRole === "parent") && (
                      <div>
                        <label className="block text-xs font-semibold text-on-background" htmlFor="school">
                          Trường học <span className="text-on-background/40">(tùy chọn)</span>
                        </label>
                        <input
                          id="school"
                          name="school"
                          type="text"
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          placeholder="Ví dụ: THPT Nguyễn Du"
                          className="mt-2 min-h-12 w-full rounded-xl border border-outline-variant/40 bg-white px-4 outline-primary dark:bg-[#0f1530]"
                        />
                      </div>
                    )}

                    {error && (
                      <div id="register-error" role="alert" className="rounded-xl border border-error/30 bg-error-container px-4 py-3 text-xs text-error">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-press min-h-12 w-full rounded-xl bg-primary px-4 font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                    </button>
                  </form>

                  <p className="mt-5 text-center text-sm text-on-background/60">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="font-semibold text-primary no-underline hover:underline">
                      Đăng nhập ngay
                    </Link>
                  </p>
                </>
              )}
            </div>

            {/* Right: Info cards */}
            <div className="order-2 hidden flex-col gap-4 md:flex">
              {[
                {
                  icon: CheckCircle2,
                  title: "Miễn phí hoàn toàn",
                  description: "Tạo tài khoản không mất phí, không cần thẻ tín dụng.",
                },
                {
                  icon: Leaf,
                  title: "Không gian an toàn",
                  description: "Dữ liệu được mã hóa, chỉ bạn mới đọc được nội dung của mình.",
                },
                {
                  icon: Users,
                  title: "Kết nối gia đình & nhà trường",
                  description: "Giáo viên và phụ huynh có thể theo dõi và hỗ trợ học sinh kịp thời.",
                },
              ].map((card) => (
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex h-dvh items-center justify-center text-sm text-on-background/50">Đang tải...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
