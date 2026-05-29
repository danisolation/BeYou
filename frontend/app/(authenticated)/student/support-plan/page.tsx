"use client";

import { FormEvent, useEffect, useState } from "react";
import { Users } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/skeletons";
import { useToast } from "@/components/toast";
import {
  getStudentSupportPlan,
  saveStudentSupportPlan,
  supportPlanRelationshipLabels,
  supportPlanStatusLabels,
  type StudentSupportPlanResponse,
  type SupportPlanStatus,
  type SupportPlanUpsertPayload,
} from "@/lib/support-plan-api";

type SupportPlanFormState = {
  status: SupportPlanStatus;
  what_helps: string;
  what_does_not_help: string;
  preferred_contact_method: string;
  safe_contact_times: string;
  shareable_note: string;
};

const emptyForm: SupportPlanFormState = {
  status: "active",
  what_helps: "",
  what_does_not_help: "",
  preferred_contact_method: "",
  safe_contact_times: "",
  shareable_note: "",
};

function textOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const DRAFT_KEY = "beyou-support-plan-draft";

export default function StudentSupportPlanPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [data, setData] = useState<StudentSupportPlanResponse | null>(null);
  const [form, setForm] = useState<SupportPlanFormState>(emptyForm);
  const [selectedAdultIds, setSelectedAdultIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getStudentSupportPlan()
      .then((payload) => {
        setData(payload);
        if (payload.plan) {
          setForm({
            status: payload.plan.status,
            what_helps: payload.plan.what_helps ?? "",
            what_does_not_help: payload.plan.what_does_not_help ?? "",
            preferred_contact_method: payload.plan.preferred_contact_method ?? "",
            safe_contact_times: payload.plan.safe_contact_times ?? "",
            shareable_note: payload.plan.shareable_note ?? "",
          });
          setSelectedAdultIds(payload.plan.selected_adults.map((adult) => adult.id));
        } else {
          // Restore draft from localStorage if no saved plan
          try {
            const draft = localStorage.getItem(DRAFT_KEY);
            if (draft) setForm(JSON.parse(draft));
          } catch { /* ignore */ }
        }
      })
      .catch(() => setErrorMessage("Chưa tải được kế hoạch hỗ trợ. Hãy thử lại sau."))
      .finally(() => setIsLoading(false));
  }, []);

  function updateField<K extends keyof SupportPlanFormState>(field: K, value: SupportPlanFormState[K]) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }

  function toggleAdult(adultId: string) {
    setSelectedAdultIds((current) =>
      current.includes(adultId) ? current.filter((id) => id !== adultId) : [...current, adultId],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (data === null) {
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    const payload: SupportPlanUpsertPayload = {
      adult_ids: selectedAdultIds,
      status: form.status,
      what_helps: textOrNull(form.what_helps),
      what_does_not_help: textOrNull(form.what_does_not_help),
      preferred_contact_method: textOrNull(form.preferred_contact_method),
      safe_contact_times: textOrNull(form.safe_contact_times),
      shareable_note: textOrNull(form.shareable_note),
    };
    try {
      const saved = await saveStudentSupportPlan(payload);
      setData(saved);
      if (saved.plan) {
        setSelectedAdultIds(saved.plan.selected_adults.map((adult) => adult.id));
        setForm({
          status: saved.plan.status,
          what_helps: saved.plan.what_helps ?? "",
          what_does_not_help: saved.plan.what_does_not_help ?? "",
          preferred_contact_method: saved.plan.preferred_contact_method ?? "",
          safe_contact_times: saved.plan.safe_contact_times ?? "",
          shareable_note: saved.plan.shareable_note ?? "",
        });
      }
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      toastSuccess("Đã lưu kế hoạch hỗ trợ của em.");
    } catch {
      toastError("Chưa lưu được kế hoạch. Hãy kiểm tra người lớn đã chọn và thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (data === null) {
    return <EmptyState heading="Chưa mở được kế hoạch hỗ trợ" body={errorMessage ?? undefined} />;
  }

  const hasLinkedAdults = data.available_adults.length > 0;
  const activeWithoutAdult = form.status === "active" && selectedAdultIds.length === 0;
  const canSave = hasLinkedAdults && !activeWithoutAdult && !isSaving;

  return (
    <section className="space-y-6">
      <div className="card-lift rounded-2xl border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2940]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Users size={20} className="text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold text-on-background">Người lớn tin tưởng</h1>
        </div>
        <p className="mt-4 text-sm">
          Em có thể chuẩn bị trước cách người lớn tin tưởng nên hỗ trợ khi em căng thẳng, buồn hoặc cần được lắng nghe.
        </p>
        <p className="mt-3 text-xs">
          Kế hoạch này giúp em nói trước điều mình cần; em vẫn quyết định người lớn nào được chọn để xem phần chia sẻ.
        </p>
        <div className="mt-5 rounded-2xl border border-outline-variant bg-white dark:bg-[#1a2940] p-5">
          <h2 className="text-sm font-semibold">Ranh giới chia sẻ</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.privacy_notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <section className="card-lift rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
          <h2 className="text-sm font-semibold">Chọn người lớn tin tưởng</h2>
          <p className="mt-3 text-sm">
            Chỉ những người lớn đang được liên kết với em mới có thể được chọn trong kế hoạch này.
          </p>
          {hasLinkedAdults ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.available_adults.map((adult) => (
                <label key={adult.id} className="flex items-start gap-3 rounded-2xl border border-outline-variant p-4 transition-colors hover:bg-primary/5 dark:bg-[#1a2940]">
                  <input
                    type="checkbox"
                    checked={selectedAdultIds.includes(adult.id)}
                    onChange={() => toggleAdult(adult.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold text-on-background">{adult.full_name}</span>
                    <span className="block text-xs text-on-surface-variant">
                      {supportPlanRelationshipLabels[adult.relationship_type]} · {adult.email}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <EmptyState
              heading="Chưa có người lớn được liên kết"
              body="Khi tài khoản của em có người lớn hỗ trợ được liên kết, em có thể thêm họ vào kế hoạch."
            />
          )}
          {activeWithoutAdult ? (
            <p className="mt-3 text-sm text-error">Kế hoạch đang chia sẻ cần ít nhất một người lớn tin tưởng.</p>
          ) : null}
        </section>

        <section className="card-lift rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
          <h2 className="text-sm font-semibold">Điều em muốn chia sẻ</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextAreaField
              id="what-helps"
              label="Điều thường giúp em bình tĩnh hơn"
              value={form.what_helps}
              onChange={(value) => updateField("what_helps", value)}
            />
            <TextAreaField
              id="what-does-not-help"
              label="Điều người lớn nên tránh"
              value={form.what_does_not_help}
              onChange={(value) => updateField("what_does_not_help", value)}
            />
            <TextAreaField
              id="preferred-contact-method"
              label="Cách liên hệ em thấy dễ nhận nhất"
              value={form.preferred_contact_method}
              onChange={(value) => updateField("preferred_contact_method", value)}
            />
            <TextAreaField
              id="safe-contact-times"
              label="Khoảng thời gian phù hợp để hỏi thăm"
              value={form.safe_contact_times}
              onChange={(value) => updateField("safe_contact_times", value)}
            />
          </div>
          <TextAreaField
            id="shareable-note"
            label="Ghi chú em đồng ý chia sẻ thêm (không bắt buộc)"
            value={form.shareable_note}
            onChange={(value) => updateField("shareable_note", value)}
          />
        </section>

        <section className="card-lift rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
          <label className="text-xs font-semibold" htmlFor="support-plan-status">
            Trạng thái chia sẻ
          </label>
          <select
            id="support-plan-status"
            value={form.status}
            onChange={(event) => updateField("status", event.target.value as SupportPlanStatus)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-outline-variant bg-white dark:bg-[#1a2940] px-4"
          >
            {(["active", "paused", "deactivated"] as SupportPlanStatus[]).map((status) => (
              <option key={status} value={status}>
                {supportPlanStatusLabels[status]}
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs">
            Tạm dừng hoặc ngừng chia sẻ không xoá lịch sử metadata, nhưng người lớn sẽ không còn được chọn trong kế hoạch đang mở.
          </p>
          {errorMessage ? <p role="alert" className="mt-4 text-sm text-error">{errorMessage}</p> : null}
          <button
            type="submit"
            disabled={!canSave}
            className="btn-press mt-5 min-h-11 w-full rounded-2xl bg-primary px-5 font-semibold text-on-primary disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? "Đang lưu..." : "Lưu kế hoạch hỗ trợ"}
          </button>
        </section>
      </form>
    </section>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs" htmlFor={id}>
      {label}
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-28 w-full rounded-2xl border border-outline-variant bg-white dark:bg-[#1a2940] p-4 text-sm"
      />
    </label>
  );
}
