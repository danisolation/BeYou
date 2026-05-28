"use client";

import { FormEvent, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import {
  type ChatMessage,
  type ChatThread,
  getParentChatTranscript,
  listParentChatThreads,
  sendParentChatMessage,
} from "@/lib/chat-api";

const INTRO_COPY =
  "Peerlight AI hỗ trợ bạn suy nghĩ về cách đồng hành cùng con. Nội dung trò chuyện riêng tư và không được chia sẻ với học sinh.";

export default function ParentChatPage() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;
    listParentChatThreads()
      .then(async (threads) => {
        if (active) setThreads(threads);
        if (!active || threads.length === 0) return;
        const latest = threads[0];
        const transcript = await getParentChatTranscript(latest.id);
        if (active) {
          setThreadId(transcript.thread.id);
          setMessages(transcript.messages);
        }
      })
      .catch(() => {
        if (active) setError("Chưa tải được cuộc trò chuyện. Vui lòng thử lại.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function handleSelectThread(nextThreadId: string) {
    setIsLoading(true);
    setError("");
    try {
      const transcript = await getParentChatTranscript(nextThreadId);
      setThreadId(transcript.thread.id);
      setMessages(transcript.messages);
    } catch {
      setError("Chưa tải được cuộc trò chuyện này.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    setIsSending(true);
    setError("");
    try {
      const response = await sendParentChatMessage({ message, thread_id: threadId });
      setThreadId(response.thread_id);
      setMessages((current) => [...current, response.student_message, response.assistant_message]);
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
            safety_state: "supportive" as const,
            last_message_at: response.assistant_message.created_at,
            created_at: response.student_message.created_at,
            updated_at: response.assistant_message.created_at,
            is_demo: false,
          },
          ...current,
        ];
      });
      setDraft("");
    } catch {
      setError("Chưa gửi được tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-3 lg:block">
          <SidebarContent
            threads={threads}
            threadId={threadId}
            onSelectThread={handleSelectThread}
            onNewThread={() => { setThreadId(null); setMessages([]); setError(""); }}
          />
        </aside>

        {/* Mobile drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-label="Lịch sử trò chuyện">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-[#1a2940] p-4 shadow-xl">
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

        <section className="flex flex-col rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940]">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-outline-variant/20 px-4 py-3">
            <button
              type="button"
              aria-label="Mở lịch sử trò chuyện"
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-on-background/60 hover:bg-outline-variant/15 lg:hidden"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <h2 className="text-sm font-semibold text-on-background">Peerlight AI – Hỗ trợ phụ huynh</h2>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {isLoading ? <p className="text-sm text-on-background/50">Đang tải...</p> : null}
            {!isLoading && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-medium text-on-background">Chào bạn!</p>
                <p className="mt-1 max-w-sm text-xs text-on-background/60">
                  {INTRO_COPY}
                </p>
              </div>
            ) : null}
            <div className="space-y-3" aria-live="polite" aria-relevant="additions">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
            </div>
            {error ? <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
          </div>

          {/* Input area */}
          <form className="border-t border-outline-variant/20 px-4 py-3" onSubmit={handleSend}>
            <div className="flex items-end gap-2">
              <textarea
                id="chat-message"
                aria-label="Nội dung muốn trao đổi"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Hỏi về cách đồng hành cùng con..."
                rows={2}
                className="min-h-[2.5rem] max-h-32 flex-1 resize-none rounded-xl border border-outline-variant/30 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-on-background/40 focus:border-primary dark:border-outline-variant/20"
              />
              <button
                type="submit"
                disabled={isSending || !draft.trim()}
                className="flex h-10 shrink-0 items-center rounded-xl bg-primary px-4 text-sm font-medium text-on-primary disabled:opacity-40"
              >
                {isSending ? "..." : "Gửi"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "student";
  const paragraphs = message.content.split("\n").filter(Boolean);
  return (
    <article className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? "bg-primary text-on-primary" : "bg-outline-variant/10 dark:bg-outline-variant/20 text-on-background"}`}>
        <p className="text-xs font-semibold opacity-70">{isUser ? "Bạn" : "Peerlight AI"}</p>
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
  return (
    <>
      <button
        type="button"
        onClick={onNewThread}
        className="w-full rounded-xl border border-outline-variant/30 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5"
      >
        + Cuộc trò chuyện mới
      </button>
      <div className="mt-3 space-y-1">
        {threads.length === 0 ? (
          <p className="rounded-xl bg-outline-variant/10 p-3 text-xs text-on-background/50">Chưa có lịch sử.</p>
        ) : (
          threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => onSelectThread(thread.id)}
              className={`w-full rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
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
