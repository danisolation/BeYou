"use client";

import { useEffect, useState } from "react";
import { FileText, Pencil, Trash2, Plus, Archive } from "lucide-react";

import {
  CONFIRM_ARCHIVE_CONTENT_COPY,
  CONFIRM_DELETE_DRAFT_CONTENT_COPY,
  DestructiveConfirmDialog,
  KEEP_CONTENT_COPY,
} from "@/components/admin/destructive-confirm-dialog";
import { DemoBadge } from "@/components/demo-badge";
import { EmptyState } from "@/components/empty-state";
import {
  archiveAdminScenario,
  archiveAdminSelfCheck,
  createAdminScenario,
  createAdminSelfCheck,
  deleteDraftAdminScenario,
  deleteDraftAdminSelfCheck,
  listAdminScenarios,
  listAdminSelfChecks,
  publishAdminScenario,
  publishAdminSelfCheck,
  updateAdminScenario,
  updateAdminSelfCheck,
  type AdminContentStatus,
  type AdminRiskStateLabel,
  type AdminScenarioContent,
  type AdminScenarioSignal,
  type AdminSelfCheckContent,
} from "@/lib/admin-content-api";
import { ApiError } from "@/lib/api";

const statusOptions: AdminContentStatus[] = ["draft", "published", "archived"];
const riskLabels: AdminRiskStateLabel[] = ["On dinh", "Can chu y", "Nen tim ho tro", "Can ho tro som"];
const signalOptions: AdminScenarioSignal[] = ["constructive", "risky"];
const defaultErrorCopy = "Chưa lưu được nội dung. Hãy kiểm tra lại các trường bắt buộc và thử lại.";

const emptySelfCheck: AdminSelfCheckContent = {
  title: "",
  description: "",
  status: "draft",
  is_active: true,
  is_demo: false,
  questions: [
    {
      text: "",
      sort_order: 1,
      choices: [
        { text: "", score_value: 0, sort_order: 1, is_demo: false },
        { text: "", score_value: 1, sort_order: 2, is_demo: false },
      ],
      is_demo: false,
    },
  ],
  thresholds: [
    {
      state_label: "On dinh",
      min_score: 0,
      max_score: 1,
      comment: "",
      advice: "",
      positive_content: "",
      suggested_next_action: "",
      is_demo: false,
    },
  ],
};

const emptyScenario: AdminScenarioContent = {
  title: "",
  situation: "",
  skill_tag: "",
  status: "draft",
  recommended_response: "",
  lesson: "",
  is_demo: false,
  choices: [
    { text: "", signal: "constructive", feedback: "", sort_order: 1, is_demo: false },
    {
      text: "Em đi theo dù không thoải mái.",
      signal: "risky",
      feedback: "Lựa chọn này có thể khiến tình huống khó hơn; em có thể dừng lại và tìm người hỗ trợ.",
      sort_order: 2,
      is_demo: false,
    },
  ],
};

type ConfirmationState =
  | { type: "archive-self-check"; id: string }
  | { type: "delete-self-check"; id: string }
  | { type: "archive-scenario"; id: string }
  | { type: "delete-scenario"; id: string }
  | null;

function cloneSelfCheck(content: AdminSelfCheckContent): AdminSelfCheckContent {
  return {
    ...content,
    questions: content.questions.map((question) => ({
      ...question,
      choices: question.choices.map((choice) => ({ ...choice })),
    })),
    thresholds: content.thresholds.map((threshold) => ({ ...threshold })),
  };
}

function cloneScenario(content: AdminScenarioContent): AdminScenarioContent {
  return {
    ...content,
    choices: content.choices.map((choice) => ({ ...choice })),
  };
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="space-y-1 text-sm font-medium">
      {label}
      <input
        aria-label={label}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-outline-variant/30 px-3"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-sm font-medium">
      {label}
      <textarea
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 w-full rounded-xl border border-outline-variant/30 px-3 py-2"
      />
    </label>
  );
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function labelFor(base: string, index: number): string {
  return index === 0 ? base : `${base} ${index + 1}`;
}

function choiceLabel(base: string, questionIndex: number, choiceIndex: number): string {
  return questionIndex === 0 && choiceIndex === 0 ? base : `${base} ${questionIndex + 1}.${choiceIndex + 1}`;
}

function errorCopy(error: unknown): string {
  if (error instanceof ApiError) {
    if (typeof error.detail === "string") {
      return error.detail;
    }
    if (
      error.detail !== null &&
      typeof error.detail === "object" &&
      "detail" in error.detail &&
      typeof error.detail.detail === "string"
    ) {
      return error.detail.detail;
    }
  }
  return defaultErrorCopy;
}

function nextSortOrder(items: Array<{ sort_order: number }>): number {
  return Math.max(0, ...items.map((item) => item.sort_order)) + 1;
}

