import type { AdultLinkedStudent } from "@/components/adult-student-list";
import {
  dashboardRead,
  optionalDashboardRead,
  type OptionalDashboardResult,
} from "@/lib/dashboard-loading";
import {
  getNotifications,
  getParentSupportOverview,
  getTeacherSupportOverview,
  type AdultSupportOverviewItem,
  type InAppNotification,
} from "@/lib/sos-api";

export const ADULT_SUPPORT_OVERVIEW_UNAVAILABLE_MESSAGE =
  "Tóm tắt hỗ trợ tạm thời chưa tải được. Học sinh được liên kết vẫn hiển thị theo phạm vi quyền riêng tư.";

export const ADULT_NOTIFICATIONS_UNAVAILABLE_MESSAGE = "Thông báo hỗ trợ tạm thời chưa tải được.";

export type AdultDashboardData = {
  students: AdultLinkedStudent[];
  supportOverview: OptionalDashboardResult<AdultSupportOverviewItem[]>;
  notifications: OptionalDashboardResult<InAppNotification[]>;
};

export async function loadTeacherDashboard(): Promise<AdultDashboardData> {
  const [students, supportOverview, notifications] = await Promise.all([
    dashboardRead<AdultLinkedStudent[]>("/api/teacher/students"),
    optionalDashboardRead(() => getTeacherSupportOverview(), ADULT_SUPPORT_OVERVIEW_UNAVAILABLE_MESSAGE),
    optionalDashboardRead(() => getNotifications(), ADULT_NOTIFICATIONS_UNAVAILABLE_MESSAGE),
  ]);

  return { students, supportOverview, notifications };
}

export async function loadParentDashboard(): Promise<AdultDashboardData> {
  const [students, supportOverview, notifications] = await Promise.all([
    dashboardRead<AdultLinkedStudent[]>("/api/parent/students"),
    optionalDashboardRead(() => getParentSupportOverview(), ADULT_SUPPORT_OVERVIEW_UNAVAILABLE_MESSAGE),
    optionalDashboardRead(() => getNotifications(), ADULT_NOTIFICATIONS_UNAVAILABLE_MESSAGE),
  ]);

  return { students, supportOverview, notifications };
}
