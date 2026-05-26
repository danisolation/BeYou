"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { DemoGuideCard } from "@/components/demo-guide-card";
import { EmptyState } from "@/components/empty-state";
import {
  EntryCard,
  ErrorState,
  LoadingState,
  PageHeader,
  PrivacyBoundaryCard,
  ResponsiveTable,
  StatusBadge,
  SurfaceCard,
} from "@/components/ui-primitives";
import { apiFetch } from "@/lib/api";
import {
  dismissMoodCheckInReminder,
  getMoodCheckInReminder,
  openMoodCheckInReminder,
  snoozeMoodCheckInReminder,
  type MoodCheckInReminder,
} from "@/lib/notification-preferences-api";
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
  const [sosSuccessMessage, setSosSuccessMessage] = useState<string | null>(null);
  const [moodReminder, setMoodReminder] = useState<MoodCheckInReminder | null>(null);
  const [reminderActionMessage, setReminderActionMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isActive = true;

    Promise.all([
      apiFetch<StudentProfile>("/api/student/profile"),
      listStudentSosAlerts().catch(() => []),
      getMoodCheckInReminder().catch(() => null),
    ])
      .then(([studentProfile, alerts, reminder]) => {
        if (!isActive) {
          return;
        }
        setProfile(studentProfile);
        setSosAlerts(alerts);
        setMoodReminder(reminder);
        setLoadFailed(false);
      })
      .catch(() => {
        if (isActive) {
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function handleSendSos() {
    setIsSendingSos(true);
    setSosError(null);
    setSosSuccessMessage(null);
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
      setSosSuccessMessage(
        "Đã gửi SOS hỗ trợ. Người lớn được liên kết sẽ thấy tín hiệu trong Peerlight AI; nếu em đang không an toàn, hãy ở gần người lớn tin tưởng hoặc nguồn hỗ trợ tại nơi em sống.",
      );
    } catch {
      setSosError("Chưa gửi được SOS. Hãy thử lại hoặc tìm người lớn tin tưởng ở gần em.");
    } finally {
      setIsSendingSos(false);
    }
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (loadFailed) {
    return <ErrorState />;
  }

  if (profile === null) {
    return <EmptyState />;
  }

  const teachers = profile.linked_adults.filter((adult) => adult.relationship_type === "teacher");
  const parents = profile.linked_adults.filter((adult) => adult.relationship_type === "parent");

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Vai trò học sinh"
        title={`Xin chào, ${profile.full_name.split(" ")[0]}`}
        description="Peerlight AI giúp em theo dõi trạng thái, luyện phản hồi thực tế và gọi người lớn tin tưởng khi cần."
        actions={
          <>
            {profile.is_demo ? <DemoBadge /> : null}
            <Link className="inline-flex min-h-11 items-center font-semibold text-accent" href="/privacy?review=true">
              Ai có thể xem thông tin của em?
            </Link>
          </>
        }
      />

      <PrivacyBoundaryCard
        title="Thông tin của em là riêng tư theo mặc định"
        description="Người lớn chỉ thấy thông tin trong phạm vi em cho phép hoặc khi có SOS cần hỗ trợ; câu trả lời tự kiểm tra, mood note và trò chuyện riêng tư không tự động được mở."
      >
        <div className="grid gap-3 text-body md:grid-cols-2">
          <p><strong>Họ tên:</strong> {profile.full_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Trường:</strong> {profile.school ?? "Chưa cập nhật"}</p>
          <p><strong>Lớp:</strong> {profile.class_name ?? "Chưa cập nhật"}</p>
        </div>
      </PrivacyBoundaryCard>

      <DemoGuideCard
        title="Đi theo luồng học sinh trong 5 phút"
        body="Bắt đầu bằng quyền riêng tư, sau đó thử một check-in hoặc test tâm lý, mở người lớn tin tưởng, trò chuyện với Peerlight AI và xem cách SOS cần xác nhận rõ ràng."
        steps={[
          "Xem ranh giới quyền riêng tư để biết ai thấy gì.",
          "Ghi một check-in hoặc mở test tâm lý.",
          "Mở kế hoạch hỗ trợ, trò chuyện AI hoặc SOS để thấy cách Peerlight AI ưu tiên an toàn.",
        ]}
        actions={[
          { href: "/privacy?review=true", label: "Xem quyền riêng tư" },
          { href: "/student/mood-check-ins", label: "Thử check-in", primary: true },
          { href: "/student/support-plan", label: "Kế hoạch hỗ trợ" },
        ]}
      />

      {moodReminder?.due ? (
        <MoodReminderCard
          reminder={moodReminder}
          actionMessage={reminderActionMessage}
          onDismiss={async () => {
            const result = await dismissMoodCheckInReminder();
            setMoodReminder(result.reminder);
            setReminderActionMessage("Đã ẩn nhắc nhở. Peerlight AI không gửi thông báo cho người lớn và không tạo SOS.");
          }}
          onSnooze={async () => {
            const result = await snoozeMoodCheckInReminder(240);
            setMoodReminder(result.reminder);
            setReminderActionMessage("Đã nhắc lại sau. Việc tạm hoãn không bị xem là tín hiệu nguy cơ.");
          }}
          onOpen={async () => {
            await openMoodCheckInReminder();
            window.location.href = moodReminder.href;
          }}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ChatEntryCard />
        <WellbeingEntryCard
          title="Test tâm lý"
          body="Chọn bài test ngắn về stress, trầm cảm, lo âu, ADHD hoặc tự kỷ để hiểu trạng thái hiện tại. Kết quả không phải chẩn đoán."
          href="/student/self-checks"
          historyHref="/student/self-checks/history"
          historyLabel="Xem lịch sử test tâm lý"
        />
        <WellbeingEntryCard
          title="Check-in cảm xúc"
          body="Tính năng phụ để ghi nhanh cảm xúc, năng lượng, căng thẳng và một ghi chú riêng tư nếu em muốn."
          href="/student/mood-check-ins"
          historyHref="/student/mood-check-ins/history"
          historyLabel="Xem lịch sử check-in"
          secondaryHref="/student/notification-preferences"
          secondaryLabel="Cài đặt nhắc nhở"
        />
        <WellbeingEntryCard
          title="Tình huống xử lý thực tế"
          body="Chọn một tình huống gần với đời sống học đường để thử cách phản hồi an toàn hơn."
          href="/student/scenarios"
          historyHref="/student/scenarios/history"
          historyLabel="Xem lịch sử tình huống"
        />
        <WellbeingEntryCard
          title="Người lớn tin tưởng"
          body="Chuẩn bị trước điều em muốn chia sẻ và chọn người lớn đã liên kết để hỗ trợ đúng cách."
          href="/student/support-plan"
          historyHref="/student/support-plan"
          historyLabel="Mở kế hoạch hỗ trợ"
        />
      </div>

      <QuickWellbeingTable />

      <section id="peerlight-sos" className="rounded-3xl border-2 border-[#F3C0C0] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-label font-semibold text-red-700">SOS</p>
            <h2 className="mt-2 text-heading">Gửi tín hiệu hỗ trợ</h2>
            <p className="mt-3 text-body">Gửi tín hiệu để người lớn tin tưởng biết em cần hỗ trợ.</p>
            <p className="mt-3 text-label">Peerlight AI không tự động gọi dịch vụ khẩn cấp bên ngoài.</p>
            <p className="mt-2 text-label">
              Nếu em đang thấy không an toàn ngay lúc này, hãy tìm một người lớn tin tưởng ở gần em hoặc liên hệ nguồn hỗ trợ phù hợp tại nơi em sống.
            </p>
            <p className="mt-2 text-label">
              SOS là tín hiệu xin hỗ trợ, không phải bài kiểm tra hay đánh giá lỗi của em.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSosError(null);
              setSosSuccessMessage(null);
              setShowSosConfirm(true);
            }}
            className="min-h-11 w-full rounded-2xl bg-red-600 px-5 font-semibold text-white hover:bg-red-700 sm:w-auto"
          >
            Gửi SOS hỗ trợ
          </button>
        </div>

        {showSosConfirm ? (
          <div className="mt-5 rounded-3xl bg-secondary p-5">
            <h3 className="text-heading">Xác nhận gửi tín hiệu hỗ trợ</h3>
            <p className="mt-3 text-body">
              Em có muốn gửi tín hiệu hỗ trợ ngay bây giờ không? Người lớn tin tưởng được liên kết với em sẽ nhận thông báo trong Peerlight AI.
            </p>
            <p className="mt-2 text-label">
              Chỉ gửi phần ghi chú em nhập ở đây; câu trả lời tự kiểm tra, mood note và trò chuyện riêng tư không tự động được mở.
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
            {sosError ? <p role="alert" className="mt-3 text-body text-red-700">{sosError}</p> : null}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handleSendSos}
                disabled={isSendingSos}
                className="min-h-11 rounded-2xl bg-red-600 px-4 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isSendingSos ? "Đang gửi..." : "Xác nhận gửi SOS"}
              </button>
              <button
                type="button"
                onClick={() => setShowSosConfirm(false)}
                className="min-h-11 rounded-2xl border border-[#CFE8E1] px-4 font-semibold hover:border-accent hover:bg-secondary"
              >
                Ở lại trang này
              </button>
            </div>
          </div>
        ) : null}
        {sosSuccessMessage ? (
          <p role="status" className="mt-5 rounded-2xl border border-accent/30 bg-secondary px-4 py-3 text-body">
            {sosSuccessMessage}
          </p>
        ) : null}
      </section>

      <StudentSosStatusList alerts={sosAlerts} />

      <div className="grid gap-4 lg:grid-cols-2">
        <LinkedAdultGroup title="Giáo viên hỗ trợ" adults={teachers} />
        <LinkedAdultGroup title="Phụ huynh hỗ trợ" adults={parents} />
      </div>
    </section>
  );
}

function MoodReminderCard({
  reminder,
  actionMessage,
  onDismiss,
  onSnooze,
  onOpen,
}: {
  reminder: MoodCheckInReminder;
  actionMessage: string | null;
  onDismiss: () => Promise<void>;
  onSnooze: () => Promise<void>;
  onOpen: () => Promise<void>;
}) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <p className="text-label font-semibold text-accent">Nhắc nhở tùy chọn</p>
      <h2 className="mt-2 text-heading">{reminder.title}</h2>
      <p className="mt-3 text-body">{reminder.body}</p>
      <p className="mt-2 text-label">
        Em có thể bỏ qua hoặc tạm hoãn; Peerlight AI không gửi cho người lớn và không tự tạo SOS từ nhắc nhở này.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => {
            void onOpen();
          }}
          className="min-h-11 rounded-2xl bg-accent px-4 font-semibold text-white"
        >
          Mở check-in
        </button>
        <button
          type="button"
          onClick={() => {
            void onSnooze();
          }}
          className="min-h-11 rounded-2xl border border-[#CFE8E1] px-4 font-semibold hover:border-accent hover:bg-secondary"
        >
          Nhắc lại sau
        </button>
        <button
          type="button"
          onClick={() => {
            void onDismiss();
          }}
          className="min-h-11 rounded-2xl border border-[#CFE8E1] px-4 font-semibold hover:border-accent hover:bg-secondary"
        >
          Bỏ qua hôm nay
        </button>
        <Link className="inline-flex min-h-11 items-center font-semibold text-accent" href="/student/notification-preferences">
          Cài đặt nhắc nhở
        </Link>
      </div>
      {actionMessage ? <p role="status" className="mt-4 text-body text-accent">{actionMessage}</p> : null}
    </SurfaceCard>
  );
}

