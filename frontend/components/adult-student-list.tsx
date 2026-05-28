import Link from "next/link";

import { DemoGuideCard } from "@/components/demo-guide-card";
import { EmptyState } from "@/components/empty-state";
import { EntryCard, PageHeader, PrivacyBoundaryCard, StatusBadge, SurfaceCard } from "@/components/ui-primitives";
import { type OptionalDashboardResult } from "@/lib/dashboard-loading";
import { safeInternalHref } from "@/lib/safe-navigation";
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
  supportOverviewState: OptionalDashboardResult<AdultSupportOverviewItem[]>;
  notificationsState: OptionalDashboardResult<InAppNotification[]>;
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
  supportOverviewState,
  notificationsState,
}: AdultStudentListProps) {
  const supportOverview = supportOverviewState.status === "ready" ? supportOverviewState.data : [];
  const supportUnavailable = supportOverviewState.status === "unavailable";
  const supportByStudent = new Map(supportOverview.map((item) => [item.student.id, item]));
  const visibleStudents = supportUnavailable ? students : students.filter((student) => supportByStudent.has(student.id));
  const firstStudent = visibleStudents[0];
  const isParent = roleContext === "parent";

  return (
    <section className="space-y-6">
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
      <NotificationList notificationsState={notificationsState} />
      {students.length === 0 ? (
        <EmptyState heading="Chưa có học sinh được liên kết" body={emptyBody} />
      ) : visibleStudents.length === 0 ? (
        <EmptyState
          heading="Chưa có học sinh SOS được phép xem"
          body="Khi có tín hiệu SOS hoặc tóm tắt hỗ trợ được phép xem, mục này sẽ hiển thị tại đây."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleStudents.map((student) => (
            <EntryCard
              key={student.id}
              title={student.full_name}
              className="min-w-0 hover:-translate-y-0.5 hover:ring-[#D7EFE8]"
            >
              <p className="break-all text-xs">{student.email}</p>
              <p className="mt-3 text-sm">Trường: {student.school ?? "Chưa cập nhật"}</p>
              <p className="text-sm">Lớp: {student.class_name ?? "Chưa cập nhật"}</p>
              <p className="mt-3 text-xs">Trạng thái liên kết: {student.link_status}</p>
              <SupportOverviewCard
                support={supportByStudent.get(student.id)}
                unavailableMessage={supportOverviewState.status === "unavailable" ? supportOverviewState.message : undefined}
                sosBasePath={sosBasePath}
                sosCta={sosCta}
              />
              <SurfaceCard className="mt-5 bg-primary/5 p-4 shadow-none ring-0">
                <h3 className="text-sm font-semibold">{summaryTitle}</h3>
                <p className="mt-2 text-sm">Peerlight AI chỉ hiển thị phần tóm tắt được phép xem để hỗ trợ học sinh.</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-4 font-semibold text-white hover:bg-primary/80"
                    href={`${summaryBasePath}/${student.id}/self-check-summaries`}
                  >
                    {summaryCta}
                  </Link>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-outline-variant/30 px-4 font-semibold hover:border-primary hover:bg-white"
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
    <PrivacyBoundaryCard
      title={isParent ? "Ranh giới hỗ trợ của phụ huynh" : "Ranh giới hỗ trợ của giáo viên"}
      description={
        isParent
          ? "Phụ huynh chỉ xem thông tin hỗ trợ và trạng thái SOS được phép xem; vai trò này là đồng hành/read-only, không cập nhật trạng thái thay học sinh hoặc giáo viên."
          : "Giáo viên chỉ xem học sinh được liên kết và thông tin SOS/tóm tắt được phép xem để phối hợp hỗ trợ, không giám sát."
      }
    >
      <p className="mt-3 text-sm">
        Peerlight AI không hiển thị câu trả lời test tâm lý chi tiết hoặc nội dung trò chuyện riêng tư tại cổng người lớn.
      </p>
      <p className="mt-3 text-xs">
        Hãy dùng các tóm tắt này để mở lời hỗ trợ, không để giám sát, xếp hạng hoặc tạo áp lực cho học sinh.
      </p>
    </PrivacyBoundaryCard>
  );
}

function NotificationList({ notificationsState }: { notificationsState: OptionalDashboardResult<InAppNotification[]> }) {
  if (notificationsState.status === "unavailable") {
    return (
      <div role="status" aria-live="polite">
        <SurfaceCard>
          <h2 className="text-sm font-semibold">Thông báo hỗ trợ</h2>
          <p className="mt-3 text-sm">Thông báo hỗ trợ tạm thời chưa tải được.</p>
        </SurfaceCard>
      </div>
    );
  }

  const notifications = notificationsState.data;

  return (
    <SurfaceCard>
      <h2 className="text-sm font-semibold">Thông báo hỗ trợ</h2>
      {notifications.length === 0 ? (
        <p className="mt-3 text-sm">Chưa có thông báo SOS mới từ học sinh được liên kết.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {notifications.slice(0, 5).map((notification) => {
            const href = safeInternalHref(notification.href);
            return (
              <article key={notification.id} className="rounded-2xl border border-outline-variant/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{notification.title}</h3>
                  {notification.read_at === null ? <StatusBadge tone="safe">Mới</StatusBadge> : null}
                </div>
                <p className="mt-2 text-sm">{notification.body}</p>
                {href ? (
                  <Link className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary" href={href}>
                    Mở trạng thái SOS
                  </Link>
                ) : null}
              </article>
            );
          })}
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
  unavailableMessage,
  sosBasePath,
  sosCta,
}: {
  support?: AdultSupportOverviewItem;
  unavailableMessage?: string;
  sosBasePath?: "/teacher/sos-alerts" | "/parent/sos-alerts";
  sosCta?: string;
}) {
  if (unavailableMessage) {
    return (
      <SurfaceCard className="mt-5 bg-primary/5 p-4 shadow-none ring-0">
        <h3 className="text-sm font-semibold">Tóm tắt hỗ trợ tạm thời chưa tải được</h3>
        <p className="mt-2 text-sm">{unavailableMessage}</p>
      </SurfaceCard>
    );
  }

  if (!support) {
    return (
      <SurfaceCard className="mt-5 bg-primary/5 p-4 shadow-none ring-0">
        <h3 className="text-sm font-semibold">{sosCta === "Xem trạng thái SOS" ? "Trạng thái SOS của con" : "Tóm tắt hỗ trợ"}</h3>
        <p className="mt-2 text-sm">Chưa có tóm tắt SOS hoặc tự kiểm tra mới cho học sinh này.</p>
      </SurfaceCard>
    );
  }

  const heading = sosCta === "Xem trạng thái SOS" ? "Trạng thái SOS của con" : "Tóm tắt hỗ trợ";

  return (
    <SurfaceCard className="mt-5 bg-primary/5 p-4 shadow-none ring-0">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">{heading}</h3>
        <StatusBadge tone={supportTone(support)}>{support.warning_group_label}</StatusBadge>
      </div>
      {support.latest_self_check_summary ? (
        <p className="mt-3 text-sm">{support.latest_self_check_summary.support_suggestion}</p>
      ) : (
        <p className="mt-3 text-sm">Chưa có tóm tắt tự kiểm tra gần nhất được phép xem.</p>
      )}
      {support.latest_sos_alert ? (
        <div className="mt-3 rounded-2xl border border-red-200 bg-white p-3">
          <p className="text-xs">SOS hiện tại: {sosStatusLabels[support.latest_sos_alert.current_status]}</p>
          <p className="text-xs">Số SOS đang mở: {support.open_sos_count}</p>
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
