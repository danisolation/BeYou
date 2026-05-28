"use client";

import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { getSelfCheckAttemptDetail, type SelfCheckAttemptDetail } from "@/lib/wellbeing-api";

type PageProps = {
  params: { attemptId: string } | Promise<{ attemptId: string }>;
};

function displayRiskLabel(label: string) {
  if (label === "On dinh") return "Bình thường";
  if (label === "Can chu y" || label === "Nen tim ho tro") return "Cần quan tâm";
  if (label === "Can ho tro som") return "Nguy cơ cao";
  return label;
}

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
      <header className="rounded-2xl border border-outline-variant/30 bg-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">{attempt.test_title}</h1>
          {attempt.is_demo ? <DemoBadge /> : null}
        </div>
        <p className="mt-3 text-sm">Nội dung này là bản ghi tại thời điểm em hoàn thành test tâm lý.</p>
        <p className="mt-3 text-xs">
          Câu trả lời chi tiết là riêng tư với em theo mặc định. Người lớn được liên kết chỉ xem phần tóm tắt cần thiết để hỗ trợ em.
        </p>
      </header>

      <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
        <h2 className="text-sm font-semibold">{attempt.supportive_headline}</h2>
        <p className="mt-3 text-sm">{displayRiskLabel(attempt.state_label)}</p>
        <p className="mt-4 text-xs">Điểm tham khảo: {attempt.score}</p>
      </section>

      <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
        <h2 className="text-sm font-semibold">Câu trả lời của em</h2>
        <div className="mt-4 space-y-4">
          {attempt.answers.map((answer) => (
            <article key={`${answer.question_id ?? answer.sort_order}-${answer.choice_id ?? answer.choice_text_snapshot}`} className="rounded-2xl border border-outline-variant/30 p-4">
              <p className="text-sm">{answer.question_text_snapshot}</p>
              <p className="mt-2 text-xs">{answer.choice_text_snapshot}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
