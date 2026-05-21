"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import {
  getScenario,
  submitScenarioAttempt,
  type ScenarioDetail,
  type ScenarioFeedback,
} from "@/lib/wellbeing-api";

type PageProps = {
  params: { scenarioId: string };
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

  useEffect(() => {
    getScenario(params.scenarioId)
      .then((detail) => {
        setScenario(detail);
        setHasError(false);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [params.scenarioId]);

  async function submitChoice() {
    if (!selectedChoiceId) {
      setMessage("Hãy chọn một cách phản hồi em muốn thử trước khi lưu.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitScenarioAttempt(params.scenarioId, selectedChoiceId);
      setFeedback(result);
      setMessage("");
    } catch {
      setMessage("Chưa lưu được lựa chọn. Hãy thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p>Đang tải thông tin...</p>;
  }

  if (hasError || scenario === null) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể quay lại danh sách rồi mở lại tình huống." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      <header className="rounded-3xl bg-secondary p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-display">{scenario.title}</h1>
          {scenario.is_demo ? <DemoBadge /> : null}
        </div>
        <p className="mt-4 text-body">{scenario.situation}</p>
        <p className="mt-4 inline-flex gap-1 rounded-full bg-white px-3 py-1 text-label">
          <span>Kỹ năng liên quan</span>
          <span>{scenario.skill_tag}</span>
        </p>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-heading">Em muốn thử cách phản hồi nào?</h2>
        <div className="mt-6 space-y-4">
          {scenario.choices.map((choice) => {
            const isSelected = selectedChoiceId === choice.id;
            return (
              <label
                key={choice.id}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border p-4 text-body ${
                  isSelected ? "border-accent bg-secondary" : "border-[#CFE8E1] bg-white"
                }`}
              >
                <input
                  checked={isSelected}
                  name="scenario-choice"
                  onChange={() => {
                    setSelectedChoiceId(choice.id);
                    setMessage("");
                  }}
                  type="radio"
                />
                <span>{choice.text}</span>
              </label>
            );
          })}
        </div>
        {message ? <p className="mt-6 rounded-2xl border border-[#F59E0B] bg-white p-4 text-label">{message}</p> : null}
        <button
          className="mt-6 min-h-11 rounded-2xl bg-accent px-4 font-semibold text-white disabled:opacity-60"
          disabled={isSubmitting}
          onClick={submitChoice}
          type="button"
        >
          {isSubmitting ? "Đang lưu lựa chọn..." : "Chọn cách phản hồi này"}
        </button>
      </section>

      {feedback ? (
        <section
          className={`rounded-3xl bg-white p-6 shadow-sm ${
            feedback.signal === "risky" ? "border border-[#F59E0B]" : "border border-accent"
          }`}
        >
          <h2 className="text-heading">Gợi ý sau lựa chọn của em</h2>
          <p className="mt-4 text-label">{signalLabel(feedback.signal)}</p>
          {feedback.selected_choice ? (
            <p className="mt-4 text-body">
              <span className="font-semibold">Lựa chọn của em: </span>
              {feedback.selected_choice}
            </p>
          ) : null}
          {feedback.feedback ? <p className="mt-4 text-body">{feedback.feedback}</p> : null}
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-secondary p-4">
              <h3 className="text-heading">Cách phản hồi nên thử</h3>
              <p className="mt-2 text-body">{feedback.recommended_response}</p>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <h3 className="text-heading">Điều em có thể rút ra</h3>
              <p className="mt-2 text-body">{feedback.lesson}</p>
            </div>
            <p className="text-label">
              <span className="font-semibold">Kỹ năng liên quan</span>{" "}
              {feedback.skill_tag}
            </p>
          </div>
          <Link className="mt-6 inline-flex min-h-11 items-center font-semibold text-accent" href="/student/scenarios/history">
            Xem lịch sử tình huống
          </Link>
        </section>
      ) : null}
    </main>
  );
}
