import {
  dashboardRead,
  optionalDashboardRead,
  type OptionalDashboardResult,
} from "@/lib/dashboard-loading";
import { getMoodCheckInReminder, type MoodCheckInReminder } from "@/lib/notification-preferences-api";
import { listStudentSosAlerts, type SosAlert } from "@/lib/sos-api";

export type LinkedAdult = {
  id: string;
  full_name: string;
  email: string;
  relationship_type: "teacher" | "parent";
  link_status: string;
  is_demo: boolean;
};

export type StudentProfile = {
  id: string;
  full_name: string;
  email: string;
  school: string | null;
  class_name: string | null;
  is_demo: boolean;
  linked_adults: LinkedAdult[];
};

export type StudentDashboardData = {
  profile: StudentProfile;
  sosAlerts: OptionalDashboardResult<SosAlert[]>;
  moodReminder: OptionalDashboardResult<MoodCheckInReminder | null>;
};

export const STUDENT_SOS_UNAVAILABLE_MESSAGE =
  "Tiến trình SOS tạm thời chưa tải được. Các phần còn lại vẫn giữ nguyên phạm vi quyền riêng tư.";

export const STUDENT_REMINDER_UNAVAILABLE_MESSAGE =
  "Nhắc nhở check-in tạm thời chưa tải được. Peerlight AI không gửi thông báo cho người lớn và không tạo SOS từ lỗi tải này.";

export async function loadStudentDashboard(): Promise<StudentDashboardData> {
  const [profile, sosAlerts, moodReminder] = await Promise.all([
    dashboardRead<StudentProfile>("/api/student/profile"),
    optionalDashboardRead(() => listStudentSosAlerts(), STUDENT_SOS_UNAVAILABLE_MESSAGE),
    optionalDashboardRead(() => getMoodCheckInReminder(), STUDENT_REMINDER_UNAVAILABLE_MESSAGE),
  ]);

  return { profile, sosAlerts, moodReminder };
}
