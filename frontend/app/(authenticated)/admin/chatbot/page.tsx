"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  type ChatbotSafetyConfig,
  getAdminChatbotConfig,
  updateAdminChatbotConfig,
} from "@/lib/chat-api";

export default function AdminChatbotPage() {
  const [config, setConfig] = useState<ChatbotSafetyConfig | null>(null);
  const [keywordsText, setKeywordsText] = useState("");
  const [escalationMessage, setEscalationMessage] = useState("");
  const [trustedAdultMessage, setTrustedAdultMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminChatbotConfig()
      .then((loaded) => {
        setConfig(loaded);
        setKeywordsText(loaded.high_risk_keywords.join("\n"));
        setEscalationMessage(loaded.escalation_message);
        setTrustedAdultMessage(loaded.trusted_adult_message);
      })
      .catch(() => setError("Chưa tải được cấu hình chatbot. Hãy thử lại từ trang quản trị."))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const highRiskKeywords = keywordsText
      .split("\n")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    setNotice("");
    setError("");
    if (highRiskKeywords.length === 0) {
      setError("Chưa lưu được cấu hình. Hãy giữ ít nhất một từ khóa nguy cơ và thử lại.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateAdminChatbotConfig({
        high_risk_keywords: highRiskKeywords,
        escalation_message: escalationMessage,
        trusted_adult_message: trustedAdultMessage,
      });
      setConfig(updated);
      setKeywordsText(updated.high_risk_keywords.join("\n"));
      setNotice("Đã lưu cấu hình an toàn. Guardrail backend vẫn luôn bật.");
    } catch {
      setError("Chưa lưu được cấu hình. Hãy giữ ít nhất một từ khóa nguy cơ và thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cấu hình chatbot an toàn</h1>
        <p className="mt-3 max-w-3xl text-sm">
          Khóa API chỉ được đọc bởi backend. Trang này không hiển thị hoặc lưu khóa API ở trình duyệt.
        </p>
        <p className="mt-2 max-w-3xl text-xs">
          Thay đổi copy an toàn phải giữ hướng hỗ trợ, không đưa lời khuyên lâm sàng và không tắt guardrail backend.
        </p>
      </div>

      {isLoading ? <p>Đang tải thông tin...</p> : null}
      {config ? (
        <form className="space-y-6 rounded-2xl bg-white dark:bg-[#1a2940] p-6 shadow-sm" onSubmit={handleSave}>
          <section className="rounded-2xl bg-primary/5 p-4">
            <h2 className="text-sm font-semibold">Thông tin provider</h2>
            <p className="mt-2 text-sm">
              Đang dùng: {config.provider.name === "fallback" ? "fallback an toàn" : "provider backend đã cấu hình"}.
            </p>
            <p className="mt-1 text-xs">
              Guardrail backend: {config.guardrails_locked ? "luôn bật" : "cần kiểm tra lại"}
            </p>
          </section>

          <label className="block space-y-2 text-xs font-semibold">
            Từ khóa nguy cơ cao
            <textarea
              aria-label="Từ khóa nguy cơ cao"
              value={keywordsText}
              onChange={(event) => setKeywordsText(event.target.value)}
              className="min-h-40 w-full rounded-2xl border border-outline-variant/30 p-4"
            />
          </label>

          <label className="block space-y-2 text-xs font-semibold">
            Lời nhắn khi cần ưu tiên an toàn
            <textarea
              aria-label="Lời nhắn khi cần ưu tiên an toàn"
              value={escalationMessage}
              onChange={(event) => setEscalationMessage(event.target.value)}
              className="min-h-32 w-full rounded-2xl border border-outline-variant/30 p-4"
            />
          </label>

          <label className="block space-y-2 text-xs font-semibold">
            Lời nhắn người lớn tin tưởng
            <textarea
              aria-label="Lời nhắn người lớn tin tưởng"
              value={trustedAdultMessage}
              onChange={(event) => setTrustedAdultMessage(event.target.value)}
              className="min-h-28 w-full rounded-2xl border border-outline-variant/30 p-4"
            />
          </label>

          {notice ? <p role="status" className="text-sm text-primary">{notice}</p> : null}
          {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="min-h-11 rounded-2xl bg-primary px-5 font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? "Đang lưu..." : "Lưu cấu hình an toàn"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
