"use client";

import { PageSkeleton } from "@/components/skeletons";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import {
  getTeacherSelfCheckSummaries,
  type AdultSelfCheckSummaryItem,
  type AdultSelfCheckSummaryResponse,
} from "@/lib/adult-summary-api";

type PageProps = {
  params: { studentId: string } | Promise<{ studentId: string }>;
};

function testName(summary: AdultSelfCheckSummaryItem) {
  return summary.test_type ?? summary.test_title ?? "Test tâm lý";
}

function displayRiskLabel(label: string) {
  if (label === "On dinh") return "Bình thường";
  if (label === "Can chu y" || label === "Nen tim ho tro") return "Cần quan tâm";
  if (label === "Can ho tro som") return "Nguy cơ cao";
  return label;
}

function SummaryCard({ summary }: { summary: AdultSelfCheckSummaryItem }) {
  return (
    <article className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] overflow-hidden">
      {summary.cover_image_url ? (
        <img src={summary.cover_image_url} alt="" className="h-32 w-full object-cover" />
      ) : null}
      <div className="p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">{testName(summary)}</h3>
        <span className="rounded-full border border-outline-variant/30 px-3 py-1 text-xs">{displayRiskLabel(summary.state_label)}</span>
      </div>
      <p className="mt-3 text-xs">Hoàn thành: {new Date(summary.completed_at).toLocaleString("vi-VN")}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-primary/5 p-4">
          <h4 className="text-sm font-semibold">Tóm tắt gợi ý</h4>
          <p className="mt-2 text-sm">{summary.advice_summary ?? "Hãy tiếp tục hỏi thăm nhẹ nhàng để hỗ trợ em."}</p>
        </div>
        <div className="rounded-2xl bg-primary/5 p-4">
          <h4 className="text-sm font-semibold">Gợi ý hỗ trợ</h4>
          <p className="mt-2 text-sm">{summary.support_suggestion ?? "học sinh cần được quan tâm bằng cách lắng nghe và khích lệ đúng lúc."}</p>
        </div>
      </div>
      </div>
    </article>
  );
}

export function AdultSummaryDetail({
  params,
  loadSummary,
  sectionTitle,
}: PageProps & {
  loadSummary: (studentId: string) => Promise<AdultSelfCheckSummaryResponse>;
  sectionTitle: string;
}) {
  const [summary, setSummary] = useState<AdultSelfCheckSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    Promise.resolve(params)
      .then(({ studentId }) => loadSummary(studentId))
      .then((response) => {
        setSummary(response);
        setHasError(false);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [loadSummary, params]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (hasError || summary === null) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Bạn có thể quay về trang chính rồi mở lại phần tóm tắt được phép xem." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      <header className="rounded-2xl border border-outline-variant/30 bg-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">Tóm tắt được phép xem</h1>
        </div>
        <p className="mt-3 text-sm">{sectionTitle}</p>
        <p className="mt-2 text-xs">
          {summary.student.full_name} · {summary.student.school ?? "Chưa cập nhật"} · {summary.student.class_name ?? "Chưa cập nhật"}
        </p>
      </header>

      <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-6">
        <h2 className="text-sm font-semibold">Quyền riêng tư</h2>
        <p className="mt-3 text-sm">Bạn đang xem phần tóm tắt được phép xem. Câu trả lời riêng tư và chi tiết điểm không hiển thị tại đây.</p>
        <p className="mt-3 text-sm">Peerlight AI không hiển thị câu trả lời riêng tư của học sinh tại đây. Nội dung này chỉ nhằm hỗ trợ em đúng lúc.</p>
        <p className="mt-3 text-sm">Tóm tắt này dùng để mở lời hỗ trợ, không phải theo dõi hay xếp hạng học sinh.</p>
        <p className="mt-2 text-xs">Hãy bắt đầu bằng lắng nghe và hỏi em muốn được hỗ trợ thế nào.</p>
        <p className="mt-3 text-xs">Bạn đang xem phần tóm tắt được phép xem, không phải toàn bộ câu trả lời riêng tư của học sinh.</p>
      </section>

      {summary.latest_summary ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold">Tóm tắt gần nhất</h2>
          <SummaryCard summary={summary.latest_summary} />
        </section>
      ) : (
        <EmptyState
          heading="Chưa có tóm tắt test tâm lý"
          body="Khi học sinh hoàn thành test tâm lý và bạn có quyền xem, phần tóm tắt hỗ trợ sẽ hiển thị tại đây."
        />
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Các lần gần đây</h2>
        {summary.recent_summaries.length === 0 ? (
          <EmptyState
            heading="Chưa có tóm tắt test tâm lý"
            body="Khi học sinh hoàn thành test tâm lý và bạn có quyền xem, phần tóm tắt hỗ trợ sẽ hiển thị tại đây."
          />
        ) : (
          <div className="space-y-4">
            {summary.recent_summaries.slice(0, 5).map((item) => (
              <SummaryCard key={`${item.completed_at}-${testName(item)}`} summary={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function TeacherSummaryPage({ params }: PageProps) {
  return <AdultSummaryDetail params={params} loadSummary={getTeacherSelfCheckSummaries} sectionTitle="Tóm tắt test tâm lý được phép xem" />;
}
