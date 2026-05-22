"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import {
  type ChatMessage,
  getChatTranscript,
  listChatThreads,
  sendChatMessage,
} from "@/lib/chat-api";

const INTRO_COPY =
  "BeYou không thay thế chuyên gia tư vấn hay bác sĩ. Mình có thể lắng nghe và giúp em nghĩ về bước an toàn tiếp theo.";
const IMMEDIATE_SUPPORT_COPY =
  "Nếu em đang thấy không an toàn ngay lúc này, hãy tìm một người lớn tin cậy ở gần em hoặc dùng SOS trong BeYou.";
const PRIVATE_CHAT_COPY =
  "Em có thể viết ngắn, chưa cần hoàn hảo. Nội dung trò chuyện riêng tư không hiển thị cho người lớn theo mặc định.";

export default function StudentChatPage() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listChatThreads()
      .then(async (threads) => {
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

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message) {
      return;
    }
    setIsSending(true);
    setError("");
    try {
      const response = await sendChatMessage({ message, thread_id: threadId });
      setThreadId(response.thread_id);
      setMessages((current) => [...current, response.student_message, response.assistant_message]);
      setDraft("");
    } catch {
      setError("Chưa gửi được tin nhắn. Hãy thử lại hoặc dùng SOS nếu em đang cần hỗ trợ ngay.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-secondary p-6 shadow-sm">
        <h1 className="text-display">Trò chuyện với BeYou</h1>
        <p className="mt-3 max-w-3xl text-body">{INTRO_COPY}</p>
        <p className="mt-2 max-w-3xl text-label">{IMMEDIATE_SUPPORT_COPY}</p>
        <p className="mt-2 max-w-3xl text-label">{PRIVATE_CHAT_COPY}</p>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-heading">Cuộc trò chuyện của em</h2>
        {isLoading ? <p className="mt-4 text-body">Đang tải cuộc trò chuyện...</p> : null}
        {!isLoading && messages.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-secondary p-4 text-body">
            Chưa có tin nhắn nào. Em có thể bắt đầu bằng một điều nhỏ đang làm em bận lòng.
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
            Điều em muốn chia sẻ
          </label>
          <textarea
            id="chat-message"
            aria-label="Điều em muốn chia sẻ"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Viết vài dòng theo cách em thấy thoải mái..."
            className="min-h-28 w-full rounded-2xl border border-[#CFE8E1] p-4"
          />
          <button
            type="submit"
            disabled={isSending}
            className="min-h-11 rounded-2xl bg-accent px-5 font-semibold text-white disabled:opacity-60"
          >
            {isSending ? "Đang gửi..." : "Gửi chia sẻ"}
          </button>
        </form>
      </section>
    </section>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isStudent = message.role === "student";
  const paragraphs = message.content.split("\n").filter(Boolean);
  if (message.safety_flagged && !isStudent) {
    return (
      <article className="rounded-3xl border-2 border-[#F3C0C0] bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-heading">Mình muốn ưu tiên sự an toàn của em ngay lúc này</h2>
          {message.is_demo ? <DemoBadge /> : null}
        </div>
        <div className="mt-3 space-y-2 text-body">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-3 text-label">
          Nếu có người lớn tin cậy ở gần em, hãy nói với họ rằng em cần được ở cùng và được lắng nghe ngay bây giờ.
        </p>
        <Link className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-red-600 px-4 font-semibold text-white" href="/student">
          Đi tới SOS hỗ trợ
        </Link>
      </article>
    );
  }
  return (
    <article className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-3xl rounded-3xl p-4 ${isStudent ? "bg-accent text-white" : "bg-secondary text-[#12332E]"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-label font-semibold">{isStudent ? "Em" : "BeYou"}</p>
          {message.is_demo ? <DemoBadge /> : null}
        </div>
        <div className="mt-2 space-y-2 text-body">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
