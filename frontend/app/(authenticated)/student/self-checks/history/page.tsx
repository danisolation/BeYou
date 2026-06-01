"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/skeletons";
import { listSelfCheckHistory, type SelfCheckHistoryItem } from "@/lib/wellbeing-api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function displayRiskLabel(label: string) {
  if (label === "On dinh") return "Bình thường";
  if (label === "Can chu y" || label === "Nen tim ho tro") return "Cần quan tâm";
  if (label === "Can ho tro som") return "Nguy cơ cao";
  return label;
}

export default function SelfCheckHistoryPage() {
  const [items, setItems] = useState<SelfCheckHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [filterTest, setFilterTest] = useState("");

  useEffect(() => {
    listSelfCheckHistory()
      .then((response) => {
        setItems(response.items);
        setHasError(false);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const testNames = [...new Set(items.map((i) => i.test_title))];
  const filtered = filterTest ? items.filter((i) => i.test_title === filterTest) : items;

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (hasError) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể quay lại trang test tâm lý rồi mở lịch sử lần nữa." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      <header className="rounded-2xl bg-white dark:bg-[#1a2244] border border-outline-variant/30 p-5">
        <h1 className="text-lg font-semibold text-on-background">Lịch sử test tâm lý</h1>
        <p className="mt-3 text-sm text-on-background/70">
          Câu trả lời chi tiết là riêng tư với em. Người lớn được liên kết chỉ xem phần tóm tắt cần thiết để hỗ trợ em.
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          heading="Em chưa có lần test tâm lý nào"
          body="Sau khi hoàn thành một bài, kết quả và gợi ý của em sẽ xuất hiện ở đây."
        />
      ) : (
        <section className="space-y-4">
          {testNames.length > 1 && (
            <div className="flex items-center gap-2">
              <select
                value={filterTest}
                onChange={(e) => setFilterTest(e.target.value)}
                aria-label="Lọc theo bài test"
                className="rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] px-3 py-2 text-xs outline-none focus:border-primary"
              >
                <option value="">Tất cả bài test</option>
                {testNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {filterTest && (
                <button type="button" onClick={() => setFilterTest("")} className="text-xs text-primary hover:underline">
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}
          {filtered.map((item) => (
            <Link
              key={item.attempt_id}
              className="block rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-5 transition-shadow hover:shadow-md"
              href={`/student/self-checks/history/${item.attempt_id}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">{item.test_title}</h2>
              </div>
              <p className="mt-3 text-xs">{formatDate(item.completed_at)}</p>
              <p className="mt-3 text-sm">{displayRiskLabel(item.state_label)}</p>
              {item.supportive_headline ? <p className="mt-2 text-sm">{item.supportive_headline}</p> : null}
              {item.suggested_next_action ? <p className="mt-2 text-xs">{item.suggested_next_action}</p> : null}
              <span className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary">Xem chi tiết</span>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
