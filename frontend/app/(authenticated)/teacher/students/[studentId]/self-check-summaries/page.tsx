"use client";

import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
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
  return summary.test_type ?? summary.test_title ?? "Bài tự kiểm tra";
}

function SummaryCard({ summary }: { summary: AdultSelfCheckSummaryItem }) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-heading">{testName(summary)}</h3>
        <span className="rounded-full border border-[#CFE8E1] px-3 py-1 text-label">{summary.state_label}</span>
        {summary.is_demo ? <DemoBadge /> : null}
      </div>
      <p className="mt-3 text-label">Hoàn thành: {new Date(summary.completed_at).toLocaleString("vi-VN")}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-secondary p-4">
          <h4 className="text-heading">Tóm tắt gợi ý</h4>
          <p className="mt-2 text-body">{summary.advice_summary ?? "Hãy tiếp tục hỏi thăm nhẹ nhàng để hỗ trợ em."}</p>
        </div>
        <div className="rounded-2xl bg-secondary p-4">
          <h4 className="text-heading">Gợi ý hỗ trợ</h4>
          <p className="mt-2 text-body">{summary.support_suggestion ?? "học sinh cần được quan tâm bằng cách lắng nghe và khích lệ đúng lúc."}</p>
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
    return <p>Đang tải thông tin...</p>;
  }

  if (hasError || summary === null) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Bạn có thể quay về trang chính rồi mở lại phần tóm tắt được phép xem." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      <header className="rounded-3xl bg-secondary p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-display">Tóm tắt được phép xem</h1>
          {summary.is_demo ? <DemoBadge /> : null}
        </div>
        <p className="mt-3 text-body">{sectionTitle}</p>
        <p className="mt-2 text-label">
          {summary.student.full_name} · {summary.student.school ?? "Chưa cập nhật"} · {summary.student.class_name ?? "Chưa cập nhật"}
        </p>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-heading">Quyền riêng tư</h2>
        <p className="mt-3 text-body">Bạn đang xem phần tóm tắt được phép xem. Câu trả lời riêng tư và chi tiết điểm không hiển thị tại đây.</p>
        <p className="mt-3 text-body">BeYou không hiển thị câu trả lời riêng tư của học sinh tại đây. Nội dung này chỉ nhằm hỗ trợ em đúng lúc.</p>
        <p className="mt-3 text-body">học sinh cần được quan tâm</p>
        <p className="mt-2 text-label">Hãy bắt đầu bằng lắng nghe và hỏi em muốn được hỗ trợ thế nào.</p>
        <p className="mt-3 text-label">Bạn đang xem phần tóm tắt được phép xem, không phải toàn bộ câu trả lời riêng tư của học sinh.</p>
      </section>

      {summary.latest_summary ? (
        <section className="space-y-4">
          <h2 className="text-heading">Tóm tắt gần nhất</h2>
          <SummaryCard summary={summary.latest_summary} />
        </section>
      ) : (
        <EmptyState
          heading="Chưa có tóm tắt tự kiểm tra"
          body="Khi học sinh hoàn thành bài tự kiểm tra và bạn có quyền xem, phần tóm tắt hỗ trợ sẽ hiển thị tại đây."
        />
      )}

      <section className="space-y-4">
        <h2 className="text-heading">Các lần gần đây</h2>
        {summary.recent_summaries.length === 0 ? (
          <EmptyState
            heading="Chưa có tóm tắt tự kiểm tra"
            body="Khi học sinh hoàn thành bài tự kiểm tra và bạn có quyền xem, phần tóm tắt hỗ trợ sẽ hiển thị tại đây."
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
  return <AdultSummaryDetail params={params} loadSummary={getTeacherSelfCheckSummaries} sectionTitle="Tóm tắt tự kiểm tra được phép xem" />;
}
