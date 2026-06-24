"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { AuthUser } from "@/lib/auth";
import { GraduationCap, Users, Heart, Leaf, ArrowRight, Loader2 } from "lucide-react";

const roles = [
  {
    value: "student",
    label: "Học sinh",
    description: "Tôi muốn được hỗ trợ sức khỏe tinh thần và phát triển bản thân.",
    icon: GraduationCap,
    gradient: "from-violet-500 to-indigo-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    selectedBorder: "border-violet-500",
    selectedBg: "bg-violet-50 dark:bg-violet-900/40",
    iconBg: "bg-violet-100 dark:bg-violet-900/60",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    value: "teacher",
    label: "Giáo viên / Tư vấn viên",
    description: "Tôi hỗ trợ và theo dõi sức khỏe tinh thần của học sinh.",
    icon: Users,
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    selectedBorder: "border-emerald-500",
    selectedBg: "bg-emerald-50 dark:bg-emerald-900/40",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    value: "parent",
    label: "Phụ huynh",
    description: "Tôi muốn theo dõi và đồng hành cùng con trong hành trình phát triển.",
    icon: Heart,
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
    selectedBorder: "border-rose-500",
    selectedBg: "bg-rose-50 dark:bg-rose-900/40",
    iconBg: "bg-rose-100 dark:bg-rose-900/60",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
];

export default function ChooseRolePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const user = await apiFetch<AuthUser>("/api/auth/me/role", {
        method: "PATCH",
        body: JSON.stringify({ role: selected }),
      });
      // After role is set, go to their dashboard
      if (selected === "student" && user.privacy_acknowledgement_required) {
        router.push(`/privacy?next=${encodeURIComponent(user.dashboard_route)}`);
      } else {
        router.push(user.dashboard_route);
      }
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 dark:from-[#0a0f1e] dark:via-[#0d1530] dark:to-[#0f1a2e] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
          <Leaf className="h-7 w-7 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Bạn là ai trong cộng đồng?
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Chọn vai trò để Peerlight AI có thể hỗ trợ bạn tốt nhất.
          </p>
        </div>
      </div>

      {/* Role cards */}
      <div className="w-full max-w-lg space-y-3">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selected === role.value;
          return (
            <button
              key={role.value}
              id={`role-${role.value}`}
              type="button"
              onClick={() => setSelected(role.value)}
              className={`
                group w-full rounded-2xl border-2 p-5 text-left transition-all duration-200
                ${isSelected
                  ? `${role.selectedBorder} ${role.selectedBg} shadow-md`
                  : `${role.border} bg-white/80 dark:bg-white/5 hover:${role.selectedBg} hover:${role.selectedBorder} hover:shadow-sm`
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${role.iconBg} transition-colors`}>
                  <Icon className={`h-6 w-6 ${role.iconColor}`} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold text-slate-900 dark:text-white ${isSelected ? "text-base" : "text-sm"} transition-all`}>
                    {role.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {role.description}
                  </p>
                </div>
                {/* Check indicator */}
                <div className={`
                  ml-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200
                  ${isSelected
                    ? `${role.selectedBorder} bg-gradient-to-br ${role.gradient}`
                    : "border-slate-200 dark:border-slate-700"
                  }
                `}>
                  {isSelected && (
                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Confirm button */}
      <button
        id="confirm-role-btn"
        type="button"
        disabled={!selected || isSubmitting}
        onClick={handleConfirm}
        className="mt-6 flex w-full max-w-lg items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          <>
            Tiếp tục
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>

      <p className="mt-6 text-xs text-slate-400 dark:text-slate-600">
        Bạn có thể thay đổi thông tin này sau trong phần cài đặt tài khoản.
      </p>
    </main>
  );
}
