import { apiFetch } from "@/lib/api";

export type ChatMessage = {
  id: string;
  thread_id: string;
  role: "student" | "assistant";
  content: string;
  safety_flagged: boolean;
  created_at: string;
  is_demo: boolean;
};

export type ChatThread = {
  id: string;
  title: string;
  safety_state: "supportive" | "high_risk";
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  is_demo: boolean;
};

export type ChatSafety = {
  high_risk: boolean;
  input_flagged: boolean;
  output_flagged: boolean;
  categories: string[];
  suggested_action: "supportive_chat" | "suggest_sos_trusted_adult";
  sos_suggested: boolean;
  escalation_message: string | null;
};

export type ChatSendResponse = {
  thread_id: string;
  student_message: ChatMessage;
  assistant_message: ChatMessage;
  safety: ChatSafety;
  provider: {
    name: string;
    used_fallback: boolean;
  };
};

export type ChatTranscript = {
  thread: ChatThread;
  messages: ChatMessage[];
};

export type SendChatMessagePayload = {
  message: string;
  thread_id?: string | null;
};

export type ChatbotSafetyConfig = {
  id: string;
  high_risk_keywords: string[];
  escalation_message: string;
  trusted_adult_message: string;
  first_response_disclaimer: string;
  guardrails_locked: boolean;
  provider: {
    name: string;
    configured: boolean;
    using_fallback: boolean;
  };
  updated_at: string;
  is_demo: boolean;
};

export type ChatbotSafetyConfigUpdate = {
  high_risk_keywords: string[];
  escalation_message: string;
  trusted_adult_message: string;
};

export function sendChatMessage(payload: SendChatMessagePayload) {
  return apiFetch<ChatSendResponse>("/api/student/chat/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listChatThreads() {
  return apiFetch<ChatThread[]>("/api/student/chat/threads");
}

export function getChatTranscript(threadId: string) {
  return apiFetch<ChatTranscript>(`/api/student/chat/threads/${threadId}/messages`);
}

export function getAdminChatbotConfig() {
  return apiFetch<ChatbotSafetyConfig>("/api/admin/chatbot/config");
}

export function updateAdminChatbotConfig(payload: ChatbotSafetyConfigUpdate) {
  return apiFetch<ChatbotSafetyConfig>("/api/admin/chatbot/config", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Adult (teacher/parent) chat API helpers
// ---------------------------------------------------------------------------

export function sendTeacherChatMessage(payload: SendChatMessagePayload) {
  return apiFetch<ChatSendResponse>("/api/teacher/chat/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listTeacherChatThreads() {
  return apiFetch<ChatThread[]>("/api/teacher/chat/threads");
}

export function getTeacherChatTranscript(threadId: string) {
  return apiFetch<ChatTranscript>(`/api/teacher/chat/threads/${threadId}/messages`);
}

export function sendParentChatMessage(payload: SendChatMessagePayload) {
  return apiFetch<ChatSendResponse>("/api/parent/chat/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listParentChatThreads() {
  return apiFetch<ChatThread[]>("/api/parent/chat/threads");
}

export function getParentChatTranscript(threadId: string) {
  return apiFetch<ChatTranscript>(`/api/parent/chat/threads/${threadId}/messages`);
}
