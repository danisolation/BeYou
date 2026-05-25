"use client";

import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import {
  getTeacherSupportSummary,
  type AdultSupportSummaryResponse,
} from "@/lib/adult-summary-api";

type PageProps = {
  params: { studentId: string } | Promise<{ studentId: string }>;
};

export function AdultSupportSummaryDetail({
  params,
  loadSummary,
  sectionTitle,
}: PageProps & {
  loadSummary: (studentId: string) => Promise<AdultSupportSummaryResponse>;
  sectionTitle: string;
}) {
  const [summary, setSummary] = useState<AdultSupportSummaryResponse | null>(null);
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
    return <p>Đang tải tóm tắt hỗ trợ...</p>;
  }

  if (hasError || summary === null) {
    return (
      <EmptyState
        heading="Chưa tải được tóm tắt hỗ trợ"
        body="Bạn có thể quay về trang chính rồi mở lại phần tóm tắt được phép xem."
      />
    );
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      <header className="rounded-3xl bg-secondary p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-display">Tóm tắt hỗ trợ được phép xem</h1>
          {summary.is_demo ? <DemoBadge /> : null}
        </div>
        <p className="mt-3 text-body">{sectionTitle}</p>
        <p className="mt-2 text-label">
          {summary.student.full_name} · {summary.student.school ?? "Chưa cập nhật"} ·{" "}
          {summary.student.class_name ?? "Chưa cập nhật"}
        </p>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-heading">Ranh giới riêng tư</h2>
        <ul className="mt-3 space-y-2 text-body">
          {summary.privacy_notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <SupportPlanCard summary={summary} />
      <AdultSharedMoodNotesCard summary={summary} />
      <MoodTrendCard summary={summary} />
    </main>
  );
}

function SupportPlanCard({ summary }: { summary: AdultSupportSummaryResponse }) {
  const plan = summary.support_plan;
  if (!plan.shared_with_viewer) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-heading">Kế hoạch người lớn tin cậy</h2>
        <p className="mt-3 text-body">
          Học sinh chưa chia sẻ kế hoạch này với bạn, hoặc kế hoạch đang tạm dừng/ngừng chia sẻ.
        </p>
        <p className="mt-2 text-label">Trạng thái: {plan.status ?? "Chưa có kế hoạch"}</p>
      </section>
    );
  }
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-heading">Kế hoạch người lớn tin cậy</h2>
      <p className="mt-3 text-label">Được chia sẻ với {plan.selected_adult_count} người lớn tin cậy.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SummaryField title="Điều thường giúp em" value={plan.what_helps} />
        <SummaryField title="Điều nên tránh" value={plan.what_does_not_help} />
        <SummaryField title="Cách liên hệ phù hợp" value={plan.preferred_contact_method} />
        <SummaryField title="Thời điểm phù hợp" value={plan.safe_contact_times} />
      </div>
      {plan.shareable_note ? (
        <div className="mt-4 rounded-2xl bg-secondary p-4">
          <h3 className="text-heading">Ghi chú em đồng ý chia sẻ</h3>
          <p className="mt-2 text-body">{plan.shareable_note}</p>
        </div>
      ) : null}
    </section>
  );
}

function AdultSharedMoodNotesCard({ summary }: { summary: AdultSupportSummaryResponse }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-heading">Ghi chú được học sinh đồng ý chia sẻ</h2>
      <p className="mt-3 text-body">Chỉ hiển thị những nội dung học sinh đã chủ động chọn chia sẻ với bạn.</p>
      <div className="mt-4 space-y-3">
        {summary.shared_mood_notes.length === 0 ? (
          <p className="rounded-2xl bg-secondary p-4 text-body">
            Học sinh chưa chia sẻ ghi chú cảm xúc nào với bạn, hoặc quyền chia sẻ đã được thu hồi.
          </p>
        ) : (
          summary.shared_mood_notes.map((note) => (
            <article key={note.id} className="rounded-2xl bg-secondary p-4">
              <p className="text-label">{new Date(note.shared_at).toLocaleString("vi-VN")}</p>
              <p className="mt-1 text-label">
                {note.share_scope === "private_note" ? "Ghi chú riêng tư được chia sẻ" : "Tóm tắt học sinh tự viết"}
              </p>
              <p className="mt-2 text-body">{note.content}</p>
              <p className="mt-3 text-label">
                Nội dung này có thể không còn hiển thị nếu học sinh thu hồi quyền xem.
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function MoodTrendCard({ summary }: { summary: AdultSupportSummaryResponse }) {
  const mood = summary.mood_summary;
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-heading">Xu hướng check-in cảm xúc</h2>
      <p className="mt-3 text-label">Tóm tắt tổng hợp</p>
      {mood.latest_trend_label ? (
        <>
          <p className="mt-3 text-body">
            Gần nhất: <strong>{mood.latest_trend_label}</strong>
            {mood.latest_checkin_at ? ` · ${new Date(mood.latest_checkin_at).toLocaleString("vi-VN")}` : ""}
          </p>
          <p className="mt-2 text-body">
            {mood.recent_checkin_count} check-in gần đây · {mood.high_concern_count} lần cần hỗ trợ sớm.
          </p>
          <p className="mt-3 text-body">{mood.suggested_supportive_action}</p>
          <p className="mt-3 text-label">Các nhãn gần đây: {mood.recent_trend_labels.join(", ")}</p>
        </>
      ) : (
        <p className="mt-3 text-body">{mood.suggested_supportive_action}</p>
      )}
    </section>
  );
}

function SummaryField({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="rounded-2xl bg-secondary p-4">
      <h3 className="text-heading">{title}</h3>
      <p className="mt-2 text-body">{value ?? "Chưa chia sẻ nội dung này."}</p>
    </div>
  );
}

export default function TeacherSupportSummaryPage({ params }: PageProps) {
  return (
    <AdultSupportSummaryDetail
      params={params}
      loadSummary={getTeacherSupportSummary}
      sectionTitle="Tóm tắt kế hoạch hỗ trợ và xu hướng check-in được phép xem"
    />
  );
}
