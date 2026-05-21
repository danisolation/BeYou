"use client";

import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { listScenarioHistory, type ScenarioHistoryItem } from "@/lib/wellbeing-api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function signalLabel(signal: ScenarioHistoryItem["signal"]) {
  return signal === "risky" ? "Lựa chọn cần cân nhắc thêm" : "Lựa chọn có điểm tích cực";
}

export default function ScenarioHistoryPage() {
  const [items, setItems] = useState<ScenarioHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    listScenarioHistory()
      .then((response) => {
        setItems(response.items);
        setHasError(false);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p>Đang tải thông tin...</p>;
  }

  if (hasError) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể quay lại tình huống luyện tập rồi mở lịch sử lần nữa." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      <header className="rounded-3xl bg-secondary p-6 shadow-sm">
        <h1 className="text-display">Xem lịch sử tình huống</h1>
        <p className="mt-3 text-body">Những lựa chọn em đã thử được lưu riêng trong không gian học tập của em.</p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          heading="Em chưa thử tình huống nào"
          body="Sau khi chọn cách phản hồi trong một tình huống, lịch sử luyện tập sẽ hiển thị ở đây."
        />
      ) : (
        <section className="space-y-4">
          {items.map((item) => (
            <article key={item.attempt_id} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-heading">{item.scenario_title}</h2>
                {item.is_demo ? <DemoBadge /> : null}
              </div>
              <p className="mt-3 text-label">{formatDate(item.completed_at)}</p>
              <p className="mt-4 text-label">{signalLabel(item.signal)}</p>
              {item.selected_choice ? <p className="mt-3 text-body">Lựa chọn của em: {item.selected_choice}</p> : null}
              {item.feedback ? <p className="mt-3 text-body">{item.feedback}</p> : null}
              <p className="mt-3 text-label">
                <span className="font-semibold">Kỹ năng liên quan</span> {item.skill_tag}
              </p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
