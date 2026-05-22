"use client";

import { useEffect, useMemo, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import {
  getMoodCheckInHistory,
  moodLabelFallbacks,
  type ContextTagOption,
  type MoodCheckIn,
} from "@/lib/mood-checkin-api";

const contextFallbacks: Record<string, string> = {
  school: "Trường/lớp",
  family: "Gia đình",
  friends: "Bạn bè",
  body: "Cơ thể/sức khỏe",
  sleep: "Giấc ngủ",
  future: "Tương lai",
  other: "Khác",
};

export default function StudentMoodCheckInHistoryPage() {
  const [items, setItems] = useState<MoodCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getMoodCheckInHistory()
      .then((payload) => setItems(payload.items))
      .catch(() => setErrorMessage("Chưa tải được lịch sử check-in. Hãy thử lại sau."))
      .finally(() => setIsLoading(false));
  }, []);

  const contextOptions = useMemo<ContextTagOption[]>(
    () => Object.entries(contextFallbacks).map(([key, label]) => ({ key, label })),
    [],
  );

  if (isLoading) {
    return <p>Đang tải lịch sử check-in...</p>;
  }

  if (errorMessage) {
    return <EmptyState heading="Chưa mở được lịch sử check-in" body={errorMessage} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        heading="Chưa có check-in cảm xúc"
        body="Khi em lưu check-in, BeYou sẽ hiển thị lịch sử timestamp ở đây để em tự nhìn lại."
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-secondary p-6 shadow-sm">
        <h1 className="text-display">Lịch sử check-in cảm xúc</h1>
        <p className="mt-4 text-body">
          Đây là lịch sử riêng của em. Ghi chú riêng tư không được hiển thị ở cổng người lớn trong Phase 13.
        </p>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <MoodHistoryItem key={item.id} item={item} contextOptions={contextOptions} />
        ))}
      </div>
    </section>
  );
}

function MoodHistoryItem({
  item,
  contextOptions,
}: {
  item: MoodCheckIn;
  contextOptions: ContextTagOption[];
}) {
  const contextLabels = item.context_tags.map(
    (tag) => contextOptions.find((option) => option.key === tag)?.label ?? tag,
  );
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-heading">{item.trend_label}</h2>
        {item.is_demo ? <DemoBadge /> : null}
      </div>
      <p className="mt-2 text-label">Gửi lúc: {new Date(item.created_at).toLocaleString("vi-VN")}</p>
      <div className="mt-4 grid gap-3 text-body md:grid-cols-3">
        <p><strong>Cảm xúc:</strong> {moodLabelFallbacks[item.mood_label]}</p>
        <p><strong>Năng lượng:</strong> {item.energy_level}/5</p>
        <p><strong>Căng thẳng:</strong> {item.stress_level}/5</p>
      </div>
      {contextLabels.length > 0 ? (
        <p className="mt-3 text-body">
          <strong>Ngữ cảnh:</strong> {contextLabels.join(", ")}
        </p>
      ) : null}
      <p className="mt-3 text-body">{item.supportive_message}</p>
      {item.private_note ? (
        <div className="mt-4 rounded-2xl bg-secondary p-4">
          <p className="text-label font-semibold">Ghi chú riêng tư của em</p>
          <p className="mt-2 text-body">{item.private_note}</p>
        </div>
      ) : null}
    </article>
  );
}
