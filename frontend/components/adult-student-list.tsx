import Link from "next/link";

import { DemoBadge } from "@/components/demo-badge";
import { DemoGuideCard } from "@/components/demo-guide-card";
import { EmptyState } from "@/components/empty-state";
import { EntryCard, PageHeader, StatusBadge, SurfaceCard } from "@/components/ui-primitives";
import { sosStatusLabels, type AdultSupportOverviewItem, type InAppNotification } from "@/lib/sos-api";

export type AdultLinkedStudent = {
  id: string;
  full_name: string;
  email: string;
  school: string | null;
  class_name: string | null;
  relationship_type: string;
  link_status: string;
  is_demo: boolean;
};

type AdultStudentListProps = {
  roleContext: "teacher" | "parent";
  title: string;
  subtitle: string;
  students: AdultLinkedStudent[];
  emptyBody: string;
  summaryTitle: string;
  summaryBasePath: "/teacher/students" | "/parent/students";
  summaryCta: string;
  sosBasePath?: "/teacher/sos-alerts" | "/parent/sos-alerts";
  sosCta?: string;
  supportOverview?: AdultSupportOverviewItem[];
  notifications?: InAppNotification[];
};

export function AdultStudentList({
  roleContext,
  title,
  subtitle,
  students,
  emptyBody,
  summaryTitle,
  summaryBasePath,
  summaryCta,
  sosBasePath,
  sosCta,
  supportOverview = [],
  notifications = [],
}: AdultStudentListProps) {
  const supportByStudent = new Map(supportOverview.map((item) => [item.student.id, item]));
  const firstStudent = students[0];
  const isParent = roleContext === "parent";

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow={isParent ? "Vai trò phụ huynh" : "Vai trò giáo viên"}
        title={title}
        description={subtitle}
      />
      <AdultPrivacyBoundaryCard roleContext={roleContext} />
      <DemoGuideCard
        title={isParent ? "Đi theo luồng phụ huynh" : "Đi theo luồng giáo viên"}
        body={
          isParent
            ? "Phụ huynh xem tóm tắt hỗ trợ và trạng thái SOS trong phạm vi được liên kết, không xem dữ liệu riêng tư thô của học sinh."
            : "Giáo viên xem tóm tắt hỗ trợ, kế hoạch/mood được phép chia sẻ và có thể cập nhật trạng thái SOS khi đang hỗ trợ."
        }
        steps={[
          "Kiểm tra ranh giới hỗ trợ và thông báo SOS.",
          "Mở tóm tắt tự kiểm tra hoặc kế hoạch & mood của học sinh demo.",
          isParent ? "Xem trạng thái SOS ở chế độ hỗ trợ/read-only." : "Mở trạng thái SOS và cập nhật tiến trình hỗ trợ nếu có.",
        ]}
        actions={
          firstStudent
            ? [
                {
                  href: `${summaryBasePath}/${firstStudent.id}/support-summary`,
                  label: "Mở demo kế hoạch & mood",
                  primary: true,
                },
                {
                  href: `${summaryBasePath}/${firstStudent.id}/self-check-summaries`,
                  label: "Xem tóm tắt tự kiểm tra",
                },
              ]
            : []
        }
      />
      <NotificationList notifications={notifications} />
      {students.length === 0 ? (
        <EmptyState heading="Chưa có học sinh được liên kết" body={emptyBody} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {students.map((student) => (
            <EntryCard
              key={student.id}
              title={student.full_name}
              badge={student.is_demo ? <DemoBadge /> : null}
              className="min-w-0 hover:-translate-y-0.5 hover:ring-[#D7EFE8]"
            >
              <p className="break-all text-label">{student.email}</p>
              <p className="mt-3 text-body">Trường: {student.school ?? "Chưa cập nhật"}</p>
              <p className="text-body">Lớp: {student.class_name ?? "Chưa cập nhật"}</p>
              <p className="mt-3 text-label">Trạng thái liên kết: {student.link_status}</p>
              <SupportOverviewCard
                support={supportByStudent.get(student.id)}
                sosBasePath={sosBasePath}
                sosCta={sosCta}
              />
              <SurfaceCard className="mt-5 bg-secondary p-4 shadow-none ring-0">
                <h3 className="text-heading">{summaryTitle}</h3>
                <p className="mt-2 text-body">Peerlight AI chỉ hiển thị phần tóm tắt được phép xem để hỗ trợ học sinh.</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-accent px-4 font-semibold text-white hover:bg-[#238C78]"
                    href={`${summaryBasePath}/${student.id}/self-check-summaries`}
                  >
                    {summaryCta}
                  </Link>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#CFE8E1] px-4 font-semibold hover:border-accent hover:bg-white"
                    href={`${summaryBasePath}/${student.id}/support-summary`}
                  >
                    Xem kế hoạch & mood
                  </Link>
                </div>
              </SurfaceCard>
            </EntryCard>
          ))}
        </div>
      )}
    </section>
  );
}

