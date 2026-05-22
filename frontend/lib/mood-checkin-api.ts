import { apiFetch } from "@/lib/api";

export type MoodLabel = "steady" | "okay" | "tired" | "sad" | "anxious" | "overwhelmed";

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
