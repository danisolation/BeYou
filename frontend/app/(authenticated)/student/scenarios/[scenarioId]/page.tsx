"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import {
  getScenario,
  submitScenarioAttempt,
  type ScenarioDetail,
  type ScenarioFeedback,
} from "@/lib/wellbeing-api";

type PageProps = {
  params: { scenarioId: string } | Promise<{ scenarioId: string }>;
};

function signalLabel(signal: ScenarioFeedback["signal"]) {
  return signal === "risky" ? "Lựa chọn cần cân nhắc thêm" : "Lựa chọn có điểm tích cực";
}

export default function ScenarioDetailPage({ params }: PageProps) {
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState("");
  const [feedback, setFeedback] = useState<ScenarioFeedback | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [scenarioId, setScenarioId] = useState("");

  useEffect(() => {
    Promise.resolve(params)
      .then(({ scenarioId: resolvedScenarioId }) => {
        setScenarioId(resolvedScenarioId);
        return getScenario(resolvedScenarioId);
      })
      .then((detail) => {
        setScenario(detail);
        setHasError(false);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [params]);

  async function submitChoice() {
    if (!selectedChoiceId) {
      setMessage("Hãy chọn một cách phản hồi em muốn thử trước khi lưu.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitScenarioAttempt(scenarioId, selectedChoiceId);
      setFeedback(result);
      setMessage("");
    } catch {
      setMessage("Chưa lưu được lựa chọn. Hãy thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="p-6 text-sm text-on-background/70">Đang tải thông tin...</p>;
  }

  if (hasError || scenario === null) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể quay lại danh sách rồi mở lại tình huống." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/student/scenarios"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <header className="rounded-2xl bg-white dark:bg-[#1a2940] border border-outline-variant/30 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold text-on-background">{scenario.title}</h1>
          {scenario.is_demo ? <DemoBadge /> : null}
        </div>
        <p className="mt-4 text-sm text-on-background/80">{scenario.situation}</p>
        {scenario.skill_tag ? (
          <p className="mt-4 inline-flex gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            <span>Kỹ năng liên quan:</span>
            <span className="font-semibold">{scenario.skill_tag}</span>
          </p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] p-6">
        <h2 className="text-sm font-semibold text-on-background">Em muốn thử cách phản hồi nào?</h2>
        <div className="mt-6 space-y-3">
          {scenario.choices.map((choice, index) => {
            const isSelected = selectedChoiceId === choice.id;
            return (
              <label
                key={choice.id}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10 text-on-background"
                    : "border-outline-variant bg-white text-on-background/80 hover:bg-white dark:bg-[#1e2d40]"
                }`}
              >
                <input
                  className="sr-only"
                  checked={isSelected}
                  name="scenario-choice"
                  onChange={() => {
                    setSelectedChoiceId(choice.id);
                    setMessage("");
                  }}
                  type="radio"
                />
                <span
                  aria-hidden="true"
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold ${
                    isSelected ? "bg-primary text-on-primary" : "bg-white dark:bg-[#1a2940] text-on-background"
                  }`}
                >
                  {index + 1}
                </span>
                <span>{choice.text}</span>
              </label>
            );
          })}
        </div>
        {message ? (
          <p className="mt-6 rounded-xl border border-[#F59E0B] bg-white dark:bg-[#1a2940] p-4 text-sm text-on-background/80">{message}</p>
        ) : null}
        <button
          className="mt-6 min-h-11 rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary disabled:opacity-60"
          disabled={isSubmitting}
          onClick={submitChoice}
          type="button"
        >
          {isSubmitting ? "Đang lưu lựa chọn..." : "Chọn cách phản hồi này"}
        </button>
      </section>

      {feedback ? (
        <section
          className={`rounded-2xl p-6 ${
            feedback.signal === "risky"
              ? "border border-amber-300 bg-white dark:bg-[#1e2d40]"
              : "border border-primary/30 bg-white dark:bg-[#1e2d40]"
          }`}
        >
          <h2 className="text-sm font-semibold text-on-background">Lời khuyên</h2>
          <p className={`mt-3 text-sm font-semibold ${feedback.signal === "risky" ? "text-amber-700" : "text-primary"}`}>
            {signalLabel(feedback.signal)}
          </p>
          {feedback.selected_choice ? (
            <p className="mt-4 text-sm text-on-background/80">
              <span className="font-semibold">Lựa chọn của em: </span>
              {feedback.selected_choice}
            </p>
          ) : null}
          {feedback.feedback ? <p className="mt-3 text-sm text-on-background/80">{feedback.feedback}</p> : null}
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-white dark:bg-[#1a2940] p-4">
              <h3 className="text-sm font-semibold text-on-background">Lời khuyên nên thử</h3>
              <p className="mt-2 text-sm text-on-background/80">{feedback.recommended_response}</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-[#1a2940] p-4">
              <h3 className="text-sm font-semibold text-on-background">Lời khuyên để nhớ</h3>
              <p className="mt-2 text-sm text-on-background/80">{feedback.lesson}</p>
            </div>
            {feedback.skill_tag ? (
              <p className="text-sm text-on-background/70">
                <span className="font-semibold">Kỹ năng liên quan:</span>{" "}
                {feedback.skill_tag}
              </p>
            ) : null}
          </div>
          <Link
            className="mt-6 inline-flex min-h-11 items-center font-semibold text-primary"
            href="/student/scenarios"
          >
            Thực hành tình huống khác
          </Link>
        </section>
      ) : null}
    </main>
  );
}
