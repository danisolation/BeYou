"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/skeletons";
import { ApiError } from "@/lib/api";
import {
  getTeacherSupportSummary,
  type AdultAccessReasonRequiredDetail,
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
  loadSummary: (studentId: string, reasonCode?: string) => Promise<AdultSupportSummaryResponse>;
  sectionTitle: string;
}) {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdultSupportSummaryResponse | null>(null);
  const [reasonRequired, setReasonRequired] = useState<AdultAccessReasonRequiredDetail | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingReason, setIsSubmittingReason] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    Promise.resolve(params)
      .then(({ studentId: resolvedStudentId }) => {
        if (!isActive) {
          return null;
        }
        setStudentId(resolvedStudentId);
        return loadSummary(resolvedStudentId);
      })
      .then((response) => {
        if (!isActive || response === null) {
          return;
        }
        setSummary(response);
        setReasonRequired(null);
        setHasError(false);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }
        const accessReasonDetail = getAccessReasonRequiredDetail(error);
        if (accessReasonDetail !== null) {
          setReasonRequired(accessReasonDetail);
          setSummary(null);
          setHasError(false);
          return;
        }
        setHasError(true);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [loadSummary, params]);

  async function submitReason() {
    if (studentId === null || selectedReason === "") {
      return;
    }
    setIsSubmittingReason(true);
    setReasonError(null);
    try {
      const response = await loadSummary(studentId, selectedReason);
      setSummary(response);
      setReasonRequired(null);
      setHasError(false);
    } catch (error) {
      setReasonError("Chưa xác nhận được lý do hỗ trợ. Vui lòng chọn lại hoặc thử mở lại trang.");
      if (getAccessReasonRequiredDetail(error) === null) {
        setHasError(true);
      }
    } finally {
      setIsSubmittingReason(false);
    }
  }

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (reasonRequired !== null) {
    return (
      <main className="mx-auto max-w-[760px] space-y-6">
        <AccessReasonPrompt
          detail={reasonRequired}
          selectedReason={selectedReason}
          isSubmitting={isSubmittingReason}
          errorMessage={reasonError}
          onReasonChange={setSelectedReason}
          onSubmit={submitReason}
        />
      </main>
    );
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
      <header className="rounded-2xl border border-outline-variant/30 bg-primary/5 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">Tóm tắt hỗ trợ</h1>
        </div>
        <p className="mt-3 text-sm">{sectionTitle}</p>
        <p className="mt-2 text-xs">
          {summary.student.full_name} · {summary.student.school ?? "Chưa cập nhật"} ·{" "}
          {summary.student.class_name ?? "Chưa cập nhật"}
        </p>
      </header>

      <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
        <h2 className="text-sm font-semibold">Về quyền riêng tư</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {summary.privacy_notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      {summary.access_reason?.required ? <AccessReasonAcceptedCard summary={summary} /> : null}
      <SupportPlanCard summary={summary} />
      <AdultSharedMoodNotesCard summary={summary} />
      <MoodTrendCard summary={summary} />
    </main>
  );
}

function getAccessReasonRequiredDetail(error: unknown): AdultAccessReasonRequiredDetail | null {
  if (!(error instanceof ApiError) || error.status !== 428) {
    return null;
  }
  const detailWrapper = error.detail;
  if (typeof detailWrapper !== "object" || detailWrapper === null) {
    return null;
  }
  const maybeDetail = "detail" in detailWrapper ? (detailWrapper as { detail: unknown }).detail : detailWrapper;
  if (typeof maybeDetail !== "object" || maybeDetail === null) {
    return null;
  }
  if ((maybeDetail as { code?: unknown }).code !== "access_reason_required") {
    return null;
  }
  return maybeDetail as AdultAccessReasonRequiredDetail;
}

function AccessReasonPrompt({
  detail,
  selectedReason,
  isSubmitting,
  errorMessage,
  onReasonChange,
  onSubmit,
}: {
  detail: AdultAccessReasonRequiredDetail;
  selectedReason: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
      <h1 className="text-lg font-semibold">Cho biết lý do hỗ trợ trước khi xem</h1>
      <p className="mt-3 text-sm">{detail.message}</p>
      <div className="mt-4 rounded-2xl bg-primary/5 p-4 text-sm">
        {(detail.copy ?? [
          "Lý do này giúp minh bạch việc truy cập và chỉ được lưu trong dữ liệu rà soát.",
          "Lý do không cấp thêm quyền; Peerlight AI vẫn kiểm tra vai trò và kết nối đang hoạt động.",
        ]).map((copy) => (
          <p key={copy}>{copy}</p>
        ))}
      </div>
      <fieldset className="mt-5 space-y-3">
        <legend className="text-sm font-semibold">Chọn lý do phù hợp</legend>
        {detail.allowed_reasons.map((reason) => (
          <label key={reason.code} className="flex items-start gap-3 rounded-2xl border border-outline-variant/20 p-3 text-sm">
            <input
              className="mt-1"
              type="radio"
              name="access-reason"
              value={reason.code}
              checked={selectedReason === reason.code}
              onChange={() => onReasonChange(reason.code)}
            />
            <span>{reason.label}</span>
          </label>
        ))}
      </fieldset>
      {errorMessage ? <p className="mt-3 text-xs text-red-700">{errorMessage}</p> : null}
      <button
        className="mt-5 rounded-full bg-primary px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        disabled={selectedReason === "" || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? "Đang xác nhận..." : "Tiếp tục xem tóm tắt"}
      </button>
    </section>
  );
}

