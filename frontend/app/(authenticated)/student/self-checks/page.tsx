"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brain, Clock } from "lucide-react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/skeletons";
import { StitchCard } from "@/components/stitch-card";
import { listSelfChecks, listSelfCheckHistory, type SelfCheckListItem, type SelfCheckHistoryItem } from "@/lib/wellbeing-api";

function questionCount(test: SelfCheckListItem) {
  const maybeWithCount = test as SelfCheckListItem & { question_count?: number; questions?: unknown[] };
  return maybeWithCount.question_count ?? maybeWithCount.questions?.length ?? 0;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function displayRiskLabel(label: string) {
  if (label === "On dinh") return "Bình thường";
  if (label === "Can chu y" || label === "Nen tim ho tro") return "Cần quan tâm";
  if (label === "Can ho tro som") return "Nguy cơ cao";
  return label;
}

export default function SelfCheckListPage() {
  const [tests, setTests] = useState<SelfCheckListItem[]>([]);
  const [history, setHistory] = useState<SelfCheckHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    Promise.all([listSelfChecks(), listSelfCheckHistory()])
      .then(([items, historyResponse]) => {
        setTests(items);
        setHistory(historyResponse.items);
        setHasError(false);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (hasError) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể quay lại trang chính rồi mở lại test tâm lý." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      {/* Header */}
      <header className="rounded-2xl bg-white dark:bg-[#1a2940] border border-outline-variant/30 p-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3 text-primary">
            <Brain className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-on-background">Test tâm lý</h1>
        </div>
        <p className="mt-3 text-sm text-on-background/70">
          Chọn một bài ngắn để hiểu trạng thái hiện tại của em. Kết quả không phải chẩn đoán.
        </p>
      </header>

      {/* Available tests */}
      {tests.length === 0 ? (
        <EmptyState
          heading="Chưa có test tâm lý đang mở"
          body="Khi nhà trường bật nội dung phù hợp, em sẽ thấy các bài test tại đây."
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {tests.map((test) => (
            <StitchCard
              key={test.id}
              icon={<Brain className="h-5 w-5" />}
              title={test.title}
              description={test.description ?? `${questionCount(test)} câu hỏi`}
              ctaLabel="Bắt đầu"
              ctaHref={`/student/self-checks/${test.id}`}
              className={test.is_demo ? "relative" : undefined}
            />
          ))}
        </section>
      )}

      {/* History section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-on-background">Lịch sử test tâm lý</h2>
        </div>

        {history.length === 0 ? (
          <p className="rounded-2xl bg-white dark:bg-[#1e2d40] border border-outline-variant/20 p-4 text-sm text-on-background/70">
            Sau khi hoàn thành một bài, kết quả và gợi ý của em sẽ xuất hiện ở đây.
          </p>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 5).map((item) => (
              <Link
                key={item.attempt_id}
                className="block rounded-2xl border border-outline-variant/20 bg-white dark:bg-[#1e2d40] p-4 transition-shadow hover:shadow-md"
                href={`/student/self-checks/history/${item.attempt_id}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-on-background">{item.test_title}</h3>
                  {item.is_demo ? <DemoBadge /> : null}
                </div>
                <p className="mt-1 text-sm text-on-background/60">{formatDate(item.completed_at)}</p>
                <p className="mt-2 text-sm text-on-background/80">{displayRiskLabel(item.state_label)}</p>
                {item.supportive_headline ? (
                  <p className="mt-1 text-sm text-on-background/70">{item.supportive_headline}</p>
                ) : null}
              </Link>
            ))}
            {history.length > 5 ? (
              <Link
                href="/student/self-checks/history"
                className="inline-flex items-center gap-1 px-1 font-semibold text-primary"
              >
                Xem tất cả lịch sử ({history.length} lần)
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