function ChatEntryCard() {
  return (
    <EntryCard title="Trò chuyện với Peerlight AI" className="hover:-translate-y-0.5 hover:ring-[#D7EFE8]">
      <p className="mt-3 text-body">Mình có thể lắng nghe và giúp em nghĩ về bước an toàn tiếp theo.</p>
      <p className="mt-3 text-label">Peerlight AI không thay thế chuyên gia tư vấn hay bác sĩ.</p>
      <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent" href="/student/chat">
        Mở trò chuyện
      </Link>
    </EntryCard>
  );
}

function QuickWellbeingTable() {
  const rows = [
    ["Test tâm lý", "Nên làm khi em muốn hiểu rõ hơn về một dấu hiệu kéo dài.", "Kết quả: Bình thường / Cần quan tâm / Nguy cơ cao"],
    ["Check-in cảm xúc", "Ghi nhanh trong ngày, không cần chia sẻ nếu em chưa muốn.", "Riêng tư theo mặc định"],
    ["Tình huống xử lý thực tế", "Luyện cách phản hồi với bạn bè, gia đình, áp lực học tập.", "Có Lời khuyên sau mỗi lựa chọn"],
  ];
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#D7EFE8]">
      <div className="border-b border-[#D7EFE8] p-5 sm:p-6">
        <p className="text-label font-semibold uppercase tracking-[0.16em] text-accent">Theo dõi nhanh</p>
        <h2 className="mt-2 text-heading">Bảng trạng thái hỗ trợ của em</h2>
      </div>
      <ResponsiveTable className="rounded-none ring-0">
        <table className="w-full text-left text-body">
          <thead className="bg-secondary text-label uppercase tracking-[0.12em]">
            <tr>
              <th className="px-5 py-3">Mục</th>
              <th className="px-5 py-3">Khi nào dùng</th>
              <th className="px-5 py-3">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([feature, when, note]) => (
              <tr key={feature} className="border-t border-[#D7EFE8]">
                <td className="px-5 py-4 font-semibold">{feature}</td>
                <td className="px-5 py-4">{when}</td>
                <td className="px-5 py-4">{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTable>
    </section>
  );
}

function StudentSosStatusList({ alerts }: { alerts: SosAlert[] }) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        heading="Chưa có tín hiệu SOS nào"
        body="Khi cần, em có thể gửi tín hiệu để người lớn tin tưởng biết em cần hỗ trợ."
      />
    );
  }
  return (
    <SurfaceCard>
      <h2 className="text-heading">Tiến trình SOS của em</h2>
      <div className="mt-4 space-y-3">
        {alerts.slice(0, 5).map((alert) => (
          <article key={alert.id} className="rounded-2xl border border-[#D7EFE8] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{sosStatusLabels[alert.current_status]}</h3>
              <StatusBadge tone={alert.severity === "urgent" ? "sos" : "danger"}>
                {sosSeverityLabels[alert.severity]}
              </StatusBadge>
              {alert.is_demo ? <DemoBadge /> : null}
            </div>
            <p className="mt-2 text-label">Gửi lúc: {new Date(alert.created_at).toLocaleString("vi-VN")}</p>
            {alert.note ? <p className="mt-2 text-body">{alert.note}</p> : null}
          </article>
        ))}
      </div>
    </SurfaceCard>
  );
}

function WellbeingEntryCard({
  title,
  body,
  href,
  historyHref,
  historyLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  body: string;
  href: string;
  historyHref: string;
  historyLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <EntryCard title={title} className="hover:-translate-y-0.5 hover:ring-[#D7EFE8]">
      <p className="mt-3 text-body">{body}</p>
      <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent" href={href}>
        Mở {title}
      </Link>
      <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-accent" href={historyHref}>
        {historyLabel}
      </Link>
      {secondaryHref && secondaryLabel ? (
        <Link className="mt-2 inline-flex min-h-11 items-center font-semibold text-accent" href={secondaryHref}>
          {secondaryLabel}
        </Link>
      ) : null}
    </EntryCard>
  );
}

function LinkedAdultGroup({ title, adults }: { title: string; adults: LinkedAdult[] }) {
  if (adults.length === 0) {
    return <EmptyState heading={title} body="Chưa có người lớn hỗ trợ được liên kết trong mục này." />;
  }
  return (
    <SurfaceCard className="p-5 sm:p-6">
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
    </SurfaceCard>
  );
}