function AccessReasonAcceptedCard({ summary }: { summary: AdultSupportSummaryResponse }) {
  return (
    <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
      <h2 className="text-sm font-semibold">Lý do truy cập đã ghi nhận</h2>
      <p className="mt-3 text-sm">
        {summary.access_reason.reason_label ?? "Lý do hỗ trợ đã được ghi nhận"} — chỉ lưu dưới dạng mã dữ liệu để minh bạch
        thao tác xem.
      </p>
      <p className="mt-2 text-xs">Lý do này không mở rộng quyền xem ngoài kết nối đang hoạt động.</p>
    </section>
  );
}

function SupportPlanCard({ summary }: { summary: AdultSupportSummaryResponse }) {
  const plan = summary.support_plan;
  if (!plan.shared_with_viewer) {
    return (
      <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
        <h2 className="text-sm font-semibold">Người lớn tin tưởng</h2>
        <p className="mt-3 text-sm">
          Học sinh chưa chia sẻ kế hoạch này với bạn, hoặc kế hoạch đang tạm dừng/ngừng chia sẻ.
        </p>
        <p className="mt-2 text-xs">Trạng thái: {plan.status ?? "Chưa có kế hoạch"}</p>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
      <h2 className="text-sm font-semibold">Người lớn tin tưởng</h2>
      <p className="mt-3 text-xs">Được chia sẻ với {plan.selected_adult_count} người lớn tin tưởng.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SummaryField title="Điều thường giúp em" value={plan.what_helps} />
        <SummaryField title="Điều nên tránh" value={plan.what_does_not_help} />
        <SummaryField title="Cách liên hệ phù hợp" value={plan.preferred_contact_method} />
        <SummaryField title="Thời điểm phù hợp" value={plan.safe_contact_times} />
      </div>
      {plan.shareable_note ? (
        <div className="mt-4 rounded-2xl bg-primary/5 p-4">
          <h3 className="text-sm font-semibold">Ghi chú em đồng ý chia sẻ</h3>
          <p className="mt-2 text-sm">{plan.shareable_note}</p>
        </div>
      ) : null}
    </section>
  );
}

function AdultSharedMoodNotesCard({ summary }: { summary: AdultSupportSummaryResponse }) {
  return (
    <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
      <h2 className="text-sm font-semibold">Ghi chú được học sinh đồng ý chia sẻ</h2>
      <p className="mt-3 text-sm">Chỉ hiển thị những nội dung học sinh đã chủ động chọn chia sẻ với bạn.</p>
      <div className="mt-4 space-y-3">
        {summary.shared_mood_notes.length === 0 ? (
          <p className="rounded-2xl bg-primary/5 p-4 text-sm">
            Học sinh chưa chia sẻ ghi chú cảm xúc nào với bạn, hoặc quyền chia sẻ đã được thu hồi.
          </p>
        ) : (
          summary.shared_mood_notes.map((note) => (
            <article key={note.id} className="rounded-2xl bg-primary/5 p-4">
              <p className="text-xs">{new Date(note.shared_at).toLocaleString("vi-VN")}</p>
              <p className="mt-1 text-xs">
                {note.share_scope === "private_note" ? "Ghi chú riêng tư được chia sẻ" : "Tóm tắt học sinh tự viết"}
              </p>
              <p className="mt-2 text-sm">{note.content}</p>
              <p className="mt-3 text-xs">
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
    <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
      <h2 className="text-sm font-semibold">Xu hướng cảm xúc</h2>
      <p className="mt-3 text-xs">Tóm tắt tổng hợp</p>
      {mood.latest_trend_label ? (
        <>
          <p className="mt-3 text-sm">
            Gần nhất: <strong>{mood.latest_trend_label}</strong>
            {mood.latest_checkin_at ? ` · ${new Date(mood.latest_checkin_at).toLocaleString("vi-VN")}` : ""}
          </p>
          <p className="mt-2 text-sm">
            {mood.recent_checkin_count} lần ghi nhận gần đây · {mood.high_concern_count} lần cần hỗ trợ sớm.
          </p>
          <p className="mt-3 text-sm">{mood.suggested_supportive_action}</p>
          <p className="mt-3 text-xs">Các nhãn gần đây: {mood.recent_trend_labels.join(", ")}</p>
        </>
      ) : (
        <p className="mt-3 text-sm">{mood.suggested_supportive_action}</p>
      )}
    </section>
  );
}

function SummaryField({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="rounded-2xl bg-primary/5 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm">{value ?? "Chưa chia sẻ nội dung này."}</p>
    </div>
  );
}

export default function TeacherSupportSummaryPage({ params }: PageProps) {
  return (
    <AdultSupportSummaryDetail
      params={params}
      loadSummary={getTeacherSupportSummary}
      sectionTitle="Tóm tắt kế hoạch hỗ trợ và xu hướng cảm xúc đang được chia sẻ"
    />
  );
}
