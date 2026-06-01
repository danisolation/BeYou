"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

import { ChatSkeleton } from "@/components/skeletons";
import {
  type ChatMessage,
  type ChatThread,
  type StreamEvent,
  getChatTranscript,
  listChatThreads,
  sendChatMessage,
  sendChatMessageStream,
} from "@/lib/chat-api";

const INTRO_COPY =
  "Peerlight AI luôn ở đây lắng nghe, nhưng không thay thế chuyên gia tâm lý hay bác sĩ nhé. Mình sẽ cùng em nghĩ về bước an toàn tiếp theo.";
const IMMEDIATE_SUPPORT_COPY =
  "Nếu lúc này em thấy không an toàn, hãy tìm ngay một người em tin ở gần mình hoặc dùng SOS trong Peerlight AI nhé.";
const PRIVATE_CHAT_COPY =
  "Em có thể viết ngắn thôi, chưa cần hoàn hảo. Cuộc trò chuyện của em được giữ riêng tư.";

export default function StudentChatPage() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    listChatThreads()
      .then(async (threads) => {
        if (active) {
          setThreads(threads);
        }
        if (!active || threads.length === 0) {
          return;
        }
        const latest = threads[0];
        const transcript = await getChatTranscript(latest.id);
        if (active) {
          setThreadId(transcript.thread.id);
          setMessages(transcript.messages);
        }
      })
      .catch(() => {
        if (active) {
          setError("Chưa tải được cuộc trò chuyện. Em vẫn có thể thử gửi một chia sẻ mới.");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSelectThread(nextThreadId: string) {
    setIsLoading(true);
    setError("");
    try {
      const transcript = await getChatTranscript(nextThreadId);
      setThreadId(transcript.thread.id);
      setMessages(transcript.messages);
    } catch {
      setError("Chưa tải được cuộc trò chuyện này. Hãy thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message) {
      return;
    }
    setIsSending(true);
    setError("");
    setDraft("");

    // Optimistically add the student message
    const tempStudentMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      thread_id: threadId || "",
      role: "student",
      content: message,
      safety_flagged: false,
      created_at: new Date().toISOString(),
      is_demo: false,
    };
    setMessages((current) => [...current, tempStudentMsg]);

    try {
      // Try streaming first
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);
      setStreamingContent("");

      let resolvedThreadId = threadId;
      let assistantMsgId = "";
      let threadTitle = "";

      await sendChatMessageStream(
        { message, thread_id: threadId },
        (evt: StreamEvent) => {
          if (evt.type === "meta") {
            resolvedThreadId = evt.thread_id;
            setThreadId(evt.thread_id);
            // Update temp student message with real id
            setMessages((current) =>
              current.map((m) =>
                m.id === tempStudentMsg.id
                  ? { ...m, id: evt.student_message_id, thread_id: evt.thread_id }
                  : m,
              ),
            );
          } else if (evt.type === "token") {
            setStreamingContent((prev) => prev + evt.content);
          } else if (evt.type === "done") {
            assistantMsgId = evt.assistant_message_id;
            threadTitle = evt.thread_title;
          }
        },
        { signal: controller.signal },
      );

      // Streaming complete — add final assistant message
      setStreamingContent((finalContent) => {
        const assistantMsg: ChatMessage = {
          id: assistantMsgId || `stream-${Date.now()}`,
          thread_id: resolvedThreadId || "",
          role: "assistant",
          content: finalContent,
          safety_flagged: false,
          created_at: new Date().toISOString(),
          is_demo: false,
        };
        setMessages((current) => [...current, assistantMsg]);
        return "";
      });

      setThreads((current) => {
        const tid = resolvedThreadId || threadId || "";
        const existing = current.find((t) => t.id === tid);
        if (existing) {
          return current.map((t) =>
            t.id === tid ? { ...t, title: threadTitle || t.title, updated_at: new Date().toISOString() } : t,
          );
        }
        return [
          {
            id: tid,
            title: threadTitle || message.slice(0, 30),
            safety_state: "supportive" as const,
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_demo: false,
          },
          ...current,
        ];
      });
    } catch {
      // Fallback to sync endpoint
      setStreamingContent("");
      try {
        const response = await sendChatMessage({ message, thread_id: threadId });
        setThreadId(response.thread_id);
        setMessages((current) => [
          ...current.filter((m) => m.id !== tempStudentMsg.id),
          response.student_message,
          response.assistant_message,
        ]);
        setThreads((current) => {
          const existing = current.find((t) => t.id === response.thread_id);
          if (existing) {
            return current.map((t) =>
              t.id === response.thread_id
                ? { ...t, last_message_at: response.assistant_message.created_at, updated_at: response.assistant_message.created_at }
                : t,
            );
          }
          return [
            {
              id: response.thread_id,
              title: message.slice(0, 48) || "Cuộc trò chuyện mới",
              safety_state: response.safety.high_risk ? "high_risk" : "supportive",
              last_message_at: response.assistant_message.created_at,
              created_at: response.student_message.created_at,
              updated_at: response.assistant_message.created_at,
              is_demo: response.student_message.is_demo || response.assistant_message.is_demo,
            },
            ...current,
          ];
        });
      } catch {
        setError("Chưa gửi được tin nhắn. Hãy thử lại hoặc dùng SOS nếu em đang cần hỗ trợ ngay.");
        // Remove optimistic message on total failure
        setMessages((current) => current.filter((m) => m.id !== tempStudentMsg.id));
      }
    } finally {
      setIsSending(false);
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <section className="space-y-4 overflow-hidden">
      <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-3 md:block">
          <SidebarContent
            threads={threads}
            threadId={threadId}
            onSelectThread={handleSelectThread}
            onNewThread={() => { setThreadId(null); setMessages([]); setError(""); }}
          />
        </aside>

        {/* Mobile drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-label="Lịch sử trò chuyện">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside className="absolute inset-y-0 left-0 w-[min(18rem,calc(100vw-1rem))] bg-white p-4 shadow-xl dark:bg-[#1a2244]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Lịch sử</h2>
                <button
                  type="button"
                  aria-label="Đóng menu"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-xl p-2 hover:bg-outline-variant/15"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <SidebarContent
                threads={threads}
                threadId={threadId}
                onSelectThread={(id) => { void handleSelectThread(id); setSidebarOpen(false); }}
                onNewThread={() => { setThreadId(null); setMessages([]); setError(""); setSidebarOpen(false); }}
              />
            </aside>
          </div>
        )}

        <section className="flex min-h-[calc(100dvh-12rem)] flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2244]">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-outline-variant/20 px-4 py-3">
            <button
              type="button"
              aria-label="Mở lịch sử trò chuyện"
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-on-background/60 hover:bg-outline-variant/15 md:hidden"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <h2 className="text-sm font-semibold text-on-background">Peerlight AI Chat</h2>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4">
            {isLoading ? <ChatSkeleton /> : null}
            {!isLoading && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Menu size={20} />
                </div>
                <p className="mt-3 text-sm font-medium text-on-background">Chào em!</p>
                <p className="mt-1 max-w-sm text-xs text-on-background/60">
                  {PRIVATE_CHAT_COPY}
                </p>
                <p className="mt-2 max-w-sm text-[11px] text-on-background/50">
                  {IMMEDIATE_SUPPORT_COPY}
                </p>
              </div>
            ) : null}
            <div className="space-y-3" aria-live="polite" aria-relevant="additions">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {isStreaming && streamingContent && (
                <article className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-outline-variant/10 dark:bg-outline-variant/20 text-on-background">
                    <p className="text-xs font-semibold opacity-70">Peerlight AI</p>
                    <div className="mt-1 text-sm whitespace-pre-wrap">{streamingContent}</div>
                  </div>
                </article>
              )}
              {isSending && !streamingContent && (
                <article className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-outline-variant/10 dark:bg-outline-variant/20 text-on-background">
                    <p className="text-xs font-semibold opacity-70">Peerlight AI</p>
                    <div className="mt-1 flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </article>
              )}
            </div>
            {error ? <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
          </div>

          {/* Input area */}
          <form className="border-t border-outline-variant/20 px-4 py-3" onSubmit={handleSend}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <textarea
                id="chat-message"
                aria-label="Điều em muốn chia sẻ"
                aria-required="true"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Viết vài dòng theo cách em thấy thoải mái..."
                rows={2}
                className="min-h-[2.5rem] max-h-32 flex-1 resize-none rounded-xl border border-outline-variant/30 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-on-background/40 focus:border-primary dark:border-outline-variant/20"
              />
              <button
                type="submit"
                disabled={isSending || !draft.trim()}
                className="btn-press flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-on-primary disabled:opacity-40 sm:w-auto"
              >
                {isSending ? "..." : "Gửi"}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-on-background/40">
              {INTRO_COPY}
            </p>
          </form>
        </section>
      </div>
    </section>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isStudent = message.role === "student";
  const paragraphs = message.content.split("\n").filter(Boolean);
  if (message.safety_flagged && !isStudent) {
    return (
      <article className="rounded-2xl border-2 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">Mình muốn ưu tiên sự an toàn của em</h2>
        </div>
        <div className="mt-2 space-y-1.5 text-sm text-red-700 dark:text-red-300/80">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <Link className="mt-3 inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white" href="/student/sos">
          Đi tới SOS hỗ trợ
        </Link>
      </article>
    );
  }
  return (
    <article className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isStudent ? "bg-primary text-on-primary" : "bg-outline-variant/10 dark:bg-outline-variant/20 text-on-background"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold opacity-70">{isStudent ? "Em" : "Peerlight AI"}</p>
        </div>
        <div className="mt-1 space-y-1.5 text-sm">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}

function SidebarContent({
  threads,
  threadId,
  onSelectThread,
  onNewThread,
}: {
  threads: ChatThread[];
  threadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = search.trim()
    ? threads.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : threads;

  return (
    <>
      <button
        type="button"
        onClick={onNewThread}
        className="btn-press min-h-11 w-full rounded-xl border border-outline-variant/30 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5"
      >
        + Cuộc trò chuyện mới
      </button>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm cuộc trò chuyện..."
        aria-label="Tìm kiếm cuộc trò chuyện"
        className="mt-2 w-full rounded-xl border border-outline-variant/30 bg-transparent px-3 py-2 text-xs outline-none placeholder:text-on-background/40 focus:border-primary"
      />
      <div className="mt-2 space-y-1">
        {filtered.length === 0 ? (
          <p className="rounded-xl bg-outline-variant/10 p-3 text-xs text-on-background/50">
            {search ? "Không tìm thấy cuộc trò chuyện." : "Chưa có lịch sử."}
          </p>
        ) : (
          filtered.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => onSelectThread(thread.id)}
              className={`btn-press min-h-11 w-full rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                thread.id === threadId ? "bg-primary/10 text-primary" : "text-on-background/70 hover:bg-outline-variant/10"
              }`}
            >
              <span className="block truncate">{thread.title || "Cuộc trò chuyện"}</span>
            </button>
          ))
        )}
      </div>
    </>
  );
}