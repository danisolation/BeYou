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
    <section className="space-y-6">
      <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
        <h1 className="text-2xl font-bold">Peerlight AI</h1>
        <p className="mt-3 max-w-3xl text-body">{INTRO_COPY}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden rounded-2xl border border-outline-variant bg-surface p-4 shadow-sm lg:block">
          <SidebarContent
            threads={threads}
            threadId={threadId}
            onSelectThread={handleSelectThread}
            onNewThread={() => { setThreadId(null); setMessages([]); setError(""); }}
          />
        </aside>

        {/* Mobile drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside className="absolute inset-y-0 left-0 w-72 bg-surface p-4 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-heading">Lịch sử</h2>
                <button
                  type="button"
                  aria-label="Đóng menu"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-2xl p-2 hover:bg-secondary"
                >
                  <X size={20} aria-hidden="true" />
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

        <section className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Mở lịch sử trò chuyện"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-outline-variant px-3 text-primary hover:bg-secondary lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <h2 className="text-heading">Trò chuyện với Peerlight AI</h2>
          </div>
          {isLoading ? <p className="mt-4 text-body">Đang tải cuộc trò chuyện...</p> : null}
          {!isLoading && messages.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-secondary p-4 text-body">
              Chưa có tin nhắn nào. Bạn có thể hỏi Peerlight AI về cách đồng hành cùng con.
            </p>
          ) : null}
          <div className="mt-4 space-y-4">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
          </div>
          {error ? <p role="alert" className="mt-4 text-body text-red-700">{error}</p> : null}

          <form className="mt-6 space-y-4" onSubmit={handleSend}>
            <label className="block text-label font-semibold" htmlFor="chat-message">
              Nội dung muốn trao đổi
            </label>
            <textarea
              id="chat-message"
              aria-label="Nội dung muốn trao đổi"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Hỏi về cách đồng hành cùng con..."
              className="min-h-28 w-full rounded-2xl border border-[#CFE8E1] p-4"
            />
            <button
              type="submit"
              disabled={isSending}
              className="min-h-11 rounded-2xl bg-accent px-5 font-semibold text-white disabled:opacity-60"
            >
              {isSending ? "Đang gửi..." : "Gửi"}
            </button>
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
      <div className={`max-w-3xl rounded-3xl p-4 ${isUser ? "bg-accent text-white" : "bg-secondary text-[#12332E]"}`}>
        <p className="text-label font-semibold">{isUser ? "Bạn" : "Peerlight AI"}</p>
        <div className="mt-2 space-y-2 text-body">
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
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-heading">Lịch sử</h2>
        <button
          type="button"
          onClick={onNewThread}
          className="rounded-2xl border border-outline-variant px-3 py-2 text-label font-semibold hover:bg-secondary"
        >
          Cuộc trò chuyện mới
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {threads.length === 0 ? (
          <p className="rounded-2xl bg-secondary p-3 text-label">Chưa có lịch sử.</p>
        ) : (
          threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => onSelectThread(thread.id)}
              className={`w-full rounded-2xl px-3 py-3 text-left text-label font-semibold ${
                thread.id === threadId ? "bg-primary text-on-primary" : "bg-secondary text-on-background hover:bg-surface-container"
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
