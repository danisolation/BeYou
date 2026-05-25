"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { listSelfChecks, type SelfCheckListItem } from "@/lib/wellbeing-api";

function questionCount(test: SelfCheckListItem) {
  const maybeWithCount = test as SelfCheckListItem & { question_count?: number; questions?: unknown[] };
  return maybeWithCount.question_count ?? maybeWithCount.questions?.length ?? 0;
}

export default function SelfCheckListPage() {
  const [tests, setTests] = useState<SelfCheckListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    listSelfChecks()
      .then((items) => {
        setTests(items);
        setHasError(false);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p>Đang tải thông tin...</p>;
  }

  if (hasError) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể quay lại trang chính rồi mở lại test tâm lý." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      <header className="rounded-3xl bg-secondary p-6 shadow-sm">
        <h1 className="text-display">Test tâm lý</h1>
        <p className="mt-3 text-body">Chọn một bài ngắn để hiểu trạng thái hiện tại của em. Kết quả không phải chẩn đoán.</p>
        <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent" href="/student/self-checks/history">
          Xem lịch sử test tâm lý
        </Link>
      </header>

      {tests.length === 0 ? (
        <EmptyState
          heading="Chưa có test tâm lý đang mở"
          body="Khi nhà trường bật nội dung phù hợp, em sẽ thấy các bài test tại đây."
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {tests.map((test) => (
            <article key={test.id} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-heading">{test.title}</h2>
                {test.is_demo ? <DemoBadge /> : null}
              </div>
              {test.description ? <p className="mt-3 text-body">{test.description}</p> : null}
              <p className="mt-4 text-label">Số câu hỏi: {questionCount(test)}</p>
              <p className="text-label">Trạng thái: Đang mở</p>
              <Link
                className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-accent px-4 font-semibold text-white"
                href={`/student/self-checks/${test.id}`}
              >
                Bắt đầu test
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
