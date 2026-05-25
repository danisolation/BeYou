"use client";

import { FormEvent, useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
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

export default function StudentSupportPlanPage() {
  const [data, setData] = useState<StudentSupportPlanResponse | null>(null);
  const [form, setForm] = useState<SupportPlanFormState>(emptyForm);
  const [selectedAdultIds, setSelectedAdultIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
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
        }
      })
      .catch(() => setErrorMessage("Chưa tải được kế hoạch hỗ trợ. Hãy thử lại sau."))
      .finally(() => setIsLoading(false));
  }, []);

  function updateField<K extends keyof SupportPlanFormState>(field: K, value: SupportPlanFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
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
    setSaveMessage(null);
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
      setSaveMessage("Đã lưu kế hoạch hỗ trợ của em.");
    } catch {
      setErrorMessage("Chưa lưu được kế hoạch. Hãy kiểm tra người lớn đã chọn và thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p>Đang tải kế hoạch hỗ trợ...</p>;
  }

  if (data === null) {
    return <EmptyState heading="Chưa mở được kế hoạch hỗ trợ" body={errorMessage ?? undefined} />;
  }

  const hasLinkedAdults = data.available_adults.length > 0;
  const activeWithoutAdult = form.status === "active" && selectedAdultIds.length === 0;
  const canSave = hasLinkedAdults && !activeWithoutAdult && !isSaving;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-secondary p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display">Người lớn tin tưởng</h1>
          {data.is_demo ? <DemoBadge /> : null}
        </div>
        <p className="mt-4 text-body">
          Em có thể chuẩn bị trước cách người lớn tin tưởng nên hỗ trợ khi em căng thẳng, buồn hoặc cần được lắng nghe.
        </p>
        <p className="mt-3 text-label">
          Kế hoạch này giúp em nói trước điều mình cần; em vẫn quyết định người lớn nào được chọn để xem phần chia sẻ.
        </p>
        <div className="mt-5 rounded-3xl bg-white p-5">
          <h2 className="text-heading">Ranh giới chia sẻ</h2>
          <ul className="mt-3 space-y-2 text-body">
            {data.privacy_notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-heading">Chọn người lớn tin tưởng</h2>
          <p className="mt-3 text-body">
            Chỉ những người lớn đang được liên kết với em mới có thể được chọn trong kế hoạch này.
          </p>
          {hasLinkedAdults ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {data.available_adults.map((adult) => (
                <label key={adult.id} className="flex gap-3 rounded-2xl border border-[#D7EFE8] p-4">
                  <input
                    type="checkbox"
                    checked={selectedAdultIds.includes(adult.id)}
                    onChange={() => toggleAdult(adult.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold">{adult.full_name}</span>
                    <span className="block text-label">
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
            <p className="mt-3 text-body text-red-700">Kế hoạch đang chia sẻ cần ít nhất một người lớn tin tưởng.</p>
          ) : null}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-heading">Điều em muốn chia sẻ</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
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

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <label className="text-label font-semibold" htmlFor="support-plan-status">
            Trạng thái chia sẻ
          </label>
          <select
            id="support-plan-status"
            value={form.status}
            onChange={(event) => updateField("status", event.target.value as SupportPlanStatus)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-[#CFE8E1] bg-white px-4"
          >
            {(["active", "paused", "deactivated"] as SupportPlanStatus[]).map((status) => (
              <option key={status} value={status}>
                {supportPlanStatusLabels[status]}
              </option>
            ))}
          </select>
          <p className="mt-3 text-label">
            Tạm dừng hoặc ngừng chia sẻ không xoá lịch sử metadata, nhưng người lớn sẽ không còn được chọn trong kế hoạch đang mở.
          </p>
          {errorMessage ? <p role="alert" className="mt-4 text-body text-red-700">{errorMessage}</p> : null}
          {saveMessage ? <p role="status" className="mt-4 text-body text-accent">{saveMessage}</p> : null}
          <button
            type="submit"
            disabled={!canSave}
            className="mt-5 min-h-11 rounded-2xl bg-accent px-5 font-semibold text-white disabled:opacity-60"
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
    <label className="block text-label" htmlFor={id}>
      {label}
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-28 w-full rounded-2xl border border-[#CFE8E1] p-4 text-body"
      />
    </label>
  );
}
