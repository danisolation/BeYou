"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { SosAlertDetail } from "@/components/sos-alert-detail";
import { getTeacherSosAlert, type SosAlert } from "@/lib/sos-api";

type PageProps = {
  params: { alertId: string } | Promise<{ alertId: string }>;
};

export default function TeacherSosAlertPage({ params }: PageProps) {
  const [alert, setAlert] = useState<SosAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    Promise.resolve(params)
      .then(({ alertId }) => getTeacherSosAlert(alertId))
      .then((response) => {
        setAlert(response);
        setHasError(false);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [params]);

  if (isLoading) {
    return <p>Đang tải thông tin...</p>;
  }

  if (hasError || alert === null) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại từ trang chính." body="Bạn có thể quay về cổng giáo viên rồi mở lại trạng thái SOS." />;
  }

  return <SosAlertDetail initialAlert={alert} mode="teacher" />;
}
