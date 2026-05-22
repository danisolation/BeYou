"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { apiFetch } from "@/lib/api";
import {
  createStudentSosAlert,
  listStudentSosAlerts,
  type SosAlert,
  type SosSeverity,
  sosSeverityLabels,
  sosStatusLabels,
} from "@/lib/sos-api";

type LinkedAdult = {
  id: string;
  full_name: string;
  email: string;
  relationship_type: "teacher" | "parent";
  link_status: string;
  is_demo: boolean;
};

type StudentProfile = {
  id: string;
  full_name: string;
  email: string;
  school: string | null;
  class_name: string | null;
  is_demo: boolean;
  linked_adults: LinkedAdult[];
};

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [sosSeverity, setSosSeverity] = useState<SosSeverity>("support");
  const [sosNote, setSosNote] = useState("");
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [sosError, setSosError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiFetch<StudentProfile>("/api/student/profile"), listStudentSosAlerts().catch(() => [])])
      .then(([studentProfile, alerts]) => {
        setProfile(studentProfile);
        setSosAlerts(alerts);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSendSos() {
    setIsSendingSos(true);
    setSosError(null);
    try {
      const alert = await createStudentSosAlert({
        severity: sosSeverity,
        source: "student_dashboard",
        note: sosNote || null,
      });
      setSosAlerts((current) => [alert, ...current]);
      setShowSosConfirm(false);
      setSosNote("");
      setSosSeverity("support");
    } catch {
      setSosError("Chưa gửi được SOS. Hãy thử lại hoặc tìm người lớn tin cậy ở gần em.");
    } finally {
      setIsSendingSos(false);
    }
  }

  if (isLoading) {
    return <p>Đang tải thông tin...</p>;
  }

  if (profile === null) {
    return <EmptyState />;
  }

  const teachers = profile.linked_adults.filter((adult) => adult.relationship_type === "teacher");
  const parents = profile.linked_adults.filter((adult) => adult.relationship_type === "parent");

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-secondary p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display">Bảng điều khiển của em</h1>
          {profile.is_demo ? <DemoBadge /> : null}
        </div>
        <div className="mt-5 grid gap-3 text-body md:grid-cols-2">
          <p><strong>Họ tên:</strong> {profile.full_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Trường:</strong> {profile.school ?? "Chưa cập nhật"}</p>
          <p><strong>Lớp:</strong> {profile.class_name ?? "Chưa cập nhật"}</p>
        </div>
        <Link className="mt-5 inline-flex min-h-11 items-center font-semibold text-accent" href="/privacy?review=true">
          Ai có thể xem thông tin của em?
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChatEntryCard />
        <WellbeingEntryCard
          title="Tự kiểm tra cảm xúc"
          body="Chọn một bài ngắn để hiểu trạng thái hiện tại của em. Kết quả không phải chẩn đoán."
          href="/student/self-checks"
          historyHref="/student/self-checks/history"
          historyLabel="Xem lịch sử tự kiểm tra"
        />
        <WellbeingEntryCard
          title="Tình huống luyện tập"
          body="Chọn một tình huống gần với đời sống học đường để thử cách phản hồi an toàn hơn."
          href="/student/scenarios"
          historyHref="/student/scenarios/history"
          historyLabel="Xem lịch sử tình huống"
        />
        <WellbeingEntryCard
          title="Kế hoạch người lớn tin cậy"
          body="Chuẩn bị trước điều em muốn chia sẻ và chọn người lớn đã liên kết để hỗ trợ đúng cách."
          href="/student/support-plan"
          historyHref="/student/support-plan"
          historyLabel="Mở kế hoạch hỗ trợ"
        />
      </div>

      <section className="rounded-3xl border-2 border-[#F3C0C0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-label font-semibold text-red-700">SOS</p>
            <h2 className="mt-2 text-heading">Gửi tín hiệu hỗ trợ</h2>
            <p className="mt-3 text-body">Gửi tín hiệu để người lớn tin cậy biết em cần hỗ trợ.</p>
            <p className="mt-3 text-label">BeYou v1 không tự động gọi dịch vụ khẩn cấp bên ngoài.</p>
            <p className="mt-2 text-label">
              Nếu em đang thấy không an toàn ngay lúc này, hãy tìm một người lớn tin cậy ở gần em hoặc liên hệ nguồn hỗ trợ phù hợp tại nơi em sống.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSosConfirm(true)}
            className="min-h-11 rounded-2xl bg-red-600 px-5 font-semibold text-white"
          >
            Gửi SOS hỗ trợ
          </button>
        </div>

        {showSosConfirm ? (
          <div className="mt-5 rounded-3xl bg-secondary p-5">
            <h3 className="text-heading">Xác nhận gửi tín hiệu hỗ trợ</h3>
            <p className="mt-3 text-body">
              Em có muốn gửi tín hiệu hỗ trợ ngay bây giờ không? Người lớn tin cậy được liên kết với em sẽ nhận thông báo trong BeYou.
            </p>
            <fieldset className="mt-4 space-y-3">
              <legend className="text-label font-semibold">Mức hỗ trợ em cần</legend>
              {(["support", "urgent"] as SosSeverity[]).map((severity) => (
                <label key={severity} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                  <input
                    type="radio"
                    name="sos-severity"
                    checked={sosSeverity === severity}
                    onChange={() => setSosSeverity(severity)}
                  />
                  <span>{sosSeverityLabels[severity]}</span>
                </label>
              ))}
            </fieldset>
            <label className="mt-4 block text-label" htmlFor="sos-note">
              Điều em muốn người lớn biết lúc này (không bắt buộc)
            </label>
            <textarea
              id="sos-note"
              value={sosNote}
              onChange={(event) => setSosNote(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-2xl border border-[#CFE8E1] p-4"
            />
            {sosError ? <p className="mt-3 text-body text-red-700">{sosError}</p> : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSendSos}
                disabled={isSendingSos}
                className="min-h-11 rounded-2xl bg-red-600 px-4 font-semibold text-white disabled:opacity-60"
              >
                {isSendingSos ? "Đang gửi..." : "Xác nhận gửi SOS"}
              </button>
              <button
                type="button"
                onClick={() => setShowSosConfirm(false)}
                className="min-h-11 rounded-2xl border border-[#CFE8E1] px-4 font-semibold"
              >
                Ở lại trang này
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <StudentSosStatusList alerts={sosAlerts} />

      <div className="grid gap-4 md:grid-cols-2">
        <LinkedAdultGroup title="Giáo viên hỗ trợ" adults={teachers} />
        <LinkedAdultGroup title="Phụ huynh hỗ trợ" adults={parents} />
      </div>
    </section>
  );
}

function ChatEntryCard() {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <Link className="inline-flex min-h-11 items-center text-heading text-[#12332E]" href="/student/chat">
        Trò chuyện với BeYou
      </Link>
      <p className="mt-3 text-body">Mình có thể lắng nghe và giúp em nghĩ về bước an toàn tiếp theo.</p>
      <p className="mt-3 text-label">BeYou không thay thế chuyên gia tư vấn hay bác sĩ.</p>
      <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent" href="/student/chat">
        Mở trò chuyện
      </Link>
    </article>
  );
}

function StudentSosStatusList({ alerts }: { alerts: SosAlert[] }) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        heading="Chưa có tín hiệu SOS nào"
        body="Khi cần, em có thể gửi tín hiệu để người lớn tin cậy biết em cần hỗ trợ."
      />
    );
  }
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-heading">Tiến trình SOS của em</h2>
      <div className="mt-4 space-y-3">
        {alerts.slice(0, 5).map((alert) => (
          <article key={alert.id} className="rounded-2xl border border-[#D7EFE8] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{sosStatusLabels[alert.current_status]}</h3>
              <span className="rounded-full bg-secondary px-3 py-1 text-label">{sosSeverityLabels[alert.severity]}</span>
              {alert.is_demo ? <DemoBadge /> : null}
            </div>
            <p className="mt-2 text-label">Gửi lúc: {new Date(alert.created_at).toLocaleString("vi-VN")}</p>
            {alert.note ? <p className="mt-2 text-body">{alert.note}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function WellbeingEntryCard({
  title,
  body,
  href,
  historyHref,
  historyLabel,
}: {
  title: string;
  body: string;
  href: string;
  historyHref: string;
  historyLabel: string;
}) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <Link className="inline-flex min-h-11 items-center text-heading text-[#12332E]" href={href}>
        {title}
      </Link>
      <p className="mt-3 text-body">{body}</p>
      <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent" href={historyHref}>
        {historyLabel}
      </Link>
    </article>
  );
}

function LinkedAdultGroup({ title, adults }: { title: string; adults: LinkedAdult[] }) {
  if (adults.length === 0) {
    return <EmptyState heading={title} body="Chưa có người lớn hỗ trợ được liên kết trong mục này." />;
  }
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-heading">{title}</h2>
      <div className="mt-4 space-y-3">
        {adults.map((adult) => (
          <article key={adult.id} className="rounded-2xl border border-[#D7EFE8] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{adult.full_name}</h3>
              {adult.is_demo ? <DemoBadge /> : null}
            </div>
            <p className="text-label">{adult.email}</p>
            <p className="text-label">Trạng thái liên kết: {adult.link_status}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
