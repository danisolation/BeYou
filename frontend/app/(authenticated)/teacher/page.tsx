"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import { apiFetch } from "@/lib/api";
import {
  getNotifications,
  getTeacherSupportOverview,
  type AdultSupportOverviewItem,
  type InAppNotification,
  sosStatusLabels,
} from "@/lib/sos-api";

type LinkedStudent = {
  id: string;
  full_name: string;
  email: string;
  school: string | null;
  class_name: string | null;
  relationship_type: string;
  link_status: string;
  is_demo: boolean;
};

export default function TeacherDashboardPage() {
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [supportOverview, setSupportOverview] = useState<AdultSupportOverviewItem[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<LinkedStudent[]>("/api/teacher/students"),
      getTeacherSupportOverview().catch(() => []),
      getNotifications().catch(() => []),
    ])
      .then(([linkedStudents, overviewItems, notificationItems]) => {
        setStudents(linkedStudents);
        setSupportOverview(overviewItems);
        setNotifications(notificationItems);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p>Đang tải thông tin...</p>;
  }

  return (
    <RoleStudentList
      title="Cổng giáo viên"
      subtitle="Xem học sinh được liên kết và các thông tin được phép xem để hỗ trợ các em."
      summaryTitle="Tóm tắt tự kiểm tra được phép xem"
      summaryBasePath="/teacher/students"
      summaryCta="Xem tóm tắt hỗ trợ"
      sosBasePath="/teacher/sos-alerts"
      sosCta="Xem và cập nhật SOS"
      supportOverview={supportOverview}
      notifications={notifications}
      students={students}
      emptyBody="Khi quản trị viên tạo liên kết, học sinh được phép hỗ trợ sẽ hiển thị tại đây."
    />
  );
}

export function RoleStudentList({
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
}: {
  title: string;
  subtitle: string;
  students: LinkedStudent[];
  emptyBody: string;
  summaryTitle: string;
  summaryBasePath: "/teacher/students" | "/parent/students";
  summaryCta: string;
  sosBasePath?: "/teacher/sos-alerts" | "/parent/sos-alerts";
  sosCta?: string;
  supportOverview?: AdultSupportOverviewItem[];
  notifications?: InAppNotification[];
}) {
  const supportByStudent = new Map(supportOverview.map((item) => [item.student.id, item]));
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-display">{title}</h1>
        <p className="mt-3 max-w-2xl text-body">{subtitle}</p>
      </div>
      <NotificationList notifications={notifications} />
      {students.length === 0 ? (
        <EmptyState heading="Chưa có học sinh được liên kết" body={emptyBody} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {students.map((student) => (
            <article key={student.id} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-heading">{student.full_name}</h2>
                {student.is_demo ? <DemoBadge /> : null}
              </div>
              <p className="mt-2 text-label">{student.email}</p>
              <p className="mt-3 text-body">Trường: {student.school ?? "Chưa cập nhật"}</p>
              <p className="text-body">Lớp: {student.class_name ?? "Chưa cập nhật"}</p>
              <p className="mt-3 text-label">Trạng thái liên kết: {student.link_status}</p>
              <SupportOverviewCard
                support={supportByStudent.get(student.id)}
                sosBasePath={sosBasePath}
                sosCta={sosCta}
              />
              <div className="mt-5 rounded-2xl bg-secondary p-4">
                <h3 className="text-heading">{summaryTitle}</h3>
                <p className="mt-2 text-body">BeYou chỉ hiển thị phần tóm tắt được phép xem để hỗ trợ học sinh.</p>
                <Link
                  className="mt-3 inline-flex min-h-11 items-center rounded-2xl bg-accent px-4 font-semibold text-white"
                  href={`${summaryBasePath}/${student.id}/self-check-summaries`}
                >
                  {summaryCta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function NotificationList({ notifications }: { notifications: InAppNotification[] }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
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
                {notification.read_at === null ? (
                  <span className="rounded-full bg-secondary px-3 py-1 text-label">Mới</span>
                ) : null}
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
    </section>
  );
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
      <div className="mt-5 rounded-2xl bg-secondary p-4">
        <h3 className="text-heading">{sosCta === "Xem trạng thái SOS" ? "Trạng thái SOS của con" : "Tóm tắt hỗ trợ"}</h3>
        <p className="mt-2 text-body">Chưa có tóm tắt SOS hoặc tự kiểm tra mới cho học sinh này.</p>
      </div>
    );
  }
  const heading = sosCta === "Xem trạng thái SOS" ? "Trạng thái SOS của con" : "Tóm tắt hỗ trợ";
  return (
    <div className="mt-5 rounded-2xl bg-secondary p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-heading">{heading}</h3>
        <span className="rounded-full border border-[#CFE8E1] px-3 py-1 text-label">
          {support.warning_group_label}
        </span>
      </div>
      {support.latest_self_check_summary ? (
        <p className="mt-3 text-body">{support.latest_self_check_summary.support_suggestion}</p>
      ) : (
        <p className="mt-3 text-body">Chưa có tóm tắt tự kiểm tra gần nhất được phép xem.</p>
      )}
      {support.latest_sos_alert ? (
        <div className="mt-3 rounded-2xl bg-white p-3">
          <p className="text-label">SOS hiện tại: {sosStatusLabels[support.latest_sos_alert.current_status]}</p>
          <p className="text-label">Số SOS đang mở: {support.open_sos_count}</p>
          {sosBasePath && sosCta ? (
            <Link
              className="mt-3 inline-flex min-h-11 items-center rounded-2xl bg-accent px-4 font-semibold text-white"
              href={`${sosBasePath}/${support.latest_sos_alert.id}`}
            >
              {sosCta}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
