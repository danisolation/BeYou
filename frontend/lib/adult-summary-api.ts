import { apiFetch } from "@/lib/api";

export type AdultSummaryStudent = {
  id: string;
  full_name: string;
  school: string | null;
  class_name: string | null;
};

export type AdultSelfCheckSummaryItem = {
  completed_at: string;
  test_type?: string;
  test_title?: string;
  state_label: "On dinh" | "Can chu y" | "Nen tim ho tro" | "Can ho tro som";
  advice_summary: string | null;
  support_suggestion: string | null;
  is_demo: boolean;
};

export type AdultSelfCheckSummaryResponse = {
  student: AdultSummaryStudent;
  latest_summary: AdultSelfCheckSummaryItem | null;
  recent_summaries: AdultSelfCheckSummaryItem[];
  is_demo: boolean;
};

export type AdultSupportPlanSummary = {
  status: string | null;
  shared_with_viewer: boolean;
  selected_adult_count: number;
  what_helps: string | null;
  what_does_not_help: string | null;
  preferred_contact_method: string | null;
  safe_contact_times: string | null;
  shareable_note: string | null;
  updated_at: string | null;
};

export type AdultMoodTrendSummary = {
  latest_checkin_at: string | null;
  latest_trend_label: string | null;
  recent_checkin_count: number;
  high_concern_count: number;
  recent_trend_labels: string[];
  suggested_supportive_action: string;
};

export type AdultSharedMoodNote = {
  id: string;
  mood_checkin_id: string;
  shared_at: string;
  mood_created_at: string;
  share_scope: "private_note" | "student_summary";
  content: string;
  relationship_type: string;
  is_demo: boolean;
};

export type AdultAccessReasonOption = {
  code: string;
  label: string;
};

export type AdultAccessReasonStatus = {
  required: boolean;
  reason_code: string | null;
  reason_label: string | null;
  allowed_reasons: AdultAccessReasonOption[];
};

export type AdultSupportSummaryResponse = {
  student: AdultSummaryStudent;
  support_plan: AdultSupportPlanSummary;
  mood_summary: AdultMoodTrendSummary;
  shared_mood_notes: AdultSharedMoodNote[];
  access_reason: AdultAccessReasonStatus;
  privacy_notes: string[];
  is_demo: boolean;
};

export type AdultAccessReasonRequiredDetail = {
  code: "access_reason_required";
  message: string;
  allowed_reasons: AdultAccessReasonOption[];
  copy?: string[];
};

export function getTeacherSelfCheckSummaries(studentId: string) {
  return apiFetch<AdultSelfCheckSummaryResponse>(`/api/teacher/students/${studentId}/self-check-summaries`);
}

export function getParentSelfCheckSummaries(studentId: string) {
  return apiFetch<AdultSelfCheckSummaryResponse>(`/api/parent/students/${studentId}/self-check-summaries`);
}

function supportSummaryPath(role: "teacher" | "parent", studentId: string, reasonCode?: string) {
  const query = reasonCode ? `?reason_code=${encodeURIComponent(reasonCode)}` : "";
  return `/api/${role}/students/${studentId}/support-summary${query}`;
}

export function getTeacherSupportSummary(studentId: string, reasonCode?: string) {
  return apiFetch<AdultSupportSummaryResponse>(supportSummaryPath("teacher", studentId, reasonCode));
}

export function getParentSupportSummary(studentId: string, reasonCode?: string) {
  return apiFetch<AdultSupportSummaryResponse>(supportSummaryPath("parent", studentId, reasonCode));
}
