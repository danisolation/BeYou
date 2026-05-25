"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import {
  getMoodCheckInOptions,
  submitMoodCheckIn,
  type MoodCheckIn,
  type MoodCheckInOptions,
  type MoodLabel,
} from "@/lib/mood-checkin-api";

function textOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function StudentMoodCheckInPage() {
  const [options, setOptions] = useState<MoodCheckInOptions | null>(null);
  const [moodLabel, setMoodLabel] = useState<MoodLabel>("steady");
  const [energyLevel, setEnergyLevel] = useState(3);
  const [stressLevel, setStressLevel] = useState(2);
  const [contextTags, setContextTags] = useState<string[]>([]);
  const [privateNote, setPrivateNote] = useState("");
  const [result, setResult] = useState<MoodCheckIn | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getMoodCheckInOptions()
      .then((payload) => {
        setOptions(payload);
        setMoodLabel(payload.mood_options[0]?.key ?? "steady");
      })
      .catch(() => setErrorMessage("Chưa tải được check-in cảm xúc. Hãy thử lại sau."))
      .finally(() => setIsLoading(false));
  }, []);

  function toggleContext(tag: string) {
    setContextTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setResult(null);
    try {
      const saved = await submitMoodCheckIn({
        mood_label: moodLabel,
        energy_level: energyLevel,
        stress_level: stressLevel,
        context_tags: contextTags,
        private_note: textOrNull(privateNote),
      });
      setResult(saved);
      setPrivateNote("");
      setContextTags([]);
    } catch {
      setErrorMessage("Chưa lưu được check-in. Hãy thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p>Đang tải check-in cảm xúc...</p>;
  }

  if (options === null) {
    return <EmptyState heading="Chưa mở được check-in cảm xúc" body={errorMessage ?? undefined} />;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-secondary p-6 shadow-sm">
        <h1 className="text-display">Check-in cảm xúc</h1>
        <p className="mt-4 text-body">
          {options.student_prompt ??
            "Dành một phút để gọi tên cảm xúc hiện tại. Peerlight AI dùng thông tin này để gợi ý bước hỗ trợ nhẹ nhàng cho em."}
        </p>
        <div className="mt-5 rounded-3xl bg-white p-5">
          <h2 className="text-heading">Ranh giới riêng tư</h2>
          <ul className="mt-3 space-y-2 text-body">
            {options.privacy_notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>

      <form className="space-y-6 rounded-3xl bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <fieldset>
          <legend className="text-heading">Hôm nay em thấy thế nào?</legend>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {options.mood_options.map((option) => (
              <label key={option.key} className="flex gap-3 rounded-2xl border border-[#D7EFE8] p-4">
                <input
                  type="radio"
                  name="mood-label"
                  checked={moodLabel === option.key}
                  onChange={() => setMoodLabel(option.key)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold">{option.label}</span>
                  <span className="block text-label">{option.helper}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-label" htmlFor="energy-level">
            Năng lượng của em
            <select
              id="energy-level"
              value={energyLevel}
              onChange={(event) => setEnergyLevel(Number(event.target.value))}
              className="mt-2 min-h-11 w-full rounded-2xl border border-[#CFE8E1] bg-white px-4"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <span className="mt-2 block">{options.energy_scale_label}</span>
          </label>

          <label className="block text-label" htmlFor="stress-level">
            Mức căng thẳng
            <select
              id="stress-level"
              value={stressLevel}
              onChange={(event) => setStressLevel(Number(event.target.value))}
              className="mt-2 min-h-11 w-full rounded-2xl border border-[#CFE8E1] bg-white px-4"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <span className="mt-2 block">{options.stress_scale_label}</span>
          </label>
        </div>

        <fieldset>
          <legend className="text-label font-semibold">Điều gì liên quan tới cảm xúc này?</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {options.context_tags.map((tag) => (
              <label key={tag.key} className="flex items-center gap-2 rounded-2xl border border-[#D7EFE8] px-4 py-3">
                <input
                  type="checkbox"
                  checked={contextTags.includes(tag.key)}
                  onChange={() => toggleContext(tag.key)}
                />
                {tag.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-label" htmlFor="private-note">
          Ghi chú riêng tư cho chính em (không bắt buộc)
        </label>
        <p id="private-note-helper" className="mt-2 text-label">
          Viết điều em muốn nhớ cho chính mình; ghi chú này không tự động gửi cho người lớn.
        </p>
        <textarea
          id="private-note"
          aria-describedby="private-note-helper"
          value={privateNote}
          onChange={(event) => setPrivateNote(event.target.value)}
          className="mt-2 min-h-28 w-full rounded-2xl border border-[#CFE8E1] p-4 text-body"
        />

        {errorMessage ? <p role="alert" className="text-body text-red-700">{errorMessage}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 rounded-2xl bg-accent px-5 font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Đang lưu..." : "Lưu check-in"}
        </button>
      </form>

      {result ? <MoodResultCard result={result} /> : null}
    </section>
  );
}

function MoodResultCard({ result }: { result: MoodCheckIn }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-heading">Đã lưu check-in</h2>
      <p role="status" className="mt-3 text-body">
        <strong>{result.trend_label}:</strong> {result.supportive_message}
      </p>
      <p className="mt-3 text-body">{result.suggested_next_action}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {result.suggest_support_plan ? (
          <Link className="inline-flex min-h-11 items-center font-semibold text-accent" href="/student/support-plan">
            Xem người lớn tin tưởng
          </Link>
        ) : null}
        {result.suggest_sos ? (
          <Link className="inline-flex min-h-11 items-center font-semibold text-red-700" href="/student">
            Tới bảng điều khiển để gửi SOS nếu em chủ động xác nhận
          </Link>
        ) : null}
        <Link className="inline-flex min-h-11 items-center font-semibold text-accent" href="/student/mood-check-ins/history">
          Xem lịch sử check-in
        </Link>
      </div>
    </section>
  );
}
