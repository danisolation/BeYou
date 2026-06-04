"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { HeartHandshake, Menu, X, Trash2, Plus, Search, Send, ShieldCheck, Sparkles } from "lucide-react";

import { ChatSkeleton } from "@/components/skeletons";
import { useToast } from "@/components/toast";
import {
  type ChatMessage,
  type ChatThread,
  type StreamEvent,
  getChatTranscript,
  listChatThreads,
  sendChatMessage,
  sendChatMessageStream,
  deleteChatThread,
} from "@/lib/chat-api";

const INTRO_COPY =
  "Peerlight AI luôn ở đây lắng nghe, nhưng không thay thế chuyên gia tâm lý hay bác sĩ nhé. Mình sẽ cùng em nghĩ về bước an toàn tiếp theo.";

const SUGGESTIONS = [
  { text: "Em cảm thấy mệt mỏi và áp lực thi cử...", label: "Áp lực thi cử" },
  { text: "Làm sao để cân bằng giữa học tập và việc nghỉ ngơi?", label: "Cân bằng học tập" },
  { text: "Em đang gặp mâu thuẫn với một bạn cùng lớp...", label: "Mối quan hệ" },
  { text: "Em cần một lời khuyên để giữ bình tĩnh điều hòa cảm xúc.", label: "Giải tỏa cảm xúc" },
];
const IMMEDIATE_SUPPORT_COPY =
  "Nếu lúc này em thấy không an toàn, hãy tìm ngay một người em tin ở gần mình hoặc dùng SOS trong Peerlight AI nhé.";
const PRIVATE_CHAT_COPY =
  "Em có thể viết ngắn thôi, chưa cần hoàn hảo. Cuộc trò chuyện của em được giữ riêng tư.";
const CHAT_CHARACTER_LIMIT = 1200;
const SAFETY_POINTS = ["Riêng tư với em", "Không thay thế chuyên gia", "Có SOS khi cần gấp"];

