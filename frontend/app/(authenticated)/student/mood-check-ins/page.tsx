"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Heart, Shield, Clock } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/skeletons";
import {
  getMoodCheckInOptions,
  getMoodCheckInHistory,
  submitMoodCheckIn,
  moodLabelFallbacks,
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
  const [history, setHistory] = useState<MoodCheckIn[]>([]);
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
    Promise.all([getMoodCheckInOptions(), getMoodCheckInHistory()])
      .then(([optionsPayload, historyPayload]) => {
        setOptions(optionsPayload);
        setMoodLabel(optionsPayload.mood_options[0]?.key ?? "steady");
        setHistory(historyPayload.items);
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
      setHistory((prev) => [saved, ...prev]);
      setPrivateNote("");
      setContextTags([]);
    } catch {
      setErrorMessage("Chưa lưu được check-in. Hãy thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (options === null) {
    return <EmptyState heading="Chưa mở được check-in cảm xúc" body={errorMessage ?? undefined} />;
  }

  return (
    <section className="mx-auto max-w-[960px] space-y-8">
      {/* Header */}
      <header className="rounded-[32px] bg-surface-container p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-2xl bg-primary-container/20 p-3 text-primary">
            <Heart className="h-6 w-6" />
          </div>
          <h1 className="text-headline-md font-semibold text-on-background">Check-in cảm xúc</h1>
        </div>
        <p className="mt-3 text-body-md text-on-background/70">
          {options.student_prompt ??
            "Dành một phút để gọi tên cảm xúc hiện tại. Peerlight AI dùng thông tin này để gợi ý bước hỗ trợ nhẹ nhàng cho em."}
        </p>
      </header>

      {/* Privacy banner */}
      <div className="rounded-[32px] border border-outline-variant bg-surface-container-low p-5">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 shrink-0 text-primary" />
          <h2 className="text-body-md font-semibold text-on-background">Ranh giới riêng tư</h2>
        </div>
        <ul className="mt-3 space-y-2 text-body-md text-on-background/80">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            Chỉ em mới thấy nhật ký cảm xúc này
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            Không ai bị thông báo khi em check-in
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            Em có thể xóa bất kỳ lúc nào
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            Dữ liệu được mã hóa an toàn
          </li>
        </ul>
      </div>

      {/* Check-in form */}
      <form className="space-y-6 rounded-[32px] bg-surface-container-low p-6 shadow-sm" onSubmit={handleSubmit}>
        <fieldset>
          <legend className="text-body-md font-semibold text-on-background">Hôm nay em thấy thế nào?</legend>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {options.mood_options.map((option) => (
              <label
                key={option.key}
                className={`flex gap-3 rounded-[16px] border p-4 transition-colors ${
                  moodLabel === option.key
                    ? "border-primary bg-primary-container/20"
                    : "border-outline-variant bg-white hover:bg-surface-container-low"
                }`}
              >
                <input
                  type="radio"
                  name="mood-label"
                  checked={moodLabel === option.key}
                  onChange={() => setMoodLabel(option.key)}
                  className="mt-1 accent-primary"
                />
                <span>
                  <span className="block font-semibold text-on-background">{option.label}</span>
                  <span className="block text-body-md text-on-background/60">{option.helper}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-body-md text-on-background/80" htmlFor="energy-level">
            Năng lượng của em
            <select
              id="energy-level"
              value={energyLevel}
              onChange={(event) => setEnergyLevel(Number(event.target.value))}
              className="mt-2 min-h-11 w-full rounded-[16px] border border-outline-variant bg-white px-4 text-on-background"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <span className="mt-2 block text-on-background/60">{options.energy_scale_label}</span>
          </label>

          <label className="block text-body-md text-on-background/80" htmlFor="stress-level">
            Mức căng thẳng
            <select
              id="stress-level"
              value={stressLevel}
              onChange={(event) => setStressLevel(Number(event.target.value))}
              className="mt-2 min-h-11 w-full rounded-[16px] border border-outline-variant bg-white px-4 text-on-background"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <span className="mt-2 block text-on-background/60">{options.stress_scale_label}</span>
          </label>
        </div>

        <fieldset>
          <legend className="text-body-md font-semibold text-on-background">Điều gì liên quan tới cảm xúc này?</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {options.context_tags.map((tag) => (
              <label
                key={tag.key}
                className={`flex items-center gap-2 rounded-[16px] border px-4 py-3 transition-colors ${
                  contextTags.includes(tag.key)
                    ? "border-primary bg-primary-container/20"
                    : "border-outline-variant bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={contextTags.includes(tag.key)}
                  onChange={() => toggleContext(tag.key)}
                  className="accent-primary"
                />
                <span className="text-body-md text-on-background">{tag.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-body-md font-semibold text-on-background" htmlFor="private-note">
          Ghi chú riêng tư cho chính em (không bắt buộc)
        </label>
        <p id="private-note-helper" className="mt-1 text-body-md text-on-background/60">
          Viết điều em muốn nhớ cho chính mình; ghi chú này không tự động gửi cho người lớn.
        </p>
        <textarea
          id="private-note"
          aria-describedby="private-note-helper"
          value={privateNote}
          onChange={(event) => setPrivateNote(event.target.value)}
          className="mt-2 min-h-28 w-full rounded-[16px] border border-outline-variant p-4 text-body-md text-on-background"
        />

        {errorMessage ? <p role="alert" className="text-body-md text-red-700">{errorMessage}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-[44px] w-full rounded-[16px] bg-primary px-6 py-3 font-semibold text-on-primary disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? "Đang lưu..." : "Lưu check-in"}
        </button>
      </form>

      {/* Result after submission */}
      {result ? <MoodResultCard result={result} /> : null}

      {/* Integrated history section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-headline-md font-semibold text-on-background">Lịch sử check-in</h2>
        </div>

        {history.length === 0 ? (
          <p className="rounded-[32px] bg-surface-container-low p-5 text-body-md text-on-background/70">
            Khi em có check-in cảm xúc, lịch sử sẽ hiển thị ở đây.
          </p>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 5).map((item) => (
              <article
                key={item.id}
                className="rounded-[32px] border border-outline-variant bg-surface-container-low p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-body-md font-semibold text-on-background">
                    {moodLabelFallbacks[item.mood_label]}
                  </span>
                  <span className="text-body-md text-on-background/60">
                    {new Date(item.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-body-md text-on-background/70">
                  <span>Năng lượng: {item.energy_level}/5</span>
                  <span>Căng thẳng: {item.stress_level}/5</span>
                </div>
                <p className="mt-2 text-body-md text-on-background/80">{item.supportive_message}</p>
              </article>
            ))}
            {history.length > 5 ? (
              <Link
                href="/student/mood-check-ins/history"
                className="inline-flex items-center gap-1 px-1 font-semibold text-primary"
              >
                Xem tất cả lịch sử ({history.length} lần)
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </section>
  );
}

function MoodResultCard({ result }: { result: MoodCheckIn }) {
  return (
    <section className="rounded-[32px] bg-surface-container-low p-6 shadow-sm">
      <h2 className="text-body-md font-semibold text-on-background">Đã lưu check-in</h2>
      <p role="status" className="mt-3 text-body-md text-on-background/80">
        <strong>{result.trend_label}:</strong> {result.supportive_message}
      </p>
      <p className="mt-3 text-body-md text-on-background/70">{result.suggested_next_action}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {result.suggest_support_plan ? (
          <Link className="inline-flex min-h-11 items-center font-semibold text-primary" href="/student/support-plan">
            Xem người lớn tin tưởng
          </Link>
        ) : null}
        {result.suggest_sos ? (
          <Link className="inline-flex min-h-11 items-center font-semibold text-red-700" href="/student">
            Tới bảng điều khiển để gửi SOS nếu em chủ động xác nhận
          </Link>
        ) : null}
      </div>
    </section>
  );
}
