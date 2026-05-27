import { apiFetch } from "@/lib/api";
import { dashboardRead } from "@/lib/dashboard-loading";

export type SosSeverity = "support" | "urgent";
export type SosSource = "student_dashboard" | "self_check_result" | "chatbot" | "demo_seed";
export type SosStatus = "sent" | "received" | "supporting" | "completed";

export type SosStudentContext = {
  id: string;
  full_name: string;
  school: string | null;
  class_name: string | null;
};

export type SosStatusEvent = {
  id: string;
  actor_id: string;
  actor_role: string;
  previous_status: SosStatus | null;
  new_status: SosStatus;
  note: string | null;
  created_at: string;
  is_demo: boolean;
};

export type SosAlert = {
  id: string;
  student: SosStudentContext;
  severity: SosSeverity;
  source: SosSource;
  note: string | null;
  current_status: SosStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  status_events: SosStatusEvent[];
  is_demo: boolean;
};

export type CreateSosAlertPayload = {
  severity: SosSeverity;
  source: "student_dashboard";
  note?: string | null;
};

export type UpdateSosStatusPayload = {
  status: Exclude<SosStatus, "sent">;
  note?: string | null;
};

export type InAppNotification = {
  id: string;
  resource_type: string;
  resource_id: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
  is_demo: boolean;
};

export type AdultLatestSummary = {
  completed_at: string;
  test_type: string;
  state_label: string;
  advice_summary: string | null;
  support_suggestion: string | null;
  is_demo: boolean;
};

export type AdultSupportOverviewItem = {
  student: SosStudentContext;
  warning_group: "on_dinh" | "can_quan_tam" | "nguy_co_cao";
  warning_group_label: string;
  latest_self_check_summary: AdultLatestSummary | null;
  latest_sos_alert: SosAlert | null;
  open_sos_count: number;
  is_demo: boolean;
};

export const sosStatusLabels: Record<SosStatus, string> = {
  sent: "Đã gửi",
  received: "Đã nhận",
  supporting: "Đang hỗ trợ",
  completed: "Đã hoàn tất",
};

export const sosSeverityLabels: Record<SosSeverity, string> = {
  support: "Em cần người lớn liên hệ sớm",
  urgent: "Em đang không an toàn ngay lúc này",
};

export function createStudentSosAlert(payload: CreateSosAlertPayload) {
  return apiFetch<SosAlert>("/api/student/sos-alerts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listStudentSosAlerts() {
  return dashboardRead<SosAlert[]>("/api/student/sos-alerts");
}

export function getTeacherSosAlert(alertId: string) {
  return dashboardRead<SosAlert>(`/api/teacher/sos-alerts/${alertId}`);
}

export function getParentSosAlert(alertId: string) {
  return dashboardRead<SosAlert>(`/api/parent/sos-alerts/${alertId}`);
}

export function updateTeacherSosStatus(alertId: string, payload: UpdateSosStatusPayload) {
  return apiFetch<SosAlert>(`/api/teacher/sos-alerts/${alertId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getTeacherSupportOverview() {
  return dashboardRead<AdultSupportOverviewItem[]>("/api/teacher/support-overview");
}

export function getParentSupportOverview() {
  return dashboardRead<AdultSupportOverviewItem[]>("/api/parent/support-overview");
}

export function getNotifications() {
  return dashboardRead<InAppNotification[]>("/api/notifications");
}

export function markNotificationRead(notificationId: string) {
  return apiFetch<InAppNotification>(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}
