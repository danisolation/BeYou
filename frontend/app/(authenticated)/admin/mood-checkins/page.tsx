"use client";

import { FormEvent, useEffect, useState } from "react";
import { Heart } from "lucide-react";

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
          <h1 className="text-lg font-semibold text-on-background">Mood check-in</h1>
        </div>
        <p className="mt-3 text-sm text-on-background/70">
          Quản lý nhãn cảm xúc, hướng dẫn và context tags. Copy phải hỗ trợ, không chẩn đoán.
        </p>
      </header>

      {isLoading ? <p>Đang tải cấu hình...</p> : null}
      {configs.length > 0 ? (
        <section className="rounded-2xl bg-white dark:bg-[#1a2940] p-6 shadow-sm">
          <h2 className="text-sm font-semibold">Cấu hình hiện có</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {configs.map((config) => (
              <button
                key={config.id}
                type="button"
                onClick={() => selectConfig(config)}
                className="min-h-11 rounded-xl border border-outline-variant/30 px-4 font-semibold"
              >
                {config.name} · {config.status}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <form className="space-y-5 rounded-2xl bg-white dark:bg-[#1a2940] p-6 shadow-sm" onSubmit={handleSave}>
        <div className="grid gap-4 md:grid-cols-3">
          <TextInput label="Tên cấu hình" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
          <label className="block text-xs font-semibold">
            Trạng thái
            <select
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value as AdminMoodCheckInConfigPayload["status"] })}
              className="mt-2 min-h-11 w-full rounded-xl border border-outline-variant/30 px-3"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <TextInput
            label="Thứ tự"
            type="number"
            value={String(draft.sort_order)}
            onChange={(value) => setDraft({ ...draft, sort_order: Number(value) })}
          />
        </div>

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

        <section>
          <h2 className="text-sm font-semibold">Mood options</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {draft.mood_options.map((option, index) => (
              <div key={option.key} className="rounded-2xl bg-primary/5 p-4">
                <p className="text-xs font-semibold">{option.key}</p>
                <TextInput label="Nhãn" value={option.label} onChange={(value) => updateMoodOption(index, "label", value)} />
                <TextInput label="Helper" value={option.helper} onChange={(value) => updateMoodOption(index, "helper", value)} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold">Context tags</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {draft.context_tags.map((tag, index) => (
              <div key={tag.key} className="rounded-2xl bg-primary/5 p-4">
                <TextInput label={tag.key} value={tag.label} onChange={(value) => updateContextTag(index, value)} />
              </div>
            ))}
          </div>
        </section>

        {message ? <p role="status" className="text-sm text-primary">{message}</p> : null}
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={isSaving} className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-white">
            {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
          <button type="button" onClick={handlePreview} className="min-h-11 rounded-xl border border-outline-variant/30 px-5 font-semibold">
            Xem preview
          </button>
        </div>
      </form>

      {preview ? (
        <section className="rounded-2xl bg-white dark:bg-[#1a2940] p-6 shadow-sm">
          <h2 className="text-sm font-semibold">Preview</h2>
          <p className="mt-3 text-sm">{preview.student_prompt}</p>
          <p className="mt-2 text-sm">{preview.adult_guidance}</p>
          <p className="mt-3 text-xs">Mood: {preview.mood_options.map((option) => option.label).join(", ")}</p>
          <p className="mt-2 text-xs">Context: {preview.context_tags.map((tag) => tag.label).join(", ")}</p>
        </section>
      ) : null}
    </section>
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
    <label className="mt-2 block text-xs font-semibold">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-xl border border-outline-variant/30 px-3"
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
    <label className="block text-xs font-semibold">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-24 w-full rounded-xl border border-outline-variant/30 p-3"
      />
    </label>
  );
}
