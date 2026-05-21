"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { getSelfCheckAttemptDetail, type SelfCheckAttemptDetail } from "@/lib/wellbeing-api";

type PageProps = {
  params: { attemptId: string } | Promise<{ attemptId: string }>;
};

export default function SelfCheckResultPage({ params }: PageProps) {
  const [attempt, setAttempt] = useState<SelfCheckAttemptDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    Promise.resolve(params)
      .then(({ attemptId }) => getSelfCheckAttemptDetail(attemptId))
      .then((detail) => {
        setAttempt(detail);
        setHasError(false);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [params]);

  if (isLoading) {
    return <p>Đang tải thông tin...</p>;
  }

  if (hasError || attempt === null) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể mở lại lịch sử tự kiểm tra để xem kết quả." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-label">{attempt.test_title}</p>
          {attempt.is_demo ? <DemoBadge /> : null}
        </div>
        <h1 className="mt-3 text-display">{attempt.supportive_headline}</h1>
        <p className="mt-4 inline-flex min-h-11 items-center rounded-full bg-secondary px-4 text-heading">{attempt.state_label}</p>
        {attempt.suggested_next_action ? <p className="mt-4 text-body">{attempt.suggested_next_action}</p> : null}
        <div className="mt-6 space-y-3 text-body">
          {attempt.short_comment ? <p>{attempt.short_comment}</p> : null}
          {attempt.advice_summary ? <p>{attempt.advice_summary}</p> : null}
          {attempt.support_suggestion ? <p>{attempt.support_suggestion}</p> : null}
          {attempt.positive_content ? <p>{attempt.positive_content}</p> : null}
        </div>
        <div className="mt-6 rounded-2xl bg-secondary p-4">
          <p className="text-label">Điểm tham khảo: {attempt.score}</p>
          <p className="mt-2 text-label">Điểm này chỉ giúp BeYou chọn gợi ý phù hợp, không phải chẩn đoán.</p>
        </div>
      </section>
      <nav className="flex flex-wrap gap-3">
        <Link className="inline-flex min-h-11 items-center rounded-2xl bg-accent px-4 font-semibold text-white" href="/student/scenarios">
          Xem gợi ý tiếp theo
        </Link>
        <Link className="inline-flex min-h-11 items-center rounded-2xl border border-[#CFE8E1] px-4 font-semibold" href="/student/self-checks/history">
          Xem lịch sử tự kiểm tra
        </Link>
      </nav>
    </main>
  );
}
