"use client";

import { FormEvent, useEffect, useState } from "react";
import { Heart, Pencil } from "lucide-react";

import {
  createMoodCheckInConfig,
  defaultMoodConfigPayload,
  listMoodCheckInConfigs,
  previewMoodCheckInConfig,
  updateMoodCheckInConfig,
  type AdminMoodCheckInConfig,
  type AdminMoodCheckInConfigPayload,
  type AdminMoodCheckInPreview,
} from "@/lib/admin-mood-checkins-api";

type MoodConfigStatus = AdminMoodCheckInConfigPayload["status"];

const moodConfigStatusLabels: Record<MoodConfigStatus, string> = {
  draft: "Nháp",
  published: "Đã xuất bản",
  archived: "Đã lưu trữ",
};

const moodConfigStatusStyles: Record<MoodConfigStatus, string> = {
  draft: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const moodConfigStatusOptions: MoodConfigStatus[] = ["draft", "published", "archived"];

export default function AdminMoodCheckInsPage() {
  const [configs, setConfigs] = useState<AdminMoodCheckInConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminMoodCheckInConfigPayload>(defaultMoodConfigPayload);
  const [preview, setPreview] = useState<AdminMoodCheckInPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listMoodCheckInConfigs()
      .then((items) => {
        setConfigs(items);
        if (items[0]) {
          selectConfig(items[0]);
        }
      })
      .catch(() => setError("Chưa tải được cấu hình mood check-in."))
      .finally(() => setIsLoading(false));
  }, []);

  function selectConfig(config: AdminMoodCheckInConfig) {
    setSelectedId(config.id);
    setDraft({
      name: config.name,
      status: config.status,
      student_prompt: config.student_prompt,
      adult_guidance: config.adult_guidance,
      mood_options: config.mood_options,
      context_tags: config.context_tags,
      sort_order: config.sort_order,
    });
    setPreview(null);
    setMessage("");
    setError("");
  }

  function updateMoodOption(index: number, field: "label" | "helper", value: string) {
    setDraft((current) => ({
      ...current,
      mood_options: current.mood_options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: value } : option,
      ),
    }));
  }

  function updateContextTag(index: number, value: string) {
    setDraft((current) => ({
      ...current,
      context_tags: current.context_tags.map((tag, tagIndex) =>
        tagIndex === index ? { ...tag, label: value } : tag,
      ),
    }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const saved = selectedId
        ? await updateMoodCheckInConfig(selectedId, draft)
        : await createMoodCheckInConfig(draft);
      setConfigs((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      selectConfig(saved);
      setMessage("Đã lưu cấu hình mood check-in.");
    } catch {
      setError("Chưa lưu được. Hãy kiểm tra đủ option và tránh copy chẩn đoán/giám sát.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePreview() {
    if (!selectedId) {
      setError("Hãy lưu cấu hình trước khi xem preview.");
      return;
    }
    setError("");
    setPreview(await previewMoodCheckInConfig(selectedId));
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Heart size={18} />
          </div>
          <h1 className="text-lg font-semibold text-on-background dark:text-white">Mood check-in</h1>
        </div>
        <p className="mt-3 text-sm text-on-background/70 dark:text-white/70">
          Quản lý nhãn cảm xúc, hướng dẫn và context tags. Copy phải hỗ trợ, không chẩn đoán.
        </p>
      </header>

      {isLoading ? <p className="text-sm text-on-background/70 dark:text-white/70">Đang tải cấu hình...</p> : null}
      {configs.length > 0 ? (
        <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-on-background dark:text-white">Cấu hình hiện có</h2>
              <p className="mt-1 text-sm text-on-background/60 dark:text-white/60">Chọn một cấu hình để chỉnh sửa nhanh với badge trạng thái rõ ràng.</p>
            </div>
            {selectedId ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Pencil size={14} />
                Đang chỉnh sửa
              </span>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {configs.map((config) => {
              const isSelected = selectedId === config.id;
              return (
                <button
                  key={config.id}
                  type="button"
                  onClick={() => selectConfig(config)}
                  className={`rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5 text-left transition-all ${isSelected ? "border-primary/30 bg-primary/5 shadow-sm dark:bg-primary/10" : "hover:border-primary/25 hover:bg-primary/5/40"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-on-background dark:text-white">{config.name}</p>
                      <p className="mt-2 text-xs text-on-background/50 dark:text-white/50">Cấu hình mood check-in</p>
                    </div>
                    <MoodConfigStatusBadge status={config.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <form className="space-y-6 rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5" onSubmit={handleSave}>
        <div className="flex flex-col gap-3 border-b border-outline-variant/20 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Thông tin cấu hình</p>
            <h2 className="mt-2 text-sm font-semibold text-on-background dark:text-white">{selectedId ? "Chỉnh sửa cấu hình" : "Tạo cấu hình"}</h2>
          </div>
          {selectedId ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/30 bg-white px-3 py-1.5 text-xs font-medium text-on-background/70 dark:bg-[#1e2d40] dark:text-white/80">
              <Pencil size={14} />
              Đang chỉnh sửa cấu hình hiện có
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <TextInput label="Tên cấu hình" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
          <label className="block text-sm font-medium text-on-background dark:text-white">
            Trạng thái
            <select
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value as AdminMoodCheckInConfigPayload["status"] })}
              className="mt-2 min-h-11 w-full rounded-xl border border-outline-variant/30 px-3 text-on-background dark:bg-[#1e2d40] dark:text-white"
            >
              {moodConfigStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {moodConfigStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <TextInput
            label="Thứ tự"
            type="number"
            value={String(draft.sort_order)}
            onChange={(value) => setDraft({ ...draft, sort_order: Number(value) })}
          />
        </div>

        <div className="grid gap-4">
          <TextAreaInput
            label="Prompt cho học sinh"
            value={draft.student_prompt}
            onChange={(value) => setDraft({ ...draft, student_prompt: value })}
          />
          <TextAreaInput
            label="Gợi ý hỗ trợ cho người lớn"
            value={draft.adult_guidance}
            onChange={(value) => setDraft({ ...draft, adult_guidance: value })}
          />
        </div>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Mood options</p>
          <div className="grid gap-3 md:grid-cols-2">
            {draft.mood_options.map((option, index) => (
              <div key={option.key} className="rounded-2xl border border-outline-variant/20 bg-primary/5 p-4 dark:bg-[#1e2d40]/70">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-on-background dark:text-white">{option.key}</p>
                    <p className="mt-1 text-xs text-on-background/50 dark:text-white/50">Thiết lập nhãn hiển thị và helper text cho cảm xúc này.</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-on-background/60 dark:bg-[#1a2940] dark:text-white/70">
                    #{index + 1}
                  </span>
                </div>
                <div className="space-y-3">
                  <TextInput label="Nhãn" value={option.label} onChange={(value) => updateMoodOption(index, "label", value)} />
                  <TextInput label="Helper" value={option.helper} onChange={(value) => updateMoodOption(index, "helper", value)} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Context tags</p>
          <div className="grid gap-3 md:grid-cols-2">
            {draft.context_tags.map((tag, index) => (
              <div key={tag.key} className="rounded-2xl border border-outline-variant/20 bg-primary/5 p-4 dark:bg-[#1e2d40]/70">
                <p className="text-sm font-semibold text-on-background dark:text-white">{tag.key}</p>
                <p className="mt-1 text-xs text-on-background/50 dark:text-white/50">Nhãn ngữ cảnh hiển thị trong màn hình check-in.</p>
                <TextInput label="Nhãn hiển thị" value={tag.label} onChange={(value) => updateContextTag(index, value)} />
              </div>
            ))}
          </div>
        </section>

        {message ? <p role="status" className="text-sm text-primary">{message}</p> : null}
        {error ? <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={isSaving} className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-white">
            {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
          <button type="button" onClick={handlePreview} className="min-h-11 rounded-xl border border-outline-variant/30 px-5 font-semibold text-on-background dark:text-white">
            Xem preview
          </button>
        </div>
      </form>

      {preview ? (
        <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Preview</p>
              <h2 className="mt-2 text-sm font-semibold text-on-background dark:text-white">Bản xem trước mood check-in</h2>
            </div>
            <MoodConfigStatusBadge status={draft.status} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4 rounded-2xl border border-outline-variant/20 bg-primary/5 p-4 dark:bg-[#1e2d40]/70">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Prompt cho học sinh</p>
                <p className="mt-3 text-sm text-on-background dark:text-white">{preview.student_prompt}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Gợi ý cho người lớn</p>
                <p className="mt-3 text-sm text-on-background dark:text-white">{preview.adult_guidance}</p>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-outline-variant/20 bg-white/80 p-4 dark:bg-[#1e2d40]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Mood options</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.mood_options.map((option) => (
                    <span key={option.key} className="inline-flex items-center rounded-full border border-outline-variant/30 bg-primary/10 px-3 py-1 text-xs font-medium text-on-background dark:text-white">
                      {option.label}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Context tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.context_tags.map((tag) => (
                    <span key={tag.key} className="inline-flex items-center rounded-full border border-outline-variant/30 bg-white px-3 py-1 text-xs font-medium text-on-background dark:bg-[#1a2940] dark:text-white">
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}

function MoodConfigStatusBadge({ status }: { status: MoodConfigStatus }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${moodConfigStatusStyles[status]}`}>
      {moodConfigStatusLabels[status]}
    </span>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="mt-2 block text-sm font-medium text-on-background dark:text-white">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-xl border border-outline-variant/30 px-3 text-on-background dark:bg-[#1e2d40] dark:text-white"
      />
    </label>
  );
}

function TextAreaInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-on-background dark:text-white">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-24 w-full rounded-xl border border-outline-variant/30 px-3 py-3 text-on-background dark:bg-[#1e2d40] dark:text-white"
      />
    </label>
  );
}
