"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Lock, Monitor, Moon, ShieldAlert, Sun } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { useTheme } from "@/components/theme-provider";
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

export default function StudentSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [preference, setPreference] = useState<StudentNotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    getNotificationPreferences()
      .then(setPreference)
      .catch(() => setErrorMessage("Chưa tải được cài đặt. Hãy thử lại sau."))
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
      setErrorMessage("Chưa lưu được cài đặt. Hãy kiểm tra lại và thử lần nữa.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="p-6 text-body">Đang tải cài đặt...</p>;
  }

  if (preference === null) {
    return <EmptyState heading="Chưa mở được cài đặt" body={errorMessage ?? undefined} />;
  }

  const remindersEnabled = preference.in_app_reminders_enabled && preference.mood_checkin_reminders_enabled;
  const paused = preference.paused_until ? new Date(preference.paused_until) > new Date() : false;

  return (
    <section className="space-y-6">
      <div className="rounded-card border border-outline-variant bg-surface-container p-6 shadow-sm">
        <h1 className="text-display">Cài đặt</h1>
        <p className="mt-3 text-body">
          Quản lý nhắc nhở, cài đặt SOS và quyền riêng tư của em tại đây.
        </p>
        <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary no-underline hover:underline" href="/student">
          ← Quay lại bảng điều khiển
        </Link>
      </div>

      {/* Section: Appearance */}
      <section className="rounded-card border border-outline-variant bg-surface-container p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Sun size={18} className="text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-heading">Giao diện</h2>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex min-h-11 items-center gap-2 rounded-2xl border px-4 font-semibold transition-colors ${
              theme === "light"
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant text-on-background hover:bg-secondary"
            }`}
          >
            <Sun size={16} aria-hidden="true" />
            Sáng
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex min-h-11 items-center gap-2 rounded-2xl border px-4 font-semibold transition-colors ${
              theme === "dark"
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant text-on-background hover:bg-secondary"
            }`}
          >
            <Moon size={16} aria-hidden="true" />
            Tối
          </button>
          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`flex min-h-11 items-center gap-2 rounded-2xl border px-4 font-semibold transition-colors ${
              theme === "system"
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant text-on-background hover:bg-secondary"
            }`}
          >
            <Monitor size={16} aria-hidden="true" />
            Hệ thống
          </button>
        </div>
      </section>

      {/* Section 1: Notifications & Reminders */}
      <form
        className="rounded-card border border-outline-variant bg-surface p-6 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          void save(preference, "Đã lưu cài đặt nhắc nhở.");
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Bell size={18} className="text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-heading">Thông báo & Nhắc nhở</h2>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-card border border-outline-variant p-4">
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
            <span className="block font-semibold text-on-background">Bật nhắc nhở check-in trong Peerlight AI</span>
            <span className="mt-1 block text-label text-on-surface-variant">
              Em có thể tắt hoặc tạm dừng bất cứ lúc nào. Việc bỏ qua nhắc nhở không bị xem là tín hiệu nguy cơ.
            </span>
          </span>
        </label>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
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
              className="mt-2 min-h-11 w-full rounded-2xl border border-outline-variant bg-surface px-4"
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
              className="mt-2 min-h-11 w-full rounded-2xl border border-outline-variant bg-surface px-4"
            />
          </label>
          <label className="block text-label" htmlFor="quiet-end">
            Đến
            <input
              id="quiet-end"
              type="time"
              value={preference.quiet_hours_end ?? ""}
              onChange={(event) => setPreference({ ...preference, quiet_hours_end: event.target.value || null })}
              className="mt-2 min-h-11 w-full rounded-2xl border border-outline-variant bg-surface px-4"
            />
          </label>
        </div>

        <div className="mt-5 rounded-card border border-outline-variant bg-surface-container p-4">
          <h3 className="text-label font-semibold">Tạm dừng nhắc nhở</h3>
          <p className="mt-2 text-body text-on-surface-variant">
            {paused ? `Đang tạm dừng đến ${new Date(preference.paused_until ?? "").toLocaleString("vi-VN")}` : "Không tạm dừng"}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              className="min-h-11 rounded-2xl border border-outline-variant px-4 font-semibold hover:bg-secondary"
              onClick={() =>
                void save(
                  { ...preference, paused_until: pauseUntil(1), pause_reason_code: "student_pause_one_day" },
                  "Đã tạm dừng nhắc nhở trong 1 ngày.",
                )
              }
              disabled={isSaving || !remindersEnabled}
            >
              1 ngày
            </button>
            <button
              type="button"
              className="min-h-11 rounded-2xl border border-outline-variant px-4 font-semibold hover:bg-secondary"
              onClick={() =>
                void save(
                  { ...preference, paused_until: pauseUntil(7), pause_reason_code: "student_pause_one_week" },
                  "Đã tạm dừng nhắc nhở trong 7 ngày.",
                )
              }
              disabled={isSaving || !remindersEnabled}
            >
              7 ngày
            </button>
            <button
              type="button"
              className="min-h-11 rounded-2xl border border-outline-variant px-4 font-semibold hover:bg-secondary"
              onClick={() =>
                void save(
                  { ...preference, paused_until: null, pause_reason_code: null },
                  "Đã tiếp tục nhắc nhở.",
                )
              }
              disabled={isSaving}
            >
              Tiếp tục
            </button>
          </div>
        </div>

        {errorMessage ? <p role="alert" className="mt-4 text-body text-error">{errorMessage}</p> : null}
        {successMessage ? <p role="status" className="mt-4 text-body text-primary">{successMessage}</p> : null}
        <button
          type="submit"
          disabled={isSaving}
          className="mt-5 min-h-11 rounded-2xl bg-primary px-5 font-semibold text-on-primary disabled:opacity-60"
        >
          {isSaving ? "Đang lưu..." : "Lưu cài đặt nhắc nhở"}
        </button>
      </form>

      {/* Section 2: SOS Settings */}
      <section className="rounded-card border border-outline-variant bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-error-container">
            <ShieldAlert size={18} className="text-error" aria-hidden="true" />
          </div>
          <h2 className="text-heading">Cài đặt SOS</h2>
        </div>
        <div className="mt-4 space-y-4">
          <div className="rounded-card border border-outline-variant bg-surface-container p-4">
            <h3 className="text-label font-semibold">Khi em gửi SOS</h3>
            <ul className="mt-2 space-y-1 text-body text-on-surface-variant">
              <li>• Tất cả người lớn tin tưởng được liên kết sẽ nhận thông báo</li>
              <li>• Thông tin được gửi qua hệ thống Peerlight AI an toàn</li>
              <li>• Em không cần giải thích chi tiết nếu chưa sẵn sàng</li>
            </ul>
          </div>
          <div className="rounded-card border border-outline-variant bg-surface-container p-4">
            <h3 className="text-label font-semibold">Quản lý người nhận SOS</h3>
            <p className="mt-2 text-body text-on-surface-variant">
              Danh sách người nhận SOS dựa trên người lớn tin tưởng em đã chọn trong kế hoạch hỗ trợ.
            </p>
            <Link
              href="/student/support-plan"
              className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary no-underline hover:underline"
            >
              Quản lý người lớn tin tưởng →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 3: Privacy */}
      <section className="rounded-card border border-outline-variant bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Lock size={18} className="text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-heading">Quyền riêng tư</h2>
        </div>
        <div className="mt-4 space-y-3">
          <p className="text-body text-on-surface-variant">
            Peerlight AI bảo vệ quyền riêng tư của em. Nội dung trò chuyện không được chia sẻ với người lớn trừ khi em chọn chia sẻ hoặc trong trường hợp SOS khẩn cấp.
          </p>
          <p className="text-body text-on-surface-variant">
            Dữ liệu check-in cảm xúc chỉ hiển thị xu hướng tổng quát cho người lớn, không hiển thị nội dung chi tiết.
          </p>
          <p className="text-label">
            <a href="/privacy-policy" className="font-semibold text-primary no-underline hover:underline">
              Đọc chính sách quyền riêng tư đầy đủ →
            </a>
          </p>
        </div>
      </section>
    </section>
  );
}
