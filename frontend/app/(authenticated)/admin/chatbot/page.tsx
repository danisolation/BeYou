"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bot } from "lucide-react";

import { PageSkeleton } from "@/components/skeletons";
import { useToast } from "@/components/toast";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
  type ChatbotSafetyConfig,
  getAdminChatbotConfig,
  updateAdminChatbotConfig,
} from "@/lib/chat-api";

export default function AdminChatbotPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [config, setConfig] = useState<ChatbotSafetyConfig | null>(null);
  const [keywordsText, setKeywordsText] = useState("");
  const [escalationMessage, setEscalationMessage] = useState("");
  const [trustedAdultMessage, setTrustedAdultMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const isDirty = config !== null && (
    keywordsText !== config.high_risk_keywords.join("\n") ||
    escalationMessage !== config.escalation_message ||
    trustedAdultMessage !== config.trusted_adult_message
  );
  useUnsavedChanges(isDirty);

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
      toastSuccess("Đã lưu cấu hình an toàn. Guardrail backend vẫn luôn bật.");
    } catch {
      toastError("Chưa lưu được cấu hình. Hãy giữ ít nhất một từ khóa nguy cơ và thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bot size={18} />
          </div>
          <h1 className="text-lg font-semibold text-on-background">Cấu hình chatbot</h1>
        </div>
        <p className="mt-3 text-sm text-on-background/70">
          Quản lý từ khóa nguy cơ và lời nhắc hỗ trợ an toàn. Lớp bảo vệ hệ thống luôn được bật.
        </p>
      </header>

      {isLoading ? <PageSkeleton /> : null}
      {config ? (
        <form className="space-y-6 rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6" onSubmit={handleSave}>
          <section className="rounded-2xl bg-primary/5 p-4">
            <h2 className="text-sm font-semibold">Nguồn xử lý AI</h2>
            <p className="mt-2 text-sm">
              Đang dùng: {config.provider.name === "fallback" ? "chế độ dự phòng an toàn" : "nguồn xử lý AI đã được cấu hình"}.
            </p>
            <p className="mt-1 text-xs">
              Guardrail backend: {config.guardrails_locked ? "luôn bật" : "cần kiểm tra lại"}
            </p>
          </section>

          <label className="block space-y-2 text-sm font-medium">
            Từ khóa nguy cơ cao
            <textarea
              aria-label="Từ khóa nguy cơ cao"
              value={keywordsText}
              onChange={(event) => setKeywordsText(event.target.value)}
              className="min-h-40 w-full rounded-xl border border-outline-variant/30 p-4"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            Lời nhắn khi cần ưu tiên an toàn
            <textarea
              aria-label="Lời nhắn khi cần ưu tiên an toàn"
              value={escalationMessage}
              onChange={(event) => setEscalationMessage(event.target.value)}
              className="min-h-32 w-full rounded-xl border border-outline-variant/30 p-4"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            Lời nhắn người lớn tin tưởng
            <textarea
              aria-label="Lời nhắn người lớn tin tưởng"
              value={trustedAdultMessage}
              onChange={(event) => setTrustedAdultMessage(event.target.value)}
              className="min-h-28 w-full rounded-xl border border-outline-variant/30 p-4"
            />
          </label>

          {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? "Đang lưu..." : "Lưu cấu hình an toàn"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
