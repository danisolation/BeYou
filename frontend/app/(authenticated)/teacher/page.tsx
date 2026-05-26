"use client";

import { useEffect, useState } from "react";

import { AdultStudentList, type AdultLinkedStudent } from "@/components/adult-student-list";
import { LoadingState } from "@/components/ui-primitives";
import { apiFetch } from "@/lib/api";
import {
  getNotifications,
  getTeacherSupportOverview,
  type AdultSupportOverviewItem,
  type InAppNotification,
} from "@/lib/sos-api";

export default function TeacherDashboardPage() {
  const [students, setStudents] = useState<AdultLinkedStudent[]>([]);
  const [supportOverview, setSupportOverview] = useState<AdultSupportOverviewItem[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<AdultLinkedStudent[]>("/api/teacher/students"),
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
    return <LoadingState />;
  }

  return (
    <AdultStudentList
      roleContext="teacher"
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