function newSelfCheckChoice(sortOrder: number): AdminSelfCheckContent["questions"][number]["choices"][number] {
  return { text: "", score_value: 0, sort_order: sortOrder, is_demo: false };
}

function newSelfCheckQuestion(sortOrder: number): AdminSelfCheckContent["questions"][number] {
  return {
    text: "",
    sort_order: sortOrder,
    choices: [newSelfCheckChoice(1), newSelfCheckChoice(2)],
    is_demo: false,
  };
}

function newThreshold(sortOrder: number): AdminSelfCheckContent["thresholds"][number] {
  return {
    state_label: "On dinh",
    min_score: sortOrder - 1,
    max_score: sortOrder - 1,
    comment: "",
    advice: "",
    positive_content: "",
    suggested_next_action: "",
    is_demo: false,
  };
}

function newScenarioChoice(sortOrder: number): AdminScenarioContent["choices"][number] {
  return { text: "", signal: "constructive", feedback: "", sort_order: sortOrder, is_demo: false };
}

function StatusBadge({ status }: { status: AdminContentStatus }) {
  const styles: Record<AdminContentStatus, string> = {
    draft: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  const labels: Record<AdminContentStatus, string> = {
    draft: "Nháp",
    published: "Đã xuất bản",
    archived: "Đã lưu trữ",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function AdminContentPage() {
  const [selfChecks, setSelfChecks] = useState<AdminSelfCheckContent[]>([]);
  const [scenarios, setScenarios] = useState<AdminScenarioContent[]>([]);
  const [selfCheckDraft, setSelfCheckDraft] = useState<AdminSelfCheckContent>(cloneSelfCheck(emptySelfCheck));
  const [scenarioDraft, setScenarioDraft] = useState<AdminScenarioContent>(cloneScenario(emptyScenario));
  const [activeTab, setActiveTab] = useState<"self-check" | "scenario">("self-check");
  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function refreshContent() {
    const [loadedSelfChecks, loadedScenarios] = await Promise.all([listAdminSelfChecks(), listAdminScenarios()]);
    setSelfChecks(loadedSelfChecks);
    setScenarios(loadedScenarios);
    setSelfCheckDraft(cloneSelfCheck(loadedSelfChecks[0] ?? emptySelfCheck));
    setScenarioDraft(cloneScenario(loadedScenarios[0] ?? emptyScenario));
  }

  useEffect(() => {
    refreshContent().finally(() => setIsLoading(false));
  }, []);

  function updateSelfCheckQuestion(questionIndex: number, field: "text" | "sort_order", value: string) {
    setSelfCheckDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex ? { ...question, [field]: field === "sort_order" ? toNumber(value) : value } : question,
      ),
    }));
  }

  function addSelfCheckQuestion() {
    setSelfCheckDraft((current) => ({
      ...current,
      questions: [...current.questions, newSelfCheckQuestion(nextSortOrder(current.questions))],
    }));
  }

  function removeSelfCheckQuestion(questionIndex: number) {
    setSelfCheckDraft((current) => ({
      ...current,
      questions: current.questions.filter((_, index) => index !== questionIndex),
    }));
  }

  function updateSelfCheckChoice(
    questionIndex: number,
    choiceIndex: number,
    field: "text" | "score_value" | "sort_order",
    value: string,
  ) {
    setSelfCheckDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              choices: question.choices.map((choice, currentChoiceIndex) =>
                currentChoiceIndex === choiceIndex
                  ? { ...choice, [field]: field === "text" ? value : toNumber(value) }
                  : choice,
              ),
            }
          : question,
      ),
    }));
  }

  function addSelfCheckChoice(questionIndex: number) {
    setSelfCheckDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? { ...question, choices: [...question.choices, newSelfCheckChoice(nextSortOrder(question.choices))] }
          : question,
      ),
    }));
  }

  function removeSelfCheckChoice(questionIndex: number, choiceIndex: number) {
    setSelfCheckDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? { ...question, choices: question.choices.filter((_, currentChoiceIndex) => currentChoiceIndex !== choiceIndex) }
          : question,
      ),
    }));
  }

  function updateThreshold(indexToUpdate: number, field: keyof AdminSelfCheckContent["thresholds"][number], value: string) {
    const numericFields = ["min_score", "max_score"];
    setSelfCheckDraft((current) => ({
      ...current,
      thresholds: current.thresholds.map((threshold, index) =>
        index === indexToUpdate
          ? {
              ...threshold,
              [field]: numericFields.includes(String(field)) ? toNumber(value) : value,
            }
          : threshold,
      ),
    }));
  }

  function addThreshold() {
    setSelfCheckDraft((current) => ({
      ...current,
      thresholds: [...current.thresholds, newThreshold(current.thresholds.length + 1)],
    }));
  }

  function removeThreshold(thresholdIndex: number) {
    setSelfCheckDraft((current) => ({
      ...current,
      thresholds: current.thresholds.filter((_, index) => index !== thresholdIndex),
    }));
  }

  function updateScenarioChoice(
    choiceIndex: number,
    field: "text" | "signal" | "feedback" | "sort_order",
    value: string,
  ) {
    setScenarioDraft((current) => ({
      ...current,
      choices: current.choices.map((choice, index) =>
        index === choiceIndex ? { ...choice, [field]: field === "sort_order" ? toNumber(value) : value } : choice,
      ),
    }));
  }

  function addScenarioChoice() {
    setScenarioDraft((current) => ({
      ...current,
      choices: [...current.choices, newScenarioChoice(nextSortOrder(current.choices))],
    }));
  }

  function removeScenarioChoice(choiceIndex: number) {
    setScenarioDraft((current) => ({
      ...current,
      choices: current.choices.filter((_, index) => index !== choiceIndex),
    }));
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    try {
      setError("");
      setNotice("");
      await action();
      await refreshContent();
      setNotice(successMessage);
    } catch (actionError) {
      setError(errorCopy(actionError));
    }
  }

  async function saveSelfCheckDraft() {
    try {
      setError("");
      setNotice("");
      const saved = selfCheckDraft.id
        ? await updateAdminSelfCheck(selfCheckDraft.id, selfCheckDraft)
        : await createAdminSelfCheck(selfCheckDraft);
      const loadedSelfChecks = await listAdminSelfChecks();
      setSelfChecks(loadedSelfChecks);
      setSelfCheckDraft(cloneSelfCheck(saved));
      setNotice("Đã lưu bản nháp tự kiểm tra. Hãy xuất bản khi nội dung đã đủ hỗ trợ và không chẩn đoán.");
    } catch (saveError) {
      setError(errorCopy(saveError));
    }
  }

  async function saveScenarioDraft() {
    try {
      setError("");
      setNotice("");
      const saved = scenarioDraft.id
        ? await updateAdminScenario(scenarioDraft.id, scenarioDraft)
        : await createAdminScenario(scenarioDraft);
      const loadedScenarios = await listAdminScenarios();
      setScenarios(loadedScenarios);
      setScenarioDraft(cloneScenario(saved));
      setNotice("Đã lưu bản nháp tình huống. Hãy xuất bản khi phản hồi vẫn hỗ trợ và không đổ lỗi cho học sinh.");
    } catch (saveError) {
      setError(errorCopy(saveError));
    }
  }

  async function handleConfirm() {
    if (confirmation === null) {
      return;
    }
    const confirmed = confirmation;
    setIsConfirming(true);
    try {
      if (confirmed.type === "archive-self-check") {
        await runAction(
          () => archiveAdminSelfCheck(confirmed.id),
          "Đã lưu trữ bài tự kiểm tra. Học sinh không còn thấy nội dung này, lịch sử đã hoàn thành vẫn được giữ.",
        );
      }
      if (confirmed.type === "delete-self-check") {
        await runAction(() => deleteDraftAdminSelfCheck(confirmed.id), "Đã xóa bản nháp tự kiểm tra chưa dùng.");
      }
      if (confirmed.type === "archive-scenario") {
        await runAction(
          () => archiveAdminScenario(confirmed.id),
          "Đã lưu trữ tình huống. Học sinh không còn thấy nội dung này, lịch sử đã hoàn thành vẫn được giữ.",
        );
      }
      if (confirmed.type === "delete-scenario") {
        await runAction(() => deleteDraftAdminScenario(confirmed.id), "Đã xóa bản nháp tình huống chưa dùng.");
      }
    } finally {
      setIsConfirming(false);
      setConfirmation(null);
    }
  }

  const dialogProps =
    confirmation?.type === "delete-self-check" || confirmation?.type === "delete-scenario"
      ? {
          message: "Xóa bản nháp chưa dùng này? Chỉ dùng thao tác này khi nội dung chưa từng được học sinh hoàn thành.",
          cancelLabel: KEEP_CONTENT_COPY,
          confirmLabel: CONFIRM_DELETE_DRAFT_CONTENT_COPY,
        }
      : {
          message: "Lưu trữ nội dung này? Học sinh sẽ không còn thấy nội dung này, nhưng lịch sử đã hoàn thành vẫn được giữ.",
          cancelLabel: KEEP_CONTENT_COPY,
          confirmLabel: CONFIRM_ARCHIVE_CONTENT_COPY,
        };

  return (
    <main className="mx-auto max-w-[1200px] space-y-6">
      <header className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText size={18} />
          </div>
          <h1 className="text-lg font-semibold text-on-background">Nội dung tự kiểm tra và tình huống</h1>
        </div>
        <p className="mt-3 text-sm text-on-background/70">
          Tạo, chỉnh sửa và xuất bản nội dung hỗ trợ học sinh. Ngôn ngữ hỗ trợ, không chẩn đoán.
        </p>
      </header>

      {notice ? <p role="status" className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-xs">{notice}</p> : null}
      {error ? <p role="alert" className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#1e2d40] px-4 py-3 text-xs">{error}</p> : null}
      {isLoading ? <p>Đang tải thông tin...</p> : null}

      {/* Tab navigation */}
      <nav className="flex gap-1 rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("self-check")}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === "self-check" ? "bg-primary text-on-primary" : "text-on-background/70 hover:bg-primary/5"}`}
        >
          Bài tự kiểm tra ({selfChecks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("scenario")}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === "scenario" ? "bg-primary text-on-primary" : "text-on-background/70 hover:bg-primary/5"}`}
        >
          Tình huống ({scenarios.length})
        </button>
      </nav>

      {/* Self-check tab */}
      {activeTab === "self-check" ? (
        <article className="space-y-5 rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Quản lý bài tự kiểm tra</h2>
            <button
              type="button"
              onClick={() => setSelfCheckDraft(cloneSelfCheck(emptySelfCheck))}
              className="inline-flex items-center gap-2 min-h-11 rounded-xl bg-primary px-4 font-semibold text-white"
            >
              <Plus size={16} />
              Tạo mới
            </button>
          </div>

          {/* List of existing self-checks */}
          {selfChecks.length === 0 && !isLoading ? (
            <EmptyState heading="Chưa có bài tự kiểm tra" body="Tạo bản nháp đầu tiên để chuẩn bị nội dung hỗ trợ học sinh." />
          ) : (
            <div className="space-y-2">
              {selfChecks.map((item) => (
                <div
                  key={item.id ?? item.title}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                    selfCheckDraft.id === item.id
                      ? "border-primary/50 bg-primary/5"
                      : "border-outline-variant/20 hover:bg-primary/5"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title || "Chưa đặt tên"}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-on-background/50">{item.questions?.length ?? 0} câu hỏi</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setSelfCheckDraft(cloneSelfCheck(item))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-primary/10"
                      title="Sửa"
                    >
                      <Pencil size={16} className="text-primary" />
                    </button>
                    {item.status === "published" ? (
                      <button
                        type="button"
                        onClick={() => item.id && setConfirmation({ type: "archive-self-check", id: item.id })}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30"
                        title="Lưu trữ"
                      >
                        <Archive size={16} className="text-amber-600" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => item.id && setConfirmation({ type: "delete-self-check", id: item.id })}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                        title="Xóa"
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Editor section */}
          <div className="rounded-2xl border border-outline-variant/20 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Pencil size={14} className="text-primary" />
              <h3 className="text-sm font-semibold">
                {selfCheckDraft.id ? `Đang sửa: ${selfCheckDraft.title || "Chưa đặt tên"}` : "Tạo bài tự kiểm tra mới"}
              </h3>
            </div>
            <Field
              label="Tên bài tự kiểm tra"
              value={selfCheckDraft.title}
              onChange={(value) => setSelfCheckDraft((current) => ({ ...current, title: value }))}
            />
            <TextAreaField
              label="Mô tả ngắn"
              value={selfCheckDraft.description ?? ""}
              onChange={(value) => setSelfCheckDraft((current) => ({ ...current, description: value }))}
            />
            <label className="space-y-1 text-sm font-medium">
              Trạng thái nội dung
              <select
                aria-label="Trạng thái nội dung"
                value={selfCheckDraft.status}
                onChange={(event) => setSelfCheckDraft((current) => ({ ...current, status: event.target.value as AdminContentStatus }))}
                className="min-h-11 w-full rounded-xl border border-outline-variant/30 px-3"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <details className="rounded-2xl border border-outline-variant/20" open>
              <summary className="cursor-pointer p-4 text-sm font-semibold select-none">
                📝 Câu hỏi và lựa chọn ({selfCheckDraft.questions.length} câu)
              </summary>
              <div className="space-y-4 border-t border-outline-variant/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-on-background/60">Thêm câu hỏi trước khi xuất bản</span>
                <button
                  type="button"
                  onClick={addSelfCheckQuestion}
                  className="min-h-11 rounded-xl border border-outline-variant/30 px-4 font-semibold"
                >
                  Thêm câu hỏi
                </button>
              </div>
              {selfCheckDraft.questions.length === 0 ? (
                <p className="text-sm">Chưa có câu hỏi. Thêm câu hỏi trước khi xuất bản.</p>
              ) : null}
              {selfCheckDraft.questions.map((question, questionIndex) => (
                <section key={question.id ?? `draft-question-${questionIndex}`} className="space-y-3 rounded-2xl bg-primary/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">Câu hỏi {questionIndex + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeSelfCheckQuestion(questionIndex)}
                      className="min-h-11 rounded-xl border border-amber-300 px-4"
                    >
                      Xóa câu hỏi
                    </button>
                  </div>
                  <TextAreaField
                    label={labelFor("Câu hỏi tự kiểm tra", questionIndex)}
                    value={question.text}
                    onChange={(value) => updateSelfCheckQuestion(questionIndex, "text", value)}
                  />
                  <Field
                    label={labelFor("Thứ tự câu hỏi", questionIndex)}
                    value={question.sort_order}
                    type="number"
                    onChange={(value) => updateSelfCheckQuestion(questionIndex, "sort_order", value)}
                  />
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold">Lựa chọn trả lời</p>
                      <button
                        type="button"
                        onClick={() => addSelfCheckChoice(questionIndex)}
                        className="min-h-11 rounded-xl border border-outline-variant/30 px-4"
                      >
                        Thêm lựa chọn
                      </button>
                    </div>
                    {question.choices.length === 0 ? (
                      <p className="text-sm">Câu hỏi này chưa có lựa chọn.</p>
                    ) : null}
                    {question.choices.map((choice, choiceIndex) => (
                      <div key={choice.id ?? `draft-choice-${questionIndex}-${choiceIndex}`} className="grid gap-3 rounded-2xl bg-white dark:bg-[#1a2940] p-4 md:grid-cols-2">
                        <Field
                          label={choiceLabel("Lựa chọn trả lời", questionIndex, choiceIndex)}
                          value={choice.text}
                          onChange={(value) => updateSelfCheckChoice(questionIndex, choiceIndex, "text", value)}
                        />
                        <Field
                          label={choiceLabel("Giá trị điểm", questionIndex, choiceIndex)}
                          value={choice.score_value}
                          type="number"
                          onChange={(value) => updateSelfCheckChoice(questionIndex, choiceIndex, "score_value", value)}
                        />
                        <Field
                          label={choiceLabel("Thứ tự lựa chọn", questionIndex, choiceIndex)}
                          value={choice.sort_order}
                          type="number"
                          onChange={(value) => updateSelfCheckChoice(questionIndex, choiceIndex, "sort_order", value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeSelfCheckChoice(questionIndex, choiceIndex)}
                          className="min-h-11 self-end rounded-2xl border border-amber-300 px-4"
                        >
                          Xóa lựa chọn
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
              </div>
            </details>
            <details className="rounded-2xl border border-outline-variant/20">
              <summary className="cursor-pointer p-4 text-sm font-semibold select-none">
                📊 Ngưỡng điểm ({selfCheckDraft.thresholds.length} ngưỡng)
              </summary>
              <div className="space-y-4 border-t border-outline-variant/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-on-background/60">Thêm ngưỡng trước khi xuất bản</span>
                <button
                  type="button"
                  onClick={addThreshold}
                  className="min-h-11 rounded-xl border border-outline-variant/30 px-4 font-semibold"
                >
                  Thêm ngưỡng điểm
                </button>
              </div>
              {selfCheckDraft.thresholds.length === 0 ? (
                <p className="text-sm">Chưa có ngưỡng điểm. Thêm ngưỡng điểm trước khi xuất bản.</p>
              ) : null}
              {selfCheckDraft.thresholds.map((threshold, thresholdIndex) => (
                <section key={threshold.id ?? `draft-threshold-${thresholdIndex}`} className="space-y-3 rounded-2xl bg-primary/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">Ngưỡng {thresholdIndex + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeThreshold(thresholdIndex)}
                      className="min-h-11 rounded-xl border border-amber-300 px-4"
                    >
                      Xóa ngưỡng điểm
                    </button>
                  </div>
                  <label className="space-y-1 text-sm font-medium">
                    {labelFor("Nhãn trạng thái", thresholdIndex)}
                    <select
                      aria-label={labelFor("Nhãn trạng thái", thresholdIndex)}
                      value={threshold.state_label}
                      onChange={(event) => updateThreshold(thresholdIndex, "state_label", event.target.value)}
                      className="min-h-11 w-full rounded-xl border border-outline-variant/30 px-3"
                    >
                      {riskLabels.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label={labelFor("Điểm tối thiểu", thresholdIndex)}
                    value={threshold.min_score}
                    type="number"
                    onChange={(value) => updateThreshold(thresholdIndex, "min_score", value)}
                  />
                  <Field
                    label={labelFor("Điểm tối đa", thresholdIndex)}
                    value={threshold.max_score}
                    type="number"
                    onChange={(value) => updateThreshold(thresholdIndex, "max_score", value)}
                  />
                  <TextAreaField
                    label={labelFor("Nhận xét", thresholdIndex)}
                    value={threshold.comment ?? ""}
                    onChange={(value) => updateThreshold(thresholdIndex, "comment", value)}
                  />
                  <TextAreaField
                    label={labelFor("Tóm tắt gợi ý", thresholdIndex)}
                    value={threshold.advice ?? ""}
                    onChange={(value) => updateThreshold(thresholdIndex, "advice", value)}
                  />
                  <TextAreaField
                    label={labelFor("Nội dung tích cực", thresholdIndex)}
                    value={threshold.positive_content ?? ""}
                    onChange={(value) => updateThreshold(thresholdIndex, "positive_content", value)}
                  />
                  <TextAreaField
                    label={labelFor("Hành động tiếp theo gợi ý", thresholdIndex)}
                    value={threshold.suggested_next_action ?? ""}
                    onChange={(value) => updateThreshold(thresholdIndex, "suggested_next_action", value)}
                  />
                </section>
              ))}
              </div>
            </details>
            <details className="rounded-2xl border border-outline-variant/20">
              <summary className="cursor-pointer p-4 text-sm font-semibold select-none">
                👁️ Xem trước
              </summary>
              <div className="border-t border-outline-variant/20 p-4">
          <div className="rounded-2xl bg-primary/5 p-4">
            <h3 className="text-sm font-semibold">{selfCheckDraft.title || "Bản xem trước bài tự kiểm tra"}</h3>
            <p className="mt-2 text-sm">{selfCheckDraft.description || "Nội dung hỗ trợ học sinh sẽ hiển thị tại đây."}</p>
            <p className="mt-2 text-xs">Trạng thái nội dung: {selfCheckDraft.status}</p>
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-semibold">Bản xem trước câu hỏi</h4>
              {selfCheckDraft.questions.length === 0 ? (
                <p className="text-sm">Chưa có câu hỏi để xem trước.</p>
              ) : (
                selfCheckDraft.questions
                  .slice()
                  .sort((left, right) => left.sort_order - right.sort_order)
                  .map((question, questionIndex) => (
                    <article key={question.id ?? `preview-question-${questionIndex}`} className="rounded-2xl bg-white dark:bg-[#1a2940] p-3">
                      <p className="font-semibold">
                        {questionIndex + 1}. {question.text || "Câu hỏi chưa nhập"}
                      </p>
                      <ul className="mt-2 space-y-1 text-xs">
                        {question.choices
                          .slice()
                          .sort((left, right) => left.sort_order - right.sort_order)
                          .map((choice, choiceIndex) => (
                            <li key={choice.id ?? `preview-choice-${questionIndex}-${choiceIndex}`}>
                              {choiceIndex + 1}. {choice.text || "Lựa chọn chưa nhập"} - {choice.score_value} điểm
                            </li>
                          ))}
                      </ul>
                    </article>
                  ))
              )}
            </div>
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">Bản xem trước ngưỡng điểm</h4>
              {selfCheckDraft.thresholds.length === 0 ? (
                <p className="text-sm">Chưa có ngưỡng điểm để xem trước.</p>
              ) : (
                selfCheckDraft.thresholds.map((threshold, thresholdIndex) => (
                  <p key={threshold.id ?? `preview-threshold-${thresholdIndex}`} className="text-xs">
                    {threshold.state_label}: {threshold.min_score}-{threshold.max_score} điểm
                  </p>
                ))
              )}
            </div>
          </div>
          </div>
          </details>
          <div className="flex flex-wrap gap-2">
           <button type="button" onClick={saveSelfCheckDraft} className="min-h-11 rounded-xl bg-primary px-4 font-semibold text-white">
            {selfCheckDraft.id ? "Lưu thay đổi" : "Lưu bản nháp"}
           </button>
          {selfCheckDraft.id ? (
            <button
              type="button"
              onClick={() =>
                selfCheckDraft.id &&
                runAction(
                  () => publishAdminSelfCheck(selfCheckDraft.id as string),
                  "Đã xuất bản bài tự kiểm tra cho học sinh.",
                )
              }
              className="min-h-11 rounded-xl bg-primary px-4 font-semibold text-white"
            >
              Xuất bản
            </button>
          ) : null}
          {selfCheckDraft.id ? (
            <button
              type="button"
              onClick={() => selfCheckDraft.id && setConfirmation({ type: "archive-self-check", id: selfCheckDraft.id })}
              className="min-h-11 rounded-xl border border-amber-300 px-4"
            >
              Lưu trữ
            </button>
          ) : null}
          {selfCheckDraft.id ? (
            <button
              type="button"
              onClick={() => selfCheckDraft.id && setConfirmation({ type: "delete-self-check", id: selfCheckDraft.id })}
              className="min-h-11 rounded-xl border border-destructive/50 text-destructive px-4"
            >
              Xóa
            </button>
          ) : null}
          </div>
          </div>
        </article>
      ) : null}

      {/* Scenario tab */}
      {activeTab === "scenario" ? (
        <article className="space-y-5 rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Quản lý tình huống</h2>
            <button
              type="button"
              onClick={() => setScenarioDraft(cloneScenario(emptyScenario))}
              className="inline-flex items-center gap-2 min-h-11 rounded-xl bg-primary px-4 font-semibold text-white"
            >
              <Plus size={16} />
              Tạo mới
            </button>
          </div>

          {/* List of existing scenarios */}
          {scenarios.length === 0 && !isLoading ? (
            <EmptyState heading="Chưa có tình huống" body="Tạo bản nháp tình huống để học sinh luyện cách phản hồi an toàn hơn." />
          ) : (
            <div className="space-y-2">
              {scenarios.map((item) => (
                <div
                  key={item.id ?? item.title}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                    scenarioDraft.id === item.id
                      ? "border-primary/50 bg-primary/5"
                      : "border-outline-variant/20 hover:bg-primary/5"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title || "Chưa đặt tên"}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-on-background/50">{item.skill_tag || "Chưa gắn kỹ năng"}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setScenarioDraft(cloneScenario(item))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-primary/10"
                      title="Sửa"
                    >
                      <Pencil size={16} className="text-primary" />
                    </button>
                    {item.status === "published" ? (
                      <button
                        type="button"
                        onClick={() => item.id && setConfirmation({ type: "archive-scenario", id: item.id })}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30"
                        title="Lưu trữ"
                      >
                        <Archive size={16} className="text-amber-600" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => item.id && setConfirmation({ type: "delete-scenario", id: item.id })}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                        title="Xóa"
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Editor section */}
          <div className="rounded-2xl border border-outline-variant/20 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Pencil size={14} className="text-primary" />
              <h3 className="text-sm font-semibold">
                {scenarioDraft.id ? `Đang sửa: ${scenarioDraft.title || "Chưa đặt tên"}` : "Tạo tình huống mới"}
              </h3>
            </div>
            <Field label="Tiêu đề tình huống" value={scenarioDraft.title} onChange={(value) => setScenarioDraft((current) => ({ ...current, title: value }))} />
            <TextAreaField label="Mô tả tình huống" value={scenarioDraft.situation} onChange={(value) => setScenarioDraft((current) => ({ ...current, situation: value }))} />
            <Field label="Kỹ năng liên quan" value={scenarioDraft.skill_tag} onChange={(value) => setScenarioDraft((current) => ({ ...current, skill_tag: value }))} />
            <label className="space-y-1 text-sm font-medium">
              Trạng thái nội dung
              <select
                aria-label="Trạng thái nội dung"
                value={scenarioDraft.status}
                onChange={(event) => setScenarioDraft((current) => ({ ...current, status: event.target.value as AdminContentStatus }))}
                className="min-h-11 w-full rounded-xl border border-outline-variant/30 px-3"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-4 rounded-2xl border border-outline-variant/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Lựa chọn tình huống</h3>
                <button
                  type="button"
                  onClick={addScenarioChoice}
                  className="min-h-11 rounded-xl border border-outline-variant/30 px-4 font-semibold"
                >
                  Thêm lựa chọn tình huống
                </button>
              </div>
              {scenarioDraft.choices.length === 0 ? (
                <p className="text-sm">Chưa có lựa chọn tình huống. Thêm ít nhất hai lựa chọn trước khi xuất bản.</p>
              ) : null}
              {scenarioDraft.choices.map((choice, choiceIndex) => (
                <section key={choice.id ?? `draft-scenario-choice-${choiceIndex}`} className="space-y-3 rounded-2xl bg-primary/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">Lựa chọn {choiceIndex + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeScenarioChoice(choiceIndex)}
                      className="min-h-11 rounded-xl border border-amber-300 px-4"
                    >
                      Xóa lựa chọn tình huống
                    </button>
                  </div>
                  <Field
                    label={labelFor("Lựa chọn phản hồi", choiceIndex)}
                    value={choice.text}
                    onChange={(value) => updateScenarioChoice(choiceIndex, "text", value)}
                  />
                  <label className="space-y-1 text-sm font-medium">
                    {labelFor("Tín hiệu constructive/risky", choiceIndex)}
                    <select
                      aria-label={labelFor("Tín hiệu constructive/risky", choiceIndex)}
                      value={choice.signal}
                      onChange={(event) => updateScenarioChoice(choiceIndex, "signal", event.target.value)}
                      className="min-h-11 w-full rounded-xl border border-outline-variant/30 px-3"
                    >
                      {signalOptions.map((signal) => (
                        <option key={signal} value={signal}>
                          {signal}
                        </option>
                      ))}
                    </select>
                  </label>
                  <TextAreaField
                    label={labelFor("Phản hồi cho lựa chọn", choiceIndex)}
                    value={choice.feedback}
                    onChange={(value) => updateScenarioChoice(choiceIndex, "feedback", value)}
                  />
                  <Field
                    label={labelFor("Thứ tự lựa chọn tình huống", choiceIndex)}
                    value={choice.sort_order}
                    type="number"
                    onChange={(value) => updateScenarioChoice(choiceIndex, "sort_order", value)}
                  />
                </section>
              ))}
            </div>
            <TextAreaField
              label="Cách phản hồi nên thử"
              value={scenarioDraft.recommended_response}
              onChange={(value) => setScenarioDraft((current) => ({ ...current, recommended_response: value }))}
            />
            <TextAreaField label="Điều em có thể rút ra" value={scenarioDraft.lesson} onChange={(value) => setScenarioDraft((current) => ({ ...current, lesson: value }))} />
          </div>
          <div className="rounded-2xl bg-primary/5 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{scenarioDraft.title || "Bản xem trước tình huống"}</h3>
              {scenarioDraft.is_demo ? <DemoBadge /> : null}
            </div>
            <p className="mt-2 text-sm">{scenarioDraft.situation || "Mô tả tình huống sẽ hiển thị tại đây."}</p>
            <p className="mt-2 text-xs">Kỹ năng: {scenarioDraft.skill_tag || "Chưa nhập"}</p>
            <p className="mt-2 text-xs">Trạng thái nội dung: {scenarioDraft.status}</p>
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-semibold">Bản xem trước lựa chọn</h4>
              {scenarioDraft.choices.length === 0 ? (
                <p className="text-sm">Chưa có lựa chọn để xem trước.</p>
              ) : (
                scenarioDraft.choices
                  .slice()
                  .sort((left, right) => left.sort_order - right.sort_order)
                  .map((choice, choiceIndex) => (
                    <article key={choice.id ?? `preview-scenario-choice-${choiceIndex}`} className="rounded-2xl bg-white dark:bg-[#1a2940] p-3">
                      <p className="font-semibold">
                        {choiceIndex + 1}. {choice.text || "Lựa chọn chưa nhập"} ({choice.signal})
                      </p>
                      <p className="mt-2 text-xs">{choice.feedback || "Phản hồi chưa nhập"}</p>
                    </article>
                  ))
              )}
            </div>
            <div className="mt-4 rounded-2xl bg-white dark:bg-[#1a2940] p-3">
              <h4 className="text-sm font-semibold">Bài học và phản hồi gợi ý</h4>
              <p className="mt-2 text-sm">{scenarioDraft.recommended_response || "Cách phản hồi nên thử sẽ hiển thị tại đây."}</p>
              <p className="mt-2 text-xs">{scenarioDraft.lesson || "Điều học sinh có thể rút ra sẽ hiển thị tại đây."}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={saveScenarioDraft} className="min-h-11 rounded-xl bg-primary px-4 font-semibold text-white">
              {scenarioDraft.id ? "Lưu thay đổi" : "Lưu bản nháp"}
            </button>
            {scenarioDraft.id ? (
              <button
                type="button"
                onClick={() =>
                  scenarioDraft.id &&
                  runAction(
                    () => publishAdminScenario(scenarioDraft.id as string),
                    "Đã xuất bản tình huống luyện tập cho học sinh.",
                  )
                }
                className="min-h-11 rounded-xl bg-primary px-4 font-semibold text-white"
              >
                Xuất bản
              </button>
            ) : null}
            {scenarioDraft.id ? (
              <button
                type="button"
                onClick={() => scenarioDraft.id && setConfirmation({ type: "archive-scenario", id: scenarioDraft.id })}
                className="min-h-11 rounded-xl border border-amber-300 px-4"
              >
                Lưu trữ
              </button>
            ) : null}
            {scenarioDraft.id ? (
              <button
                type="button"
                onClick={() => scenarioDraft.id && setConfirmation({ type: "delete-scenario", id: scenarioDraft.id })}
                className="min-h-11 rounded-xl border border-destructive/50 text-destructive px-4"
              >
                Xóa
              </button>
            ) : null}
          </div>
        </article>
      ) : null}

      <DestructiveConfirmDialog
        open={confirmation !== null}
        message={dialogProps.message}
        cancelLabel={dialogProps.cancelLabel}
        confirmLabel={dialogProps.confirmLabel}
        supportingText="Thao tác lifecycle chỉ thay đổi nội dung học sinh nhìn thấy; lịch sử đã hoàn thành vẫn được giữ đúng ranh giới riêng tư."
        isConfirming={isConfirming}
        onCancel={() => setConfirmation(null)}
        onConfirm={handleConfirm}
      />
    </main>
  );
}