function AdultPrivacyBoundaryCard({ roleContext }: { roleContext: "teacher" | "parent" }) {
  const isParent = roleContext === "parent";

  return (
    <SurfaceCard>
      <h2 className="text-heading">
        {isParent ? "Ranh giới hỗ trợ của phụ huynh" : "Ranh giới hỗ trợ của giáo viên"}
      </h2>
      <p className="mt-3 text-body">
        {isParent
          ? "Phụ huynh chỉ xem thông tin của con đã được liên kết: tóm tắt hỗ trợ, trạng thái SOS và gợi ý cần thiết để đồng hành."
          : "Giáo viên chỉ xem học sinh được liên kết: tóm tắt hỗ trợ, trạng thái SOS và gợi ý cần thiết để phối hợp chăm sóc."}
      </p>
      <p className="mt-3 text-body">
        Peerlight AI không hiển thị câu trả lời test tâm lý chi tiết hoặc nội dung trò chuyện riêng tư tại cổng người lớn.
      </p>
      <p className="mt-3 text-label">
        Hãy dùng các tóm tắt này để mở lời hỗ trợ, không để giám sát, xếp hạng hoặc tạo áp lực cho học sinh.
      </p>
    </SurfaceCard>
  );
}

function NotificationList({ notifications }: { notifications: InAppNotification[] }) {
  return (
    <SurfaceCard>
      <h2 className="text-heading">Thông báo hỗ trợ</h2>
      {notifications.length === 0 ? (
        <p className="mt-3 text-body">Chưa có thông báo SOS mới từ học sinh được liên kết.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {notifications.slice(0, 5).map((notification) => (
            <article key={notification.id} className="rounded-2xl border border-[#D7EFE8] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{notification.title}</h3>
                {notification.is_demo ? <DemoBadge /> : null}
                {notification.read_at === null ? <StatusBadge tone="safe">Mới</StatusBadge> : null}
              </div>
              <p className="mt-2 text-body">{notification.body}</p>
              {notification.href ? (
                <Link className="mt-3 inline-flex min-h-11 items-center font-semibold text-accent" href={notification.href}>
                  Mở trạng thái SOS
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}

function supportTone(support: AdultSupportOverviewItem): "safe" | "warning" | "danger" {
  if (support.latest_sos_alert || support.warning_group === "nguy_co_cao") {
    return "danger";
  }
  return support.warning_group === "can_quan_tam" ? "warning" : "safe";
}

function SupportOverviewCard({
  support,
  sosBasePath,
  sosCta,
}: {
  support?: AdultSupportOverviewItem;
  sosBasePath?: "/teacher/sos-alerts" | "/parent/sos-alerts";
  sosCta?: string;
}) {
  if (!support) {
    return (
      <SurfaceCard className="mt-5 bg-secondary p-4 shadow-none ring-0">
        <h3 className="text-heading">{sosCta === "Xem trạng thái SOS" ? "Trạng thái SOS của con" : "Tóm tắt hỗ trợ"}</h3>
        <p className="mt-2 text-body">Chưa có tóm tắt SOS hoặc tự kiểm tra mới cho học sinh này.</p>
      </SurfaceCard>
    );
  }

  const heading = sosCta === "Xem trạng thái SOS" ? "Trạng thái SOS của con" : "Tóm tắt hỗ trợ";

  return (
    <SurfaceCard className="mt-5 bg-secondary p-4 shadow-none ring-0">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-heading">{heading}</h3>
        <StatusBadge tone={supportTone(support)}>{support.warning_group_label}</StatusBadge>
      </div>
      {support.latest_self_check_summary ? (
        <p className="mt-3 text-body">{support.latest_self_check_summary.support_suggestion}</p>
      ) : (
        <p className="mt-3 text-body">Chưa có tóm tắt tự kiểm tra gần nhất được phép xem.</p>
      )}
      {support.latest_sos_alert ? (
        <div className="mt-3 rounded-2xl border border-red-200 bg-white p-3">
          <p className="text-label">SOS hiện tại: {sosStatusLabels[support.latest_sos_alert.current_status]}</p>
          <p className="text-label">Số SOS đang mở: {support.open_sos_count}</p>
          {sosBasePath && sosCta ? (
            <Link
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-2xl bg-red-600 px-4 font-semibold text-white hover:bg-red-700"
              href={`${sosBasePath}/${support.latest_sos_alert.id}`}
            >
              {sosCta}
            </Link>
          ) : null}
        </div>
      ) : null}
    </SurfaceCard>
  );
}
