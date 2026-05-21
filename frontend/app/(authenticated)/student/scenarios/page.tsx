"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { listScenarios, type ScenarioListItem } from "@/lib/wellbeing-api";

export default function ScenarioListPage() {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    listScenarios()
      .then((items) => {
        setScenarios(items);
        setHasError(false);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p>Đang tải thông tin...</p>;
  }

  if (hasError) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể quay lại trang chính rồi mở lại tình huống luyện tập." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      <header className="rounded-3xl bg-secondary p-6 shadow-sm">
        <h1 className="text-display">Tình huống luyện tập</h1>
        <p className="mt-3 text-body">Chọn một tình huống gần với đời sống học đường để thử cách phản hồi an toàn hơn.</p>
        <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent" href="/student/scenarios/history">
          Xem lịch sử tình huống
        </Link>
      </header>

      {scenarios.length === 0 ? (
        <EmptyState heading="Chưa có tình huống đang mở" body="Khi có tình huống luyện tập mới, em sẽ thấy tại đây." />
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {scenarios.map((scenario) => (
            <article key={scenario.id} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-heading">{scenario.title}</h2>
                {scenario.is_demo ? <DemoBadge /> : null}
              </div>
              <p className="mt-3 text-body">{scenario.situation}</p>
              <p className="mt-4 inline-flex gap-1 rounded-full bg-secondary px-3 py-1 text-label">
                <span>Kỹ năng liên quan</span>
                <span>{scenario.skill_tag}</span>
              </p>
              <Link
                className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-accent px-4 font-semibold text-white"
                href={`/student/scenarios/${scenario.id}`}
              >
                Xem tình huống
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
