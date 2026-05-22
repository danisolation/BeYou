"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type StudentNotificationPreference,
  type StudentNotificationPreferenceUpdate,
} from "@/lib/notification-preferences-api";

function pauseUntil(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function payloadFromState(preference: StudentNotificationPreference): StudentNotificationPreferenceUpdate {
  return {
    in_app_reminders_enabled: preference.in_app_reminders_enabled,
    mood_checkin_reminders_enabled: preference.mood_checkin_reminders_enabled,
    reminder_cadence: preference.reminder_cadence,
    allowed_channels: ["in_app"],
    quiet_hours_start: preference.quiet_hours_start,
    quiet_hours_end: preference.quiet_hours_end,
    timezone: preference.timezone,
    paused_until: preference.paused_until,
    pause_reason_code: preference.pause_reason_code,
  };
}

export default function StudentNotificationPreferencesPage() {
  const [preference, setPreference] = useState<StudentNotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    getNotificationPreferences()
      .then(setPreference)
      .catch(() => setErrorMessage("Chưa tải được cài đặt nhắc nhở. Hãy thử lại sau."))
      .finally(() => setIsLoading(false));
  }, []);

  async function save(nextPreference: StudentNotificationPreference, message: string) {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const saved = await updateNotificationPreferences(payloadFromState(nextPreference));
      setPreference(saved);
      setSuccessMessage(message);
    } catch {
      setErrorMessage("Chưa lưu được cài đặt nhắc nhở. Hãy kiểm tra lại và thử lần nữa.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p>Đang tải cài đặt nhắc nhở...</p>;
  }

  if (preference === null) {
    return <EmptyState heading="Chưa mở được cài đặt nhắc nhở" body={errorMessage ?? undefined} />;
  }

  const remindersEnabled = preference.in_app_reminders_enabled && preference.mood_checkin_reminders_enabled;
  const paused = preference.paused_until ? new Date(preference.paused_until) > new Date() : false;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-secondary p-5 shadow-sm sm:p-6">
        <h1 className="text-display">Nhắc nhở check-in</h1>
        <p className="mt-4 text-body">
          Em kiểm soát việc BeYou có nhắc check-in cảm xúc hay không. Nhắc nhở v1.4 chỉ hiện trong BeYou, không gửi cho
          người lớn, không chấm điểm nguy cơ và không tự tạo SOS.
        </p>
        <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent" href="/student">
          Quay lại bảng điều khiển
        </Link>
      </div>

      <form
        className="space-y-5 rounded-3xl bg-white p-5 shadow-sm sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save(preference, "Đã lưu cài đặt nhắc nhở của em.");
        }}
      >
        <label className="flex items-start gap-3 rounded-2xl border border-[#D7EFE8] p-4">
          <input
            type="checkbox"
            checked={remindersEnabled}
            onChange={(event) =>
              setPreference({
                ...preference,
                in_app_reminders_enabled: event.target.checked,
                mood_checkin_reminders_enabled: event.target.checked,
                paused_until: event.target.checked ? preference.paused_until : null,
                pause_reason_code: event.target.checked ? preference.pause_reason_code : null,
              })
            }
            className="mt-1"
          />
          <span>
            <span className="block font-semibold">Bật nhắc nhở check-in trong BeYou</span>
            <span className="mt-1 block text-label">
              Em có thể tắt hoặc tạm dừng bất cứ lúc nào. Việc bỏ qua nhắc nhở không bị xem là tín hiệu nguy cơ.
            </span>
          </span>
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-label" htmlFor="cadence">
            Tần suất
            <select
              id="cadence"
              value={preference.reminder_cadence}
              onChange={(event) =>
                setPreference({
                  ...preference,
                  reminder_cadence: event.target.value as StudentNotificationPreference["reminder_cadence"],
                })
              }
              className="mt-2 min-h-11 w-full rounded-2xl border border-[#CFE8E1] bg-white px-4"
            >
              <option value="weekly">Hàng tuần</option>
              <option value="daily">Hàng ngày</option>
              <option value="none">Không nhắc</option>
            </select>
          </label>
          <label className="block text-label" htmlFor="quiet-start">
            Yên lặng từ
            <input
              id="quiet-start"
              type="time"
              value={preference.quiet_hours_start ?? ""}
              onChange={(event) => setPreference({ ...preference, quiet_hours_start: event.target.value || null })}
              className="mt-2 min-h-11 w-full rounded-2xl border border-[#CFE8E1] bg-white px-4"
            />
          </label>
          <label className="block text-label" htmlFor="quiet-end">
            Đến
            <input
              id="quiet-end"
              type="time"
              value={preference.quiet_hours_end ?? ""}
              onChange={(event) => setPreference({ ...preference, quiet_hours_end: event.target.value || null })}
              className="mt-2 min-h-11 w-full rounded-2xl border border-[#CFE8E1] bg-white px-4"
            />
          </label>
        </div>

        <section className="rounded-3xl bg-secondary p-4">
          <h2 className="text-heading">Kênh nhắc nhở</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {preference.channel_boundaries.map((channel) => (
              <article key={channel.key} className="rounded-2xl bg-white p-4">
                <p className="font-semibold">{channel.label}</p>
                <p className="mt-1 text-label">
                  {channel.available ? "Đang hỗ trợ trong v1.4" : "Đang hoãn để cần thêm đồng ý và vận hành an toàn"}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[#D7EFE8] p-4">
          <h2 className="text-heading">Tạm dừng</h2>
          <p className="mt-2 text-body">
            Trạng thái hiện tại: {paused ? `đang tạm dừng đến ${new Date(preference.paused_until ?? "").toLocaleString("vi-VN")}` : "không tạm dừng"}.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              className="min-h-11 rounded-2xl border border-[#CFE8E1] px-4 font-semibold hover:border-accent hover:bg-secondary"
              onClick={() =>
                void save(
                  { ...preference, paused_until: pauseUntil(1), pause_reason_code: "student_pause_one_day" },
                  "Đã tạm dừng nhắc nhở trong 1 ngày.",
                )
              }
              disabled={isSaving || !remindersEnabled}
            >
              Tạm dừng 1 ngày
            </button>
            <button
              type="button"
              className="min-h-11 rounded-2xl border border-[#CFE8E1] px-4 font-semibold hover:border-accent hover:bg-secondary"
              onClick={() =>
                void save(
                  { ...preference, paused_until: pauseUntil(7), pause_reason_code: "student_pause_one_week" },
                  "Đã tạm dừng nhắc nhở trong 7 ngày.",
                )
              }
              disabled={isSaving || !remindersEnabled}
            >
              Tạm dừng 7 ngày
            </button>
            <button
              type="button"
              className="min-h-11 rounded-2xl border border-[#CFE8E1] px-4 font-semibold hover:border-accent hover:bg-secondary"
              onClick={() =>
                void save(
                  { ...preference, paused_until: null, pause_reason_code: null },
                  "Đã tiếp tục nhắc nhở khi đủ điều kiện.",
                )
              }
              disabled={isSaving}
            >
              Tiếp tục nhắc nhở
            </button>
          </div>
        </section>

        {errorMessage ? <p role="alert" className="text-body text-red-700">{errorMessage}</p> : null}
        {successMessage ? <p role="status" className="text-body text-accent">{successMessage}</p> : null}
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-11 rounded-2xl bg-accent px-5 font-semibold text-white disabled:opacity-60"
        >
          {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </form>
    </section>
  );
}
