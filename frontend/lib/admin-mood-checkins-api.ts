import { apiFetch } from "@/lib/api";

export type AdminMoodOptionConfig = {
  key: string;
  label: string;
  helper: string;
};

export type AdminContextTagConfig = {
  key: string;
  label: string;
};

export type AdminMoodCheckInConfig = {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  student_prompt: string;
  adult_guidance: string;
  mood_options: AdminMoodOptionConfig[];
  context_tags: AdminContextTagConfig[];
  sort_order: number;
  updated_by_id: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminMoodCheckInConfigPayload = Omit<
  AdminMoodCheckInConfig,
  "id" | "updated_by_id" | "is_demo" | "created_at" | "updated_at"
>;

export type AdminMoodCheckInPreview = {
  student_prompt: string;
  adult_guidance: string;
  mood_options: AdminMoodOptionConfig[];
  context_tags: AdminContextTagConfig[];
  privacy_notes: string[];
};

export const defaultMoodConfigPayload: AdminMoodCheckInConfigPayload = {
  name: "default",
  status: "draft",
  student_prompt: "Dành một phút gọi tên cảm xúc hiện tại của em.",
  adult_guidance: "Bắt đầu bằng lắng nghe và hỏi em muốn được hỗ trợ thế nào.",
  sort_order: 0,
  mood_options: [
    { key: "steady", label: "Khá ổn", helper: "Em thấy tương đối cân bằng." },
    { key: "okay", label: "Bình thường", helper: "Không quá tốt, không quá tệ." },
    { key: "tired", label: "Mệt", helper: "Em thấy thiếu năng lượng." },
    { key: "sad", label: "Buồn", helper: "Em đang thấy nặng lòng." },
    { key: "anxious", label: "Lo lắng", helper: "Em thấy căng hoặc khó yên tâm." },
    { key: "overwhelmed", label: "Quá tải", helper: "Em thấy mọi thứ hơi nhiều với mình." },
  ],
  context_tags: [
    { key: "school", label: "Trường/lớp" },
    { key: "family", label: "Gia đình" },
    { key: "friends", label: "Bạn bè" },
    { key: "body", label: "Cơ thể/sức khỏe" },
    { key: "sleep", label: "Giấc ngủ" },
    { key: "future", label: "Tương lai" },
    { key: "other", label: "Khác" },
  ],
};

export function listMoodCheckInConfigs() {
  return apiFetch<AdminMoodCheckInConfig[]>("/api/admin/mood-checkins/configs");
}

export function createMoodCheckInConfig(payload: AdminMoodCheckInConfigPayload) {
  return apiFetch<AdminMoodCheckInConfig>("/api/admin/mood-checkins/configs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMoodCheckInConfig(configId: string, payload: AdminMoodCheckInConfigPayload) {
  return apiFetch<AdminMoodCheckInConfig>(`/api/admin/mood-checkins/configs/${configId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function previewMoodCheckInConfig(configId: string) {
  return apiFetch<AdminMoodCheckInPreview>(`/api/admin/mood-checkins/configs/${configId}/preview`);
}
