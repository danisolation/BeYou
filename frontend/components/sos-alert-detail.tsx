"use client";

import Link from "next/link";
import { useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import {
  SosAlert,
  SosStatus,
  sosSeverityLabels,
  sosStatusLabels,
  updateTeacherSosStatus,
} from "@/lib/sos-api";

const nextStatus: Partial<Record<SosStatus, Exclude<SosStatus, "sent">>> = {
  sent: "received",
  received: "supporting",
  supporting: "completed",
};

const nextStatusButton: Record<Exclude<SosStatus, "sent">, string> = {
  received: "Đánh dấu đã nhận",
  supporting: "Đang hỗ trợ",
  completed: "Hoàn tất hỗ trợ",
};

export function SosStatusBadge({ status }: { status: SosStatus }) {
  return (
    <span className="inline-flex min-h-11 items-center rounded-full bg-secondary px-4 text-heading">
      {sosStatusLabels[status]}
    </span>
  );
}

export function SosAlertDetail({
  initialAlert,
  mode,
}: {
  initialAlert: SosAlert;
  mode: "teacher" | "parent";
}) {
  const [alert, setAlert] = useState(initialAlert);
  const [note, setNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = nextStatus[alert.current_status];

  async function handleStatusUpdate() {
    if (mode !== "teacher" || next === undefined) {
      return;
    }
    setIsUpdating(true);
    setError(null);
    try {
      const updated = await updateTeacherSosStatus(alert.id, { status: next, note: note || null });
      setAlert(updated);
      setNote("");
    } catch {
      setError("Chưa cập nhật được trạng thái. Hãy thử lại từ trang chính.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      <header className="rounded-3xl bg-secondary p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-display">Trạng thái SOS</h1>
          {alert.is_demo ? <DemoBadge /> : null}
        </div>
        <p className="mt-3 text-body">
          {mode === "teacher"
            ? "Cập nhật trạng thái để học sinh và phụ huynh biết tín hiệu đang được xử lý."
            : "Bạn đang xem trạng thái hỗ trợ và tóm tắt được phép xem, không phải câu trả lời riêng tư của học sinh."}
        </p>
        <p className="mt-3 text-label">
          {alert.student.full_name} · {alert.student.school ?? "Chưa cập nhật"} ·{" "}
          {alert.student.class_name ?? "Chưa cập nhật"}
        </p>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <SosStatusBadge status={alert.current_status} />
          <span className="rounded-full border border-[#F3C0C0] px-3 py-2 text-label">
            {sosSeverityLabels[alert.severity]}
          </span>
        </div>
        <p className="mt-4 text-label">Gửi lúc: {new Date(alert.created_at).toLocaleString("vi-VN")}</p>
        {alert.note ? (
          <div className="mt-4 rounded-2xl bg-secondary p-4">
            <h2 className="text-heading">Điều học sinh muốn người lớn biết</h2>
            <p className="mt-2 text-body">{alert.note}</p>
          </div>
        ) : null}
        <p className="mt-4 text-body">
          BeYou v1 không tự động gọi dịch vụ khẩn cấp bên ngoài. Nếu học sinh đang không an toàn ngay lúc này,
          hãy ưu tiên kết nối với người lớn tin cậy ở gần em.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-heading">Tiến trình hỗ trợ</h2>
        <div className="mt-4 space-y-3">
          {alert.status_events.length === 0 ? (
            <p className="text-body">Tín hiệu đã được gửi và đang chờ người lớn tin cậy phản hồi.</p>
          ) : (
            alert.status_events.map((event) => (
              <article key={event.id} className="rounded-2xl border border-[#D7EFE8] p-4">
                <p className="font-semibold">{sosStatusLabels[event.new_status]}</p>
                <p className="text-label">{new Date(event.created_at).toLocaleString("vi-VN")}</p>
                {event.note ? <p className="mt-2 text-body">{event.note}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>

      {mode === "teacher" ? (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-heading">Cập nhật trạng thái SOS</h2>
          {next ? (
            <>
              <label className="mt-4 block text-label" htmlFor="sos-update-note">
                Ghi chú hỗ trợ (không bắt buộc)
              </label>
              <textarea
                id="sos-update-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="mt-2 min-h-28 w-full rounded-2xl border border-[#CFE8E1] p-4"
              />
              {error ? <p className="mt-3 text-body text-red-700">{error}</p> : null}
              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={isUpdating}
                className="mt-4 min-h-11 rounded-2xl bg-accent px-4 font-semibold text-white disabled:opacity-60"
              >
                {isUpdating ? "Đang cập nhật..." : nextStatusButton[next]}
              </button>
            </>
          ) : (
            <p className="mt-3 text-body">SOS này đã hoàn tất. Hãy tiếp tục hỗ trợ học sinh theo kế hoạch phù hợp.</p>
          )}
        </section>
      ) : null}

      <Link className="inline-flex min-h-11 items-center rounded-2xl border border-[#CFE8E1] px-4 font-semibold" href={`/${mode}`}>
        Quay về trang chính
      </Link>
    </main>
  );
}
