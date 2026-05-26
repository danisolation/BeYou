"use client";

import { useEffect, useState } from "react";

import { AdultStudentList, type AdultLinkedStudent } from "@/components/adult-student-list";
import { ErrorState, LoadingState } from "@/components/ui-primitives";
import { apiFetch } from "@/lib/api";
import {
  getNotifications,
  getParentSupportOverview,
  type AdultSupportOverviewItem,
  type InAppNotification,
} from "@/lib/sos-api";

export default function ParentDashboardPage() {
  const [students, setStudents] = useState<AdultLinkedStudent[]>([]);
  const [supportOverview, setSupportOverview] = useState<AdultSupportOverviewItem[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isActive = true;

    Promise.all([
      apiFetch<AdultLinkedStudent[]>("/api/parent/students"),
      getParentSupportOverview().catch(() => []),
      getNotifications().catch(() => []),
    ])
      .then(([linkedStudents, overviewItems, notificationItems]) => {
        if (!isActive) {
          return;
        }
        setStudents(linkedStudents);
        setSupportOverview(overviewItems);
        setNotifications(notificationItems);
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

  if (isLoading) {
    return <LoadingState />;
  }

  if (loadFailed) {
    return <ErrorState />;
  }

  return (
    <AdultStudentList
      roleContext="parent"
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
