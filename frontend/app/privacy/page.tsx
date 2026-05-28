"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { acknowledgePrivacy } from "@/lib/auth";

export default function PrivacyPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background px-4 py-10">Đang tải...</main>}>
      <PrivacyContent />
    </Suspense>
  );
}

function PrivacyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRoute = searchParams.get("next") ?? "/student";
  const reviewOnly = searchParams.get("review") === "true";
  const [checked, setChecked] = useState(reviewOnly);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleContinue() {
    if (!reviewOnly && !checked) {
      return;
    }
    setIsSubmitting(true);
    try {
      if (!reviewOnly) {
        await acknowledgePrivacy();
      }
      router.push(nextRoute);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh px-4 py-8 sm:px-6 sm:py-10">
      <section className="mx-auto max-w-3xl rounded-2xl bg-primary/5 p-5 shadow-sm sm:p-6 lg:p-8">
        <p className="text-xs font-semibold text-primary">Quyền riêng tư</p>
        <h1 className="mt-2 text-2xl font-bold">Ai có thể xem thông tin của em?</h1>
        <p className="mt-4 text-sm">
          Thông tin của em được giữ riêng tư trong Peerlight AI. Một số người lớn tin tưởng chỉ xem
          phần tóm tắt cần thiết để hỗ trợ em, không xem mọi câu trả lời riêng tư.
        </p>

        <div className="mt-6 space-y-5 rounded-2xl bg-white p-4 sm:p-5">
          <section>
            <h2 className="text-sm font-semibold">Ai thấy gì?</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              <li>Em xem được thông tin của chính mình.</li>
              <li>Giáo viên hoặc phụ huynh được liên kết chỉ xem phần tóm tắt cần thiết.</li>
              <li>Câu trả lời tự kiểm tra chi tiết và nội dung trò chuyện riêng tư không được hiển thị cho người lớn theo mặc định.</li>
              <li>Quản trị viên chỉ dùng thông tin trong phạm vi vận hành an toàn, phân quyền, và kiểm tra hệ thống.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold">Khi nào cần báo người lớn?</h2>
            <p className="mt-3 text-sm">
              Nếu có dấu hiệu em có thể không an toàn, Peerlight AI có thể cần báo cho người lớn tin tưởng
              để giúp em kịp thời. Peerlight AI không hứa giữ bí mật tuyệt đối trong tình huống có nguy cơ an toàn.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold">Dữ liệu của em được bảo vệ thế nào?</h2>
            <p className="mt-3 text-sm">
              Mọi dữ liệu cá nhân được mã hóa và lưu trữ an toàn. Chỉ những người được ủy quyền mới có thể truy cập thông tin hỗ trợ khi cần thiết.
            </p>
          </section>
        </div>

        <label className="mt-6 flex items-start gap-3 rounded-2xl bg-white p-4 text-sm">
          <input
            type="checkbox"
            checked={checked}
            disabled={reviewOnly}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-1 min-h-5 min-w-5 accent-primary"
          />
          <span>Em đã đọc và hiểu ai có thể xem thông tin của em.</span>
        </label>

        <button
          type="button"
          disabled={!checked || isSubmitting}
          onClick={handleContinue}
          className="mt-6 min-h-12 w-full rounded-2xl bg-primary px-4 font-semibold text-white hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Tiếp tục vào Peerlight AI
        </button>
      </section>
    </main>
  );
}
