"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageCircle, Clock } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/skeletons";
import { StitchCard } from "@/components/stitch-card";
import { listScenarios, listScenarioHistory, type ScenarioListItem, type ScenarioHistoryItem } from "@/lib/wellbeing-api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function signalLabel(signal: ScenarioHistoryItem["signal"]) {
  return signal === "risky" ? "Nên xem lại" : "Em đang làm tốt lắm";
}

function signalBadgeStyle(signal: ScenarioHistoryItem["signal"]) {
  return signal === "risky"
    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
    : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
}

export default function ScenarioListPage() {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [history, setHistory] = useState<ScenarioHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    Promise.all([listScenarios(), listScenarioHistory()])
      .then(([items, historyResponse]) => {
        setScenarios(items);
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
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể quay lại trang chính rồi mở lại tình huống xử lý thực tế." />;
  }

  return (
    <main className="mx-auto w-full max-w-[960px] space-y-6">
      {/* Header */}
      <header className="card-lift rounded-2xl border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2940]">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3 text-primary">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-on-background">Tình huống xử lý thực tế</h1>
        </div>
        <p className="mt-3 text-sm text-on-background/70">
          Chọn một tình huống gần với đời sống học đường để thử cách phản hồi an toàn hơn.
        </p>
      </header>

      {/* Scenario cards */}
      {scenarios.length === 0 ? (
        <EmptyState heading="Chưa có tình huống đang mở" body="Khi có tình huống xử lý thực tế mới, em sẽ thấy tại đây." />
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="relative min-w-0">
              <StitchCard
                icon={<MessageCircle className="h-5 w-5" />}
                title={scenario.title}
                description={scenario.situation}
                image={scenario.cover_image_url}
                ctaLabel="Thực hành"
                ctaHref={`/student/scenarios/${scenario.id}`}
              />
              {scenario.skill_tag ? (
                <span className="absolute right-4 top-4 max-w-[calc(100%-2rem)] rounded-full bg-primary/10 px-3 py-1 text-xs text-primary sm:text-sm">
                  {scenario.skill_tag}
                    </span>
                  ) : null}
            </div>
          ))}
        </section>
      )}

      {/* History section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-on-background">Lịch sử tình huống</h2>
        </div>

        {history.length === 0 ? (
          <p className="rounded-2xl bg-white dark:bg-[#1e2d40] border border-outline-variant/20 p-4 text-sm text-on-background/70">
            Sau khi chọn cách phản hồi trong một tình huống, lịch sử luyện tập sẽ hiển thị ở đây.
          </p>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 5).map((item) => (
              <article
                key={item.attempt_id}
                className="card-lift rounded-2xl border border-outline-variant/20 bg-white p-4 transition-all hover:border-primary/20 dark:bg-[#1e2d40]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-on-background">{item.scenario_title}</h3>
                  {item.signal ? (
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${signalBadgeStyle(item.signal)}`}>
                      {signalLabel(item.signal)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-on-background/50">{formatDate(item.completed_at)}</p>
                {item.selected_choice ? (
                  <p className="mt-2 text-sm text-on-background/70">Lựa chọn: {item.selected_choice}</p>
                ) : null}
              </article>
            ))}
            {history.length > 5 ? (
              <Link
                href="/student/scenarios/history"
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
