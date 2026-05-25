"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import {
  getSelfCheck,
  submitSelfCheckAttempt,
  type SelfCheckAnswerSubmit,
  type SelfCheckDetail,
} from "@/lib/wellbeing-api";

type PageProps = {
  params: { testId: string } | Promise<{ testId: string }>;
};

export default function SelfCheckTakePage({ params }: PageProps) {
  const router = useRouter();
  const [test, setTest] = useState<SelfCheckDetail | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [validationMessage, setValidationMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    Promise.resolve(params)
      .then(({ testId }) => getSelfCheck(testId))
      .then((detail) => {
          setTest(detail);
          setHasError(false);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [params]);

  const questions = useMemo(() => test?.questions ?? [], [test]);
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  function requireCurrentAnswer() {
    if (!currentQuestion || answers[currentQuestion.id]) {
      setValidationMessage("");
      return true;
    }
    setValidationMessage("Hãy chọn một câu trả lời phù hợp nhất với em trước khi tiếp tục.");
    return false;
  }

  function goNext() {
    if (!requireCurrentAnswer()) {
      return;
    }
    setCurrentIndex((index) => Math.min(index + 1, questions.length - 1));
  }

  function goBack() {
    setValidationMessage("");
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  async function submitAnswers() {
    if (!test || !requireCurrentAnswer()) {
      return;
    }
    const payload: SelfCheckAnswerSubmit[] = questions.map((question) => ({
      question_id: question.id,
      choice_id: answers[question.id],
    }));
    setIsSubmitting(true);
    try {
      const result = await submitSelfCheckAttempt(test.id, payload);
      router.push(`/student/self-checks/results/${result.attempt_id}`);
    } catch {
      setValidationMessage("Chưa gửi được câu trả lời. Hãy kiểm tra lại và thử một lần nữa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p>Đang tải thông tin...</p>;
  }

  if (hasError || test === null || currentQuestion === undefined) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể quay lại danh sách rồi mở lại test tâm lý." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      <header className="rounded-3xl bg-secondary p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-display">{test.title}</h1>
          {test.is_demo ? <DemoBadge /> : null}
        </div>
        {test.description ? <p className="mt-3 text-body">{test.description}</p> : null}
        <p className="mt-4 text-label">
          Câu trả lời chi tiết là riêng tư với em theo mặc định. Người lớn được liên kết chỉ xem phần tóm tắt cần thiết để hỗ trợ em.
        </p>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-label">
          Câu {currentIndex + 1} / {questions.length}
        </p>
        <h2 className="mt-4 text-heading">{currentQuestion.text}</h2>
        <div className="mt-6 space-y-4">
          {currentQuestion.choices.map((choice) => {
            const isSelected = answers[currentQuestion.id] === choice.id;
            return (
              <label
                key={choice.id}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border p-4 text-body ${
                  isSelected ? "border-accent bg-secondary" : "border-[#CFE8E1] bg-white"
                }`}
              >
                <input
                  checked={isSelected}
                  name={currentQuestion.id}
                  onChange={() => {
                    setAnswers((current) => ({ ...current, [currentQuestion.id]: choice.id }));
                    setValidationMessage("");
                  }}
                  type="radio"
                />
                <span>{choice.text}</span>
              </label>
            );
          })}
        </div>
        {validationMessage ? (
          <p className="mt-6 rounded-2xl border border-[#F59E0B] bg-white p-4 text-label">{validationMessage}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="min-h-11 rounded-2xl border border-[#CFE8E1] px-4 font-semibold"
            disabled={currentIndex === 0 || isSubmitting}
            onClick={goBack}
            type="button"
          >
            Quay lại
          </button>
          {isLastQuestion ? (
            <button
              className="min-h-11 rounded-2xl bg-accent px-4 font-semibold text-white disabled:opacity-60"
              disabled={isSubmitting}
              onClick={submitAnswers}
              type="button"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi câu trả lời"}
            </button>
          ) : (
            <button className="min-h-11 rounded-2xl bg-accent px-4 font-semibold text-white" onClick={goNext} type="button">
              Tiếp tục
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