function formatChatTime(value?: string | null) {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { success: toastSuccess, error: toastError } = useToast();

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, isSending]);

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

  async function handleDeleteThread(targetId: string, event?: React.MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    const confirmDelete = window.confirm("Em có chắc chắn muốn xóa vĩnh viễn đoạn hội thoại này?");
    if (!confirmDelete) return;

    try {
      await deleteChatThread(targetId);
      toastSuccess("Đã xóa đoạn hội thoại thành công.");
      
      if (threadId === targetId) {
        setThreadId(null);
        setMessages([]);
      }
      setThreads((current) => current.filter((t) => t.id !== targetId));
    } catch {
      toastError("Không thể xóa đoạn hội thoại này. Vui lòng thử lại sau.");
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim().slice(0, CHAT_CHARACTER_LIMIT);
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

  const activeThread = threads.find((t) => t.id === threadId);
  const remainingCharacters = CHAT_CHARACTER_LIMIT - draft.length;

  return (
    <section className="space-y-4 overflow-hidden">
      <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden rounded-[20px] border border-outline-variant/30 bg-white dark:bg-[#1a2244] p-4 soft-card md:block">
          <SidebarContent
            threads={threads}
            threadId={threadId}
            onSelectThread={handleSelectThread}
            onNewThread={() => { setThreadId(null); setMessages([]); setError(""); }}
            onDeleteThread={handleDeleteThread}
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
            <aside className="absolute inset-y-0 left-0 w-[min(20rem,calc(100vw-1rem))] bg-white p-4 shadow-xl dark:bg-[#1a2244] flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Lịch sử trò chuyện</h2>
                <button
                  type="button"
                  aria-label="Đóng menu"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-xl p-2 hover:bg-outline-variant/15"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent
                  threads={threads}
                  threadId={threadId}
                  onSelectThread={(id) => { void handleSelectThread(id); setSidebarOpen(false); }}
                  onNewThread={() => { setThreadId(null); setMessages([]); setError(""); setSidebarOpen(false); }}
                  onDeleteThread={handleDeleteThread}
                />
              </div>
            </aside>
          </div>
        )}

        <section className="flex min-h-[calc(100dvh-12rem)] flex-col overflow-hidden rounded-[24px] border border-outline-variant/30 bg-white dark:bg-[#1a2244] soft-card shadow-sm">
          {/* Chat header */}
          <div className="border-b border-outline-variant/20 bg-gradient-to-r from-primary/10 via-white to-accent-violet/10 px-5 py-4 dark:from-primary/15 dark:via-[#1a2244] dark:to-accent-violet/10">
            <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Mở lịch sử trò chuyện"
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-on-background/60 hover:bg-outline-variant/15 md:hidden"
              >
                <Menu size={18} aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <h2 className="flex items-center gap-1.5 text-base font-extrabold text-on-background">
                  <Sparkles size={17} className="text-primary animate-pulse" />
                  Peerlight AI Chat
                </h2>
                <p className="mt-0.5 max-w-[220px] truncate text-[11px] font-medium text-on-background/60 sm:max-w-md">
                  {activeThread ? `Đang hội thoại: ${activeThread.title}` : "Một không gian nhẹ nhàng để em viết ra điều đang giữ trong lòng."}
                </p>
              </div>
            </div>
            
            {threadId && (
              <button
                type="button"
                onClick={(e) => handleDeleteThread(threadId, e)}
                title="Xóa cuộc trò chuyện hiện tại"
                aria-label="Xóa cuộc trò chuyện"
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-500/10 px-2.5 py-1.5 rounded-xl transition-all font-medium border border-red-500/20"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Xóa trò chuyện</span>
              </button>
            )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SAFETY_POINTS.map((point) => (
                <span
                  key={point}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/10 bg-white/70 px-2.5 py-1 text-[11px] font-bold text-primary shadow-sm dark:bg-white/5 dark:text-accent-violet"
                >
                  <ShieldCheck size={12} aria-hidden="true" />
                  {point}
                </span>
              ))}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-x-hidden overflow-y-auto px-5 py-5 space-y-4">
            {!isLoading && messages.length > 0 ? (
              <div className="rounded-2xl border border-primary/10 bg-primary/[0.035] p-3 text-xs leading-relaxed text-on-background/65 dark:bg-primary/10">
                <span className="font-bold text-primary dark:text-accent-violet">Nhắc nhẹ:</span> {INTRO_COPY} Nếu thấy không an toàn ngay lúc này, em có thể dùng SOS ở bất cứ lúc nào.
              </div>
            ) : null}
            {isLoading ? <ChatSkeleton /> : null}
            {!isLoading && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center max-w-lg mx-auto">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-tr from-primary to-[#a855f7] text-white shadow-lg shadow-primary/20">
                  <HeartHandshake size={28} />
                </div>
                <h3 className="mt-5 text-xl font-extrabold text-on-background">Chào em, mình đang lắng nghe.</h3>
                <p className="mt-2 text-sm text-on-background/75 leading-relaxed font-medium">
                  {PRIVATE_CHAT_COPY}
                </p>
                <div className="mt-4 grid w-full gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-3 text-left text-xs text-on-background/70 dark:bg-primary/10 sm:grid-cols-[1fr_auto] sm:items-center">
                  <p><span className="font-bold text-primary dark:text-accent-violet">Khi cần gấp:</span> {IMMEDIATE_SUPPORT_COPY}</p>
                  <Link href="/student/sos" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-3 text-xs font-bold text-white no-underline shadow-sm shadow-red-600/20 hover:bg-red-700">
                    Mở SOS
                  </Link>
                </div>

                <div className="w-full mt-8">
                  <p className="text-xs font-semibold text-on-background/50 uppercase tracking-wider text-left mb-3">Chủ đề gợi ý chia sẻ</p>
                  <div className="grid gap-2.5 sm:grid-cols-2 text-left">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => {
                          setDraft(s.text);
                          document.getElementById("chat-message")?.focus();
                        }}
                        className="p-4 text-xs border border-primary/10 hover:border-primary bg-primary/[0.02] dark:bg-primary/[0.04] rounded-2xl hover:bg-primary/[0.06] hover:shadow-sm hover:-translate-y-0.5 transition-all text-on-background/80 hover:text-primary font-medium text-left leading-relaxed flex flex-col gap-1.5 duration-200"
                      >
                        <span className="text-[11px] font-extrabold uppercase tracking-wide text-primary/80 dark:text-accent-violet">{s.label}</span>
                        <span>{s.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            
            <div className="space-y-4" aria-live="polite" aria-relevant="additions">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {isStreaming && streamingContent && (
                <article className="flex justify-start">
                  <div className="max-w-[80%] rounded-[22px] rounded-tl-sm px-4 py-3 bg-primary/[0.04] dark:bg-primary/[0.08] border border-primary/10 dark:border-primary/20 text-on-background shadow-black/[0.01]">
                    <p className="text-xs font-bold text-primary dark:text-accent-violet flex items-center gap-1 mb-1">
                      <Sparkles size={12} className="animate-pulse" />
                      Peerlight AI
                    </p>
                    <div className="mt-1 text-[13.5px] whitespace-pre-wrap leading-relaxed font-medium">{streamingContent}</div>
                  </div>
                </article>
              )}
              {isSending && !streamingContent && (
                <article className="flex justify-start">
                  <div className="max-w-[80%] rounded-[22px] rounded-tl-sm px-4 py-3 bg-primary/[0.04] dark:bg-primary/[0.08] border border-primary/10 dark:border-primary/20 text-on-background shadow-black/[0.02]">
                    <p className="text-xs font-bold text-primary dark:text-accent-violet flex items-center gap-1">
                      <Sparkles size={12} className="animate-pulse" />
                      Peerlight AI
                    </p>
                    <div className="mt-2 flex gap-1 items-center px-1">
                      <span className="h-2 w-2 rounded-full bg-primary/60 dark:bg-accent-violet/60 animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-primary/60 dark:bg-accent-violet/60 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-primary/60 dark:bg-accent-violet/60 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </article>
              )}
              <div ref={messagesEndRef} />
            </div>
            {error ? <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p> : null}
          </div>

          {/* Input area */}
          <form className="border-t border-outline-variant/20 bg-white/90 px-5 py-4 backdrop-blur dark:bg-[#1a2244]/95" onSubmit={handleSend}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <textarea
                id="chat-message"
                aria-label="Điều em muốn chia sẻ"
                aria-required="true"
                value={draft}
                maxLength={CHAT_CHARACTER_LIMIT}
                onChange={(event) => setDraft(event.target.value.slice(0, CHAT_CHARACTER_LIMIT))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (!isSending && draft.trim()) {
                      const form = event.currentTarget.form;
                      if (form) {
                        form.requestSubmit();
                      }
                    }
                  }
                }}
                placeholder="Viết vài dòng theo cách em thấy thoải mái..."
                rows={2}
                className="min-h-[3rem] max-h-32 flex-1 resize-none rounded-2xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none placeholder:text-on-background/40 focus:border-primary dark:border-outline-variant/20 focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                disabled={isSending || !draft.trim()}
                className="btn-press flex min-h-12 w-full shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-primary to-accent-violet px-5 text-sm font-bold text-on-primary disabled:opacity-40 disabled:from-primary disabled:to-primary sm:w-auto hover:brightness-105 hover:shadow-md transition-all shadow-sm shadow-primary/20"
              >
                {isSending ? (
                  "Đang gửi..."
                ) : (
                  <>
                    <span>Gửi</span>
                    <Send size={13} />
                  </>
                )}
              </button>
            </div>
            <div className="mt-2.5 flex flex-col gap-1 text-[10px] text-on-background/45 sm:flex-row sm:items-center sm:justify-between">
              <p className="leading-relaxed">Nhấn Enter để gửi, Shift + Enter để xuống dòng. {INTRO_COPY}</p>
              <span className={`font-bold ${remainingCharacters < 120 ? "text-red-500" : "text-on-background/45"}`}>
                {draft.length}/{CHAT_CHARACTER_LIMIT}
              </span>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isStudent = message.role === "student";
  const paragraphs = message.content.split("\n").filter(Boolean);
  const sentAt = formatChatTime(message.created_at);
  if (message.safety_flagged && !isStudent) {
    return (
      <article className="rounded-2xl border-2 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/30 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">⚠️</span>
          <h2 className="text-sm font-bold text-red-800 dark:text-red-300">Mình muốn ưu tiên sự an toàn của em</h2>
        </div>
        <div className="mt-2 space-y-2 text-sm text-red-700 dark:text-red-300/80 leading-relaxed font-medium">
          {paragraphs.length > 0 ? paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          )) : <p>Mình muốn em ưu tiên an toàn ngay lúc này.</p>}
        </div>
        <div className="mt-4">
          <Link className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 hover:scale-[1.02] font-bold px-4 py-2.5 text-sm text-white max-w-max transition-all shadow-sm shadow-red-600/20" href="/student/sos">
            Đi tới SOS hỗ trợ
          </Link>
        </div>
      </article>
    );
  }
  return (
    <article className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[min(86%,42rem)] px-4 py-3 shadow-md shadow-black/[0.01] transition-all duration-200 ${
        isStudent 
          ? "bg-gradient-to-br from-[#7457e8] to-[#9178ff] text-white rounded-[22px] rounded-tr-sm shadow-primary/10" 
          : "bg-primary/[0.04] dark:bg-primary/[0.08] border border-primary/10 dark:border-primary/20 text-on-background rounded-[22px] rounded-tl-sm"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <p className={`text-xs font-bold flex items-center gap-1 ${isStudent ? "text-white/85" : "text-primary dark:text-accent-violet"}`}>
            {isStudent ? null : <Sparkles size={12} className="animate-pulse" />}
            {isStudent ? "Em" : "Peerlight AI"}
          </p>
          {sentAt ? <time className={`text-[10px] font-semibold ${isStudent ? "text-white/60" : "text-on-background/40"}`}>{sentAt}</time> : null}
        </div>
        <div className="mt-1 space-y-1.5 text-[13.5px] leading-relaxed whitespace-pre-wrap font-medium">
          {paragraphs.length > 0 ? paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          )) : <p>—</p>}
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
  onDeleteThread,
}: {
  threads: ChatThread[];
  threadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string, e: React.MouseEvent) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = search.trim()
    ? threads.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : threads;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 rounded-2xl border border-primary/10 bg-primary/[0.04] p-3 text-xs leading-relaxed text-on-background/65 dark:bg-primary/10">
        <p className="font-bold text-primary dark:text-accent-violet">Không gian trò chuyện</p>
        <p className="mt-1">Em có thể bắt đầu cuộc trò chuyện mới bất cứ khi nào muốn đổi chủ đề.</p>
      </div>
      <button
        type="button"
        onClick={onNewThread}
        className="btn-press min-h-11 w-full rounded-xl bg-primary/10 hover:bg-primary/15 px-3 py-2 text-xs font-bold text-primary flex items-center justify-center gap-1 transition-all border border-primary/20"
      >
        <Plus size={14} aria-hidden="true" />
        Cuộc trò chuyện mới
      </button>
      <div className="relative mt-3">
        <span className="absolute inset-y-0 left-3 flex items-center text-on-background/45">
          <Search size={12} aria-hidden="true" />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm cuộc trò chuyện..."
          aria-label="Tìm kiếm cuộc trò chuyện"
          className="w-full rounded-xl border border-outline-variant/30 bg-transparent pl-8 pr-3 py-2 text-xs outline-none placeholder:text-on-background/40 focus:border-primary transition-all focus:ring-1 focus:ring-primary/25"
        />
      </div>
      <div className="mt-4 space-y-1 overflow-y-auto flex-1 max-h-[400px] md:max-h-full">
        {filtered.length === 0 ? (
          <p className="rounded-xl bg-outline-variant/10 p-3 text-xs text-on-background/50 text-center font-medium">
            {search ? "Không tìm thấy cuộc trò chuyện." : "Chưa có lịch sử."}
          </p>
        ) : (
          filtered.map((thread) => (
            <div
              key={thread.id}
              className={`group flex items-center justify-between rounded-xl px-1.5 py-1.5 transition-all ${
                thread.id === threadId ? "bg-primary/10 text-primary animate-fade-in" : "text-on-background/70 hover:bg-outline-variant/10"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectThread(thread.id)}
                className="btn-press flex-1 min-h-8 text-left text-xs font-semibold pl-1.5 py-1 max-w-[calc(100%-2rem)] text-ellipsis truncate block"
              >
                <span className="block truncate">{thread.title || "Cuộc trò chuyện"}</span>
                <span className="mt-0.5 block truncate text-[10px] font-medium opacity-60">
                  {formatChatTime(thread.last_message_at ?? thread.updated_at)}
                </span>
              </button>
              
              <button
                type="button"
                onClick={(e) => onDeleteThread(thread.id, e)}
                title="Xóa cuộc trò chuyện này"
                aria-label="Xóa cuộc trò chuyện"
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-500/10 p-1 rounded-lg transition-all ml-1 shrink-0"
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}