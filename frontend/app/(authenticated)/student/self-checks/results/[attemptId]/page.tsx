"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

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
    return <p className="p-6 text-sm text-on-background/70">Đang tải thông tin...</p>;
  }

  if (hasError || attempt === null) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể mở lại lịch sử test tâm lý để xem kết quả." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/student/self-checks"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-on-background/60">{attempt.test_title}</p>
          {attempt.is_demo ? <DemoBadge /> : null}
        </div>
        <h1 className="mt-3 text-lg font-semibold text-on-background">{attempt.supportive_headline}</h1>
        <p className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary/10 px-4 text-sm font-semibold text-primary">
          {displayRiskLabel(attempt.state_label)}
        </p>
        {attempt.suggested_next_action ? (
          <p className="mt-4 text-sm text-on-background/80">{attempt.suggested_next_action}</p>
        ) : null}
        <div className="mt-6 space-y-3 text-sm text-on-background/80">
          {attempt.short_comment ? <p>{attempt.short_comment}</p> : null}
          {attempt.advice_summary ? <p>{attempt.advice_summary}</p> : null}
          {attempt.support_suggestion ? <p>{attempt.support_suggestion}</p> : null}
          {attempt.positive_content ? <p>{attempt.positive_content}</p> : null}
        </div>
        <div className="mt-6 rounded-xl bg-white dark:bg-[#1a2940] p-4">
          <p className="text-sm text-on-background/70">Điểm tham khảo: {attempt.score}</p>
          <p className="mt-2 text-sm text-on-background/60">Điểm này chỉ giúp Peerlight AI chọn gợi ý phù hợp, không phải chẩn đoán.</p>
        </div>
      </section>

      <nav className="flex flex-wrap gap-3">
        <Link
          className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary"
          href="/student/self-checks"
        >
          Quay lại danh sách
        </Link>
        <Link
          className="inline-flex min-h-11 items-center rounded-xl border border-outline-variant px-5 py-3 font-semibold text-on-background"
          href="/student/scenarios"
        >
          Xem tình huống xử lý thực tế
        </Link>
      </nav>
    </main>
  );
}
