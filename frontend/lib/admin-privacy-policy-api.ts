import { apiFetch } from "@/lib/api";

export type AdminPolicyChannelBoundary = {
  key: string;
  label: string;
  enabled: boolean;
  available: boolean;
  status: "active" | "deferred";
};

export type AdminPrivacyPolicy = {
  id: string;
  school_scope: string;
  default_in_app_reminders_enabled: boolean;
  default_quiet_hours_start: string | null;
  default_quiet_hours_end: string | null;
  default_timezone: string;
  allowed_channels: string[];
  external_channels_enabled: boolean;
  note_sharing_enabled: boolean;
  reason_required_for_adult_summaries: boolean;
  reason_required_for_shared_mood_notes: boolean;
  allowed_reason_codes: string[];
  channel_boundaries: AdminPolicyChannelBoundary[];
  updated_at: string;
  is_demo: boolean;
};

export type AdminPrivacyPolicyUpdate = {
  default_in_app_reminders_enabled: boolean;
  default_quiet_hours_start: string | null;
  default_quiet_hours_end: string | null;
  default_timezone: string;
  allowed_channels: string[];
  external_channels_enabled: boolean;
  note_sharing_enabled: boolean;
  reason_required_for_adult_summaries: boolean;
  reason_required_for_shared_mood_notes: boolean;
  allowed_reason_codes: string[];
};

export const ACCESS_REASON_OPTIONS = [
  { code: "student_requested_support", label: "Học sinh đã nhờ hỗ trợ" },
  { code: "follow_up_after_checkin", label: "Theo dõi sau một check-in gần đây" },
  { code: "support_plan_context", label: "Xem bối cảnh kế hoạch hỗ trợ" },
  { code: "sos_follow_up", label: "Theo dõi sau một tình huống SOS" },
  { code: "routine_care_conversation", label: "Chuẩn bị cho cuộc trò chuyện chăm sóc định kỳ" },
];

export function getAdminPrivacyPolicy() {
  return apiFetch<AdminPrivacyPolicy>("/api/admin/privacy-policy");
}

export function updateAdminPrivacyPolicy(payload: AdminPrivacyPolicyUpdate) {
  return apiFetch<AdminPrivacyPolicy>("/api/admin/privacy-policy", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

