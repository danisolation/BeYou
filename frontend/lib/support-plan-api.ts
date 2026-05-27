import { apiFetch } from "@/lib/api";

export type SupportPlanStatus = "active" | "paused" | "deactivated";

export type SupportPlanLinkedAdult = {
  id: string;
  full_name: string;
  email: string | null;
  relationship_type: "teacher" | "parent";
  is_demo: boolean;
};

export type SupportPlanSelectedAdult = {
  id: string;
  full_name: string;
  relationship_type: "teacher" | "parent";
  is_demo: boolean;
};

export type SupportPlanDetail = {
  id: string;
  status: SupportPlanStatus;
  what_helps: string | null;
  what_does_not_help: string | null;
  preferred_contact_method: string | null;
  safe_contact_times: string | null;
  shareable_note: string | null;
  selected_adults: SupportPlanSelectedAdult[];
  created_at: string;
  updated_at: string;
  paused_at: string | null;
  deactivated_at: string | null;
  is_demo: boolean;
};

export type StudentSupportPlanResponse = {
  plan: SupportPlanDetail | null;
  available_adults: SupportPlanLinkedAdult[];
  privacy_notes: string[];
  is_demo: boolean;
};

export type SupportPlanUpsertPayload = {
  adult_ids: string[];
  status: SupportPlanStatus;
  what_helps?: string | null;
  what_does_not_help?: string | null;
  preferred_contact_method?: string | null;
  safe_contact_times?: string | null;
  shareable_note?: string | null;
};

export const supportPlanStatusLabels: Record<SupportPlanStatus, string> = {
  active: "Đang chia sẻ",
  paused: "Tạm dừng chia sẻ",
  deactivated: "Ngừng chia sẻ",
};

export const supportPlanRelationshipLabels: Record<SupportPlanLinkedAdult["relationship_type"], string> = {
  teacher: "Giáo viên",
  parent: "Phụ huynh",
};

export function getStudentSupportPlan() {
  return apiFetch<StudentSupportPlanResponse>("/api/student/support-plan");
}

export function saveStudentSupportPlan(payload: SupportPlanUpsertPayload) {
  return apiFetch<StudentSupportPlanResponse>("/api/student/support-plan", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
