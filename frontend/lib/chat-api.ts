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
  safety_state: "supportive" | "high_risk" | "medium_risk";
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

export type StreamEvent =
  | { type: "meta"; thread_id: string; student_message_id: string }
  | { type: "token"; content: string }
  | { type: "done"; assistant_message_id: string; safety_level: string; thread_title: string };

/**
 * Stream chat response via SSE. Calls onEvent for each parsed event.
 * Falls back to sync sendChatMessage on error.
 */
export async function sendChatMessageStream(
  payload: SendChatMessagePayload,
  onEvent: (event: StreamEvent) => void,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const isBrowserNonLocal = typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1");

  const url = isBrowserNonLocal
    ? "/api/student/chat/messages/stream"
    : `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/api/student/chat/messages/stream`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
    signal: options?.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Stream request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") return;
      try {
        onEvent(JSON.parse(data) as StreamEvent);
      } catch {
        // skip malformed events
      }
    }
  }
}

export function listChatThreads() {
  return apiFetch<ChatThread[]>("/api/student/chat/threads");
}

export function getChatTranscript(threadId: string) {
  return apiFetch<ChatTranscript>(`/api/student/chat/threads/${threadId}/messages`);
}

export function deleteChatThread(threadId: string) {
  return apiFetch<void>(`/api/student/chat/threads/${threadId}`, {
    method: "DELETE",
  });
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

export function deleteTeacherChatThread(threadId: string) {
  return apiFetch<void>(`/api/teacher/chat/threads/${threadId}`, {
    method: "DELETE",
  });
}

export function deleteParentChatThread(threadId: string) {
  return apiFetch<void>(`/api/parent/chat/threads/${threadId}`, {
    method: "DELETE",
  });
}
