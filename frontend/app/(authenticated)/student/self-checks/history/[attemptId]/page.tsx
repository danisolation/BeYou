"use client";

import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { getSelfCheckAttemptDetail, type SelfCheckAttemptDetail } from "@/lib/wellbeing-api";

type PageProps = {
  params: { attemptId: string } | Promise<{ attemptId: string }>;
};

export default function SelfCheckHistoryDetailPage({ params }: PageProps) {
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
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể quay lại lịch sử rồi mở lại bản ghi." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      <header className="rounded-3xl bg-secondary p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-display">{attempt.test_title}</h1>
          {attempt.is_demo ? <DemoBadge /> : null}
        </div>
        <p className="mt-3 text-body">Nội dung này là bản ghi tại thời điểm em hoàn thành bài tự kiểm tra.</p>
        <p className="mt-3 text-label">
          Câu trả lời chi tiết là riêng tư với em theo mặc định. Người lớn được liên kết chỉ xem phần tóm tắt cần thiết để hỗ trợ em.
        </p>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-heading">{attempt.supportive_headline}</h2>
        <p className="mt-3 text-body">{attempt.state_label}</p>
        <p className="mt-4 text-label">Điểm tham khảo: {attempt.score}</p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-heading">Câu trả lời của em</h2>
        <div className="mt-4 space-y-4">
          {attempt.answers.map((answer) => (
            <article key={`${answer.question_id ?? answer.sort_order}-${answer.choice_id ?? answer.choice_text_snapshot}`} className="rounded-2xl border border-[#CFE8E1] p-4">
              <p className="text-body">{answer.question_text_snapshot}</p>
              <p className="mt-2 text-label">{answer.choice_text_snapshot}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
