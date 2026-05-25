import { apiFetch } from "@/lib/api";

export type MoodLabel = "steady" | "okay" | "tired" | "sad" | "anxious" | "overwhelmed";
export type MoodNoteShareScope = "private_note" | "student_summary";

export type MoodOption = {
  key: MoodLabel;
  label: string;
  helper: string;
};

export type ContextTagOption = {
  key: string;
  label: string;
};

export type MoodCheckInOptions = {
  student_prompt: string | null;
  adult_guidance: string | null;
  mood_options: MoodOption[];
  context_tags: ContextTagOption[];
  privacy_notes: string[];
  energy_scale_label: string;
  stress_scale_label: string;
};

export type MoodCheckInPayload = {
  mood_label: MoodLabel;
  energy_level: number;
  stress_level: number;
  context_tags: string[];
  private_note?: string | null;
};

export type MoodNoteShareLinkedAdultOption = {
  id: string;
  full_name: string;
  relationship_type: string;
  is_demo: boolean;
};

export type MoodNoteActiveShare = {
  id: string;
  mood_checkin_id: string;
  adult_id: string;
  adult_full_name: string;
  relationship_type: string;
  share_scope: MoodNoteShareScope;
  has_private_note: boolean;
  has_student_summary: boolean;
  created_at: string;
  is_demo: boolean;
};

export type MoodNoteShareOptionsResponse = {
  available_adults: MoodNoteShareLinkedAdultOption[];
  privacy_notes: string[];
};

export type MoodNoteSharePayload = {
  adult_ids: string[];
  share_scope: MoodNoteShareScope;
  student_summary: string | null;
};

export type MoodNoteShareResponse = {
  mood_checkin_id: string;
  active_shares: MoodNoteActiveShare[];
  shareable: boolean;
  can_share_private_note: boolean;
  message: string;
};

export type MoodNoteRevokeResponse = {
  mood_checkin_id: string;
  revoked_count: number;
  active_shares: MoodNoteActiveShare[];
  message: string;
};

export type MoodCheckIn = {
  id: string;
  mood_label: MoodLabel;
  energy_level: number;
  stress_level: number;
  context_tags: string[];
  private_note: string | null;
  trend_label: string;
  supportive_message: string;
  suggested_next_action: string;
  suggest_support_plan: boolean;
  suggest_sos: boolean;
  created_at: string;
  is_demo: boolean;
  shareable: boolean;
  can_share_private_note?: boolean;
  active_shares: MoodNoteActiveShare[];
};

export type MoodCheckInHistory = {
  items: MoodCheckIn[];
};

export const moodLabelFallbacks: Record<MoodLabel, string> = {
  steady: "Khá ổn",
  okay: "Bình thường",
  tired: "Mệt",
  sad: "Buồn",
  anxious: "Lo lắng",
  overwhelmed: "Quá tải",
};

export function getMoodCheckInOptions() {
  return apiFetch<MoodCheckInOptions>("/api/student/mood-check-ins/options");
}

export function submitMoodCheckIn(payload: MoodCheckInPayload) {
  return apiFetch<MoodCheckIn>("/api/student/mood-check-ins", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMoodCheckInHistory() {
  return apiFetch<MoodCheckInHistory>("/api/student/mood-check-ins/history");
}

export function getMoodNoteShareOptions() {
  return apiFetch<MoodNoteShareOptionsResponse>("/api/student/mood-check-ins/share-options");
}

export function shareMoodCheckInNote(checkinId: string, payload: MoodNoteSharePayload) {
  return apiFetch<MoodNoteShareResponse>(`/api/student/mood-check-ins/${checkinId}/shares`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function revokeMoodCheckInShare(checkinId: string, adultId: string) {
  return apiFetch<MoodNoteRevokeResponse>(`/api/student/mood-check-ins/${checkinId}/shares/${adultId}`, {
    method: "DELETE",
  });
}

export function revokeAllMoodCheckInShares(checkinId: string) {
  return apiFetch<MoodNoteRevokeResponse>(`/api/student/mood-check-ins/${checkinId}/shares`, {
    method: "DELETE",
  });
}
