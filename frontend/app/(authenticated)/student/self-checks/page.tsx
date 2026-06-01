"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brain, Clock } from "lucide-react";

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

function riskBadgeStyle(label: string) {
  if (label === "On dinh") return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  if (label === "Can chu y") return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  if (label === "Nen tim ho tro") return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300";
  if (label === "Can ho tro som") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
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
    return <EmptyState heading="Chưa tải được rồi, em thử lại nhé." body="Em có thể quay lại trang chính rồi mở lại phần khám phá cảm xúc." />;
  }

  return (
    <main className="mx-auto w-full max-w-[960px] space-y-6">
      {/* Header */}
      <header className="card-lift rounded-2xl border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2244]">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3 text-primary">
            <Brain className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-on-background">Khám phá cảm xúc</h1>
        </div>
        <p className="mt-3 text-sm text-on-background/70">
          Chọn một bài ngắn để hiểu trạng thái hiện tại của em. Kết quả không phải chẩn đoán.
        </p>
      </header>

      {/* Available tests */}
      {tests.length === 0 ? (
        <EmptyState
          heading="Chưa có bài nào lúc này"
          body="Khi có bài phù hợp, em sẽ thấy ở đây."
        />
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tests.map((test) => (
            <StitchCard
              key={test.id}
              icon={<Brain className="h-5 w-5" />}
              title={test.title}
              description={test.description ?? `${questionCount(test)} câu hỏi`}
              image={test.cover_image_url}
              ctaLabel="Bắt đầu"
              ctaHref={`/student/self-checks/${test.id}`}
            />
          ))}
        </section>
      )}

      {/* History section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-on-background">Lịch sử làm bài</h2>
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
                className="card-lift block rounded-2xl border border-outline-variant/20 bg-white p-4 transition-all hover:border-primary/20 dark:bg-[#1e2d40]"
                href={`/student/self-checks/history/${item.attempt_id}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-on-background">{item.test_title}</h3>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${riskBadgeStyle(item.state_label)}`}>
                    {displayRiskLabel(item.state_label)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-on-background/50">{formatDate(item.completed_at)}</p>
                {item.supportive_headline ? (
                  <p className="mt-2 text-sm text-on-background/70">{item.supportive_headline}</p>
                ) : null}
              </Link>
            ))}
            {history.length > 5 ? (
              <Link
                href="/student/self-checks/history"
                className="inline-flex items-center gap-1 px-1 font-semibold text-primary"
              >
                Xem thêm ({history.length} lần)
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
