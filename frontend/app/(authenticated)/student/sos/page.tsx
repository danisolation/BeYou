"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle, ShieldAlert } from "lucide-react";

import { createStudentSosAlert } from "@/lib/sos-api";

type SosState = "initial" | "loading" | "activated" | "error";

export default function StudentSosPage() {
  const [state, setState] = useState<SosState>("initial");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleActivateSos() {
    setState("loading");
    setErrorMessage(null);
    try {
      await createStudentSosAlert({
        severity: "urgent",
        source: "student_dashboard",
        note: null,
      });
      setState("activated");
    } catch {
      setErrorMessage("Chưa gửi được SOS. Hãy thử lại hoặc nói trực tiếp với người lớn gần em.");
      setState("error");
    }
  }

  // State 2: Activated overlay
  if (state === "activated") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-error-container/95 p-6" role="alert" aria-live="assertive">
        <div className="max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-[#1a2940]">
            <CheckCircle size={48} className="text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold text-on-error-container">SOS đã được gửi</h1>
          <p className="text-sm text-on-error-container">
            Người lớn tin tưởng của em đã được thông báo. Họ sẽ liên hệ sớm nhất có thể.
          </p>
          <p className="text-xs text-on-error-container/80">
            Em không cần làm gì thêm. Hãy ở nơi an toàn và chờ người lớn liên hệ.
          </p>
          <Link
            href="/student"
            className="inline-flex min-h-11 items-center rounded-2xl bg-primary px-6 font-semibold text-on-primary no-underline"
          >
            Quay về trang chính
          </Link>
        </div>
      </div>
    );
  }

  // State 1: Initial confirmation
  return (
    <section className="mx-auto max-w-lg space-y-6 py-8">
      <div className="rounded-2xl border border-outline-variant bg-white dark:bg-[#1a2940] p-6 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-container">
          <ShieldAlert size={32} className="text-error" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">Hỗ trợ khẩn cấp</h1>
        <p className="mt-3 text-sm">
          Nếu em đang gặp nguy hiểm hoặc cần giúp đỡ ngay lập tức, hãy nhấn nút bên dưới.
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-white dark:bg-[#1a2940] p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Khi em nhấn SOS:</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>• Người lớn tin tưởng của em sẽ được thông báo ngay lập tức</li>
          <li>• Họ sẽ nhận được tín hiệu rằng em cần hỗ trợ khẩn cấp</li>
          <li>• Em không cần giải thích gì thêm nếu chưa sẵn sàng</li>
          <li>• Thông tin cá nhân của em được bảo mật</li>
        </ul>
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-2xl bg-error-container p-4 text-sm text-error">
          {errorMessage}
        </p>
      )}

      <div className="space-y-4 text-center">
        <button
          type="button"
          onClick={() => void handleActivateSos()}
          disabled={state === "loading"}
          className="min-h-14 w-full rounded-2xl bg-error px-6 text-lg font-bold text-on-error shadow-md hover:bg-error/90 disabled:opacity-60"
        >
          {state === "loading" ? "Đang gửi..." : "Đúng, tôi cần giúp ngay"}
        </button>
        <Link
          href="/student"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary no-underline hover:underline"
        >
          ← Quay lại
        </Link>
      </div>
    </section>
  );
}
