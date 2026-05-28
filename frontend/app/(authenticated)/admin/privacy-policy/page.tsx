"use client";

import { useEffect, useState } from "react";

import {
  ACCESS_REASON_OPTIONS,
  getAdminPrivacyPolicy,
  type AdminPrivacyPolicy,
  type AdminPrivacyPolicyUpdate,
  updateAdminPrivacyPolicy,
} from "@/lib/admin-privacy-policy-api";

function policyPayload(policy: AdminPrivacyPolicy): AdminPrivacyPolicyUpdate {
  return {
    default_in_app_reminders_enabled: policy.default_in_app_reminders_enabled,
    default_quiet_hours_start: policy.default_quiet_hours_start,
    default_quiet_hours_end: policy.default_quiet_hours_end,
    default_timezone: policy.default_timezone,
    allowed_channels: ["in_app"],
    external_channels_enabled: false,
    note_sharing_enabled: policy.note_sharing_enabled,
    reason_required_for_adult_summaries: policy.reason_required_for_adult_summaries,
    reason_required_for_shared_mood_notes: policy.reason_required_for_shared_mood_notes,
    allowed_reason_codes: policy.allowed_reason_codes,
  };
}

export default function AdminPrivacyPolicyPage() {
  const [policy, setPolicy] = useState<AdminPrivacyPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    getAdminPrivacyPolicy()
      .then(setPolicy)
      .catch(() => setErrorMessage("Chưa tải được chính sách riêng tư. Hãy thử lại từ cổng quản trị."))
      .finally(() => setIsLoading(false));
  }, []);

  async function savePolicy() {
    if (policy === null || policy.allowed_reason_codes.length === 0) {
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const saved = await updateAdminPrivacyPolicy(policyPayload(policy));
      setPolicy(saved);
      setSuccessMessage("Đã lưu chính sách riêng tư v1.4.");
    } catch {
      setErrorMessage("Chưa lưu được chính sách. Kiểm tra lại cài đặt an toàn và thử lần nữa.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleReason(code: string, enabled: boolean) {
    if (policy === null) {
      return;
    }
    const nextReasons = enabled
      ? Array.from(new Set([...policy.allowed_reason_codes, code]))
      : policy.allowed_reason_codes.filter((reasonCode) => reasonCode !== code);
    setPolicy({ ...policy, allowed_reason_codes: nextReasons });
  }

  if (isLoading) {
    return <p>Đang tải chính sách riêng tư...</p>;
  }

  if (policy === null) {
    return (
      <section className="rounded-2xl bg-white dark:bg-[#1a2940] p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Chưa mở được chính sách riêng tư</h1>
        <p className="mt-3 text-sm">{errorMessage ?? "Hãy thử lại từ cổng quản trị."}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl bg-primary/5 p-6 shadow-sm">
        <p className="text-xs font-semibold text-primary">Cấu hình an toàn</p>
        <h1 className="mt-2 text-lg font-semibold">Chính sách riêng tư v1.4</h1>
        <p className="mt-3 max-w-3xl text-sm">
          Quản lý mặc định đồng ý nhắc nhở, chia sẻ ghi chú và lý do truy cập. v1.4 chỉ dùng nhắc nhở trong Peerlight AI; Zalo,
          SMS, push và email vẫn đang hoãn để có đủ quản trị đồng ý, vận hành và quyền riêng tư.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl bg-white dark:bg-[#1a2940] p-6 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          void savePolicy();
        }}
      >
        <section className="space-y-4">
          <h2 className="text-sm font-semibold">Nhắc nhở mặc định</h2>
          <label className="flex items-start gap-3 rounded-2xl border border-outline-variant/20 p-4">
            <input
              type="checkbox"
              aria-label="Bật mặc định nhắc nhở trong Peerlight AI"
              checked={policy.default_in_app_reminders_enabled}
              onChange={(event) =>
                setPolicy({ ...policy, default_in_app_reminders_enabled: event.target.checked })
              }
              className="mt-1"
            />
            <span>
              <span className="block font-semibold">Bật mặc định nhắc nhở trong Peerlight AI</span>
              <span className="mt-1 block text-xs">
                Học sinh vẫn giữ quyền bật/tắt và tạm dừng. Mặc định này không gửi người lớn và không tạo SOS.
              </span>
            </span>
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-xs" htmlFor="quiet-start">
              Yên lặng từ
            <input
                id="quiet-start"
                aria-label="Yên lặng từ"
                type="time"
                value={policy.default_quiet_hours_start ?? ""}
                onChange={(event) =>
                  setPolicy({ ...policy, default_quiet_hours_start: event.target.value || null })
                }
                className="mt-2 min-h-11 w-full rounded-2xl border border-outline-variant/30 bg-white px-4"
              />
            </label>
            <label className="block text-xs" htmlFor="quiet-end">
              Đến
              <input
                id="quiet-end"
                aria-label="Đến"
                type="time"
                value={policy.default_quiet_hours_end ?? ""}
                onChange={(event) => setPolicy({ ...policy, default_quiet_hours_end: event.target.value || null })}
                className="mt-2 min-h-11 w-full rounded-2xl border border-outline-variant/30 bg-white px-4"
              />
            </label>
            <label className="block text-xs" htmlFor="timezone">
              Múi giờ
              <input
                id="timezone"
                value={policy.default_timezone}
                onChange={(event) => setPolicy({ ...policy, default_timezone: event.target.value })}
                className="mt-2 min-h-11 w-full rounded-2xl border border-outline-variant/30 bg-white px-4"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-primary/5 p-4">
          <h2 className="text-sm font-semibold">Kênh nhắc nhở</h2>
          <p className="mt-2 text-sm">Chỉ kênh trong ứng dụng được bật trong v1.4; các kênh ngoài vẫn đang hoãn.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {policy.channel_boundaries.map((channel) => (
              <article key={channel.key} className="rounded-2xl bg-white dark:bg-[#1a2940] p-4">
                <p className="font-semibold">{channel.label}</p>
                <p className="mt-1 text-xs">
                  {channel.available ? "Đang hỗ trợ trong v1.4" : "Đang hoãn để cần thêm đồng ý và vận hành an toàn"}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold">Chia sẻ và lý do truy cập</h2>
          <label className="flex items-start gap-3 rounded-2xl border border-outline-variant/20 p-4">
            <input
              type="checkbox"
              aria-label="Cho phép học sinh tự chọn chia sẻ ghi chú/tóm tắt"
              checked={policy.note_sharing_enabled}
              onChange={(event) => setPolicy({ ...policy, note_sharing_enabled: event.target.checked })}
              className="mt-1"
            />
            <span>Cho phép học sinh tự chọn chia sẻ ghi chú/tóm tắt với người lớn đang liên kết.</span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-outline-variant/20 p-4">
            <input
              type="checkbox"
              aria-label="Yêu cầu lý do trước khi người lớn xem tóm tắt hỗ trợ"
              checked={policy.reason_required_for_adult_summaries}
              onChange={(event) =>
                setPolicy({ ...policy, reason_required_for_adult_summaries: event.target.checked })
              }
              className="mt-1"
            />
            <span>Yêu cầu lý do trước khi người lớn xem tóm tắt hỗ trợ được bảo vệ.</span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-outline-variant/20 p-4">
            <input
              type="checkbox"
              aria-label="Yêu cầu lý do cho các lượt đọc ghi chú/tóm tắt học sinh đã chia sẻ"
              checked={policy.reason_required_for_shared_mood_notes}
              onChange={(event) =>
                setPolicy({ ...policy, reason_required_for_shared_mood_notes: event.target.checked })
              }
              className="mt-1"
            />
            <span>Yêu cầu lý do cho các lượt đọc ghi chú/tóm tắt học sinh đã chia sẻ.</span>
          </label>
        </section>

        <fieldset className="space-y-3 rounded-2xl border border-outline-variant/20 p-4">
          <legend className="text-sm font-semibold">Lý do truy cập được phép</legend>
          <p className="text-sm">Chỉ dùng mã lý do kiểm soát sẵn; không thu lý do tự nhập.</p>
          {ACCESS_REASON_OPTIONS.map((reason) => (
            <label key={reason.code} className="flex items-start gap-3 rounded-2xl bg-primary/5 p-3">
              <input
                type="checkbox"
                aria-label={reason.label}
                checked={policy.allowed_reason_codes.includes(reason.code)}
                onChange={(event) => toggleReason(reason.code, event.target.checked)}
                className="mt-1"
              />
              <span>{reason.label}</span>
            </label>
          ))}
        </fieldset>

        <section className="rounded-2xl bg-primary/5 p-4">
          <h2 className="text-sm font-semibold">Ranh giới vận hành</h2>
          <p className="mt-2 text-sm">
            Operations chỉ hiển thị count/status metadata, không xuất dữ liệu thô, không drilldown học sinh, không dùng để
            xếp hạng hay giám sát.
          </p>
          <p className="mt-2 text-xs">
            Lý do truy cập dùng để minh bạch hỗ trợ, không mở rộng quyền xem ngoài vai trò và liên kết đang hoạt động.
          </p>
        </section>

        {errorMessage ? <p role="alert" className="text-sm text-red-700">{errorMessage}</p> : null}
        {successMessage ? <p role="status" className="text-sm text-primary">{successMessage}</p> : null}
        <button
          type="submit"
          disabled={isSaving || policy.allowed_reason_codes.length === 0}
          className="min-h-11 rounded-2xl bg-primary px-5 font-semibold text-white disabled:opacity-60"
        >
          {isSaving ? "Đang lưu..." : "Lưu chính sách"}
        </button>
      </form>
    </section>
  );
}

