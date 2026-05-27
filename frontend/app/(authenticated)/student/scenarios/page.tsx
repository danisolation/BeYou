"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageCircle, Clock } from "lucide-react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { StitchCard } from "@/components/stitch-card";
import { listScenarios, listScenarioHistory, type ScenarioListItem, type ScenarioHistoryItem } from "@/lib/wellbeing-api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function signalLabel(signal: ScenarioHistoryItem["signal"]) {
  return signal === "risky" ? "Cần cân nhắc thêm" : "Có điểm tích cực";
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
    return <p className="p-6 text-body-md text-on-background/70">Đang tải thông tin...</p>;
  }

  if (hasError) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể quay lại trang chính rồi mở lại tình huống xử lý thực tế." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-8">
      {/* Header */}
      <header className="rounded-[32px] bg-surface-container p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-2xl bg-primary-container/20 p-3 text-primary">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h1 className="text-headline-md font-semibold text-on-background">Tình huống xử lý thực tế</h1>
        </div>
        <p className="mt-3 text-body-md text-on-background/70">
          Chọn một tình huống gần với đời sống học đường để thử cách phản hồi an toàn hơn.
        </p>
      </header>

      {/* Scenario cards */}
      {scenarios.length === 0 ? (
        <EmptyState heading="Chưa có tình huống đang mở" body="Khi có tình huống xử lý thực tế mới, em sẽ thấy tại đây." />
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="relative">
              <StitchCard
                icon={<MessageCircle className="h-5 w-5" />}
                title={scenario.title}
                description={scenario.situation}
                ctaLabel="Thực hành"
                ctaHref={`/student/scenarios/${scenario.id}`}
              />
              {scenario.skill_tag ? (
                <span className="absolute right-4 top-4 rounded-full bg-primary-container/20 px-3 py-1 text-sm text-primary">
                  {scenario.skill_tag}
                </span>
              ) : null}
              {scenario.is_demo ? (
                <span className="absolute left-4 top-4">
                  <DemoBadge />
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
          <h2 className="text-headline-md font-semibold text-on-background">Lịch sử tình huống</h2>
        </div>

        {history.length === 0 ? (
          <p className="rounded-[32px] bg-surface-container-low p-5 text-body-md text-on-background/70">
            Sau khi chọn cách phản hồi trong một tình huống, lịch sử luyện tập sẽ hiển thị ở đây.
          </p>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 5).map((item) => (
              <article
                key={item.attempt_id}
                className="rounded-[32px] border border-outline-variant bg-surface-container-low p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-body-md font-semibold text-on-background">{item.scenario_title}</h3>
                  {item.is_demo ? <DemoBadge /> : null}
                </div>
                <p className="mt-1 text-body-md text-on-background/60">{formatDate(item.completed_at)}</p>
                {item.signal ? (
                  <p className={`mt-2 text-body-md ${item.signal === "risky" ? "text-amber-700" : "text-primary"}`}>
                    {signalLabel(item.signal)}
                  </p>
                ) : null}
                {item.selected_choice ? (
                  <p className="mt-1 text-body-md text-on-background/70">Lựa chọn: {item.selected_choice}</p>
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
