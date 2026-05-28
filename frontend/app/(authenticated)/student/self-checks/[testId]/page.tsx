"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

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
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

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
    return <p className="p-6 text-sm text-on-background/70">Đang tải thông tin...</p>;
  }

  if (hasError || test === null || currentQuestion === undefined) {
    return <EmptyState heading="Chưa tải được thông tin. Hãy thử lại." body="Em có thể quay lại danh sách rồi mở lại test tâm lý." />;
  }

  return (
    <main className="mx-auto max-w-[960px] space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/student/self-checks"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <header className="rounded-2xl bg-white dark:bg-[#1a2940] border border-outline-variant/30 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold text-on-background">{test.title}</h1>
          {test.is_demo ? <DemoBadge /> : null}
        </div>
        {test.description ? <p className="mt-3 text-sm text-on-background/70">{test.description}</p> : null}
        <p className="mt-4 text-sm text-on-background/60">
          Câu trả lời chi tiết là riêng tư với em theo mặc định. Người lớn được liên kết chỉ xem phần tóm tắt cần thiết để hỗ trợ em.
        </p>
      </header>

      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-on-background/70">
          <span>Câu {currentIndex + 1} / {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white dark:bg-[#1e2d40]">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <section className="rounded-2xl bg-white dark:bg-[#1e2d40] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-on-background">{currentQuestion.text}</h2>
        <div className="mt-6 space-y-3">
          {currentQuestion.choices.map((choice) => {
            const isSelected = answers[currentQuestion.id] === choice.id;
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
                  checked={isSelected}
                  name={currentQuestion.id}
                  onChange={() => {
                    setAnswers((current) => ({ ...current, [currentQuestion.id]: choice.id }));
                    setValidationMessage("");
                  }}
                  type="radio"
                  className="accent-primary"
                />
                <span>{choice.text}</span>
              </label>
            );
          })}
        </div>
        {validationMessage ? (
          <p className="mt-6 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-on-background/80">{validationMessage}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="min-h-11 rounded-xl border border-outline-variant px-5 py-3 font-semibold text-on-background disabled:opacity-40"
            disabled={currentIndex === 0 || isSubmitting}
            onClick={goBack}
            type="button"
          >
            Quay lại
          </button>
          {isLastQuestion ? (
            <button
              className="min-h-11 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary disabled:opacity-60"
              disabled={isSubmitting}
              onClick={submitAnswers}
              type="button"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi câu trả lời"}
            </button>
          ) : (
            <button
              className="min-h-11 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary"
              onClick={goNext}
              type="button"
            >
              Tiếp tục
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
