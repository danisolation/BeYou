"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { RoleStudentList } from "@/app/(authenticated)/teacher/page";
import {
  getNotifications,
  getParentSupportOverview,
  type AdultSupportOverviewItem,
  type InAppNotification,
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

export default function ParentDashboardPage() {
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [supportOverview, setSupportOverview] = useState<AdultSupportOverviewItem[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<LinkedStudent[]>("/api/parent/students"),
      getParentSupportOverview().catch(() => []),
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
      title="Cổng phụ huynh"
      subtitle="Xem học sinh được liên kết và thông tin hỗ trợ được phép hiển thị."
      summaryTitle="Tóm tắt hỗ trợ của con"
      summaryBasePath="/parent/students"
      summaryCta="Xem tóm tắt hỗ trợ"
      sosBasePath="/parent/sos-alerts"
      sosCta="Xem trạng thái SOS"
      supportOverview={supportOverview}
      notifications={notifications}
      students={students}
      emptyBody="Khi quản trị viên tạo liên kết, thông tin hỗ trợ được phép xem sẽ hiển thị tại đây."
    />
  );
}
