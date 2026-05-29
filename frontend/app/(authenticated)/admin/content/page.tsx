"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Trash2, Plus, Archive, ArrowLeft, ChevronRight, Search, Check, Copy } from "lucide-react";

import {
  CONFIRM_ARCHIVE_CONTENT_COPY,
  CONFIRM_DELETE_DRAFT_CONTENT_COPY,
  DestructiveConfirmDialog,
  KEEP_CONTENT_COPY,
} from "@/components/admin/destructive-confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast";
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

const riskLabels: AdminRiskStateLabel[] = ["On dinh", "Can chu y", "Nen tim ho tro", "Can ho tro som"];
const riskLabelDisplay: Record<AdminRiskStateLabel, string> = {
  "On dinh": "Ổn định",
  "Can chu y": "Cần chú ý",
  "Nen tim ho tro": "Nên tìm hỗ trợ",
  "Can ho tro som": "Cần hỗ trợ sớm",
};
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
        { text: "", score_value: 2, sort_order: 3, is_demo: false },
      ],
      is_demo: false,
    },
  ],
  thresholds: [
    {
      state_label: "On dinh",
      min_score: 0,
      max_score: 3,
      comment: "",
      advice: "",
      positive_content: "",
      suggested_next_action: "",
      is_demo: false,
    },
    {
      state_label: "Can chu y",
      min_score: 4,
      max_score: 6,
      comment: "",
      advice: "",
      positive_content: "",
      suggested_next_action: "",
      is_demo: false,
    },
    {
      state_label: "Nen tim ho tro",
      min_score: 7,
      max_score: 10,
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
    { text: "", signal: "risky", feedback: "", sort_order: 2, is_demo: false },
    { text: "", signal: "constructive", feedback: "", sort_order: 3, is_demo: false },
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
  required = false,
  placeholder,
  hint,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="space-y-1.5 text-xs font-medium text-on-background/70">
      <span>
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      <input
        aria-label={label}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background placeholder:text-on-background/30"
      />
      {hint ? <p className="text-[11px] text-on-background/50 font-normal">{hint}</p> : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  required = false,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="space-y-1.5 text-xs font-medium text-on-background/70">
      <span>
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      <textarea
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-24 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 py-2 text-sm text-on-background placeholder:text-on-background/30"
      />
      {hint ? <p className="text-[11px] text-on-background/50 font-normal">{hint}</p> : null}
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

type EditorStep = 1 | 2 | 3 | 4;

function StepIndicator({
  steps,
  currentStep,
  onStepChange,
}: {
  steps: readonly string[];
  currentStep: EditorStep;
  onStepChange: (step: EditorStep) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {steps.map((step, index) => {
          const stepNumber = (index + 1) as EditorStep;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div key={step} className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => onStepChange(stepNumber)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-primary/5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-primary text-white"
                        : "bg-on-background/10 text-on-background/60"
                  }`}
                >
                  {isCompleted ? <Check size={16} /> : stepNumber}
                </span>
                <span className={`min-w-0 text-sm ${isActive ? "font-semibold text-on-background" : "text-on-background/70"}`}>
                  {step}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <div className={`hidden h-px flex-1 sm:block ${isCompleted ? "bg-green-500/50" : "bg-outline-variant/40"}`} />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="h-2 rounded-full bg-on-background/10">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
      </div>
    </div>
  );
}

function ChecklistItem({ passed, label, fixHint, onFix }: { passed: boolean; label: string; fixHint?: string; onFix?: () => void }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${passed ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
          passed
            ? "bg-green-500 text-white"
            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
        }`}
      >
        {passed ? "✓" : "✕"}
      </span>
      <span className="flex-1">{label}</span>
      {!passed && onFix ? (
        <button type="button" onClick={onFix} className="shrink-0 rounded-lg bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30">
          {fixHint ?? "Đi sửa →"}
        </button>
      ) : null}
    </li>
  );
}

function nextEditorStep(step: EditorStep): EditorStep {
  return (step === 4 ? 4 : step + 1) as EditorStep;
}

function previousEditorStep(step: EditorStep): EditorStep {
  return (step === 1 ? 1 : step - 1) as EditorStep;
}

export default function AdminContentPage() {
  const { success: toastSuccess } = useToast();
  const [selfChecks, setSelfChecks] = useState<AdminSelfCheckContent[]>([]);
  const [scenarios, setScenarios] = useState<AdminScenarioContent[]>([]);
  const [selfCheckDraft, setSelfCheckDraft] = useState<AdminSelfCheckContent>(cloneSelfCheck(emptySelfCheck));
  const [scenarioDraft, setScenarioDraft] = useState<AdminScenarioContent>(cloneScenario(emptyScenario));
  const [activeTab, setActiveTab] = useState<"self-check" | "scenario">("self-check");
  const [isEditing, setIsEditing] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selfCheckStep, setSelfCheckStep] = useState<EditorStep>(1);
  const [scenarioStep, setScenarioStep] = useState<EditorStep>(1);

  const filteredSelfChecks = useMemo(() => {
    if (!search.trim()) return selfChecks;
    const q = search.toLowerCase();
    return selfChecks.filter((item) => item.title.toLowerCase().includes(q) || item.status.includes(q));
  }, [selfChecks, search]);

  const filteredScenarios = useMemo(() => {
    if (!search.trim()) return scenarios;
    const q = search.toLowerCase();
    return scenarios.filter((item) => item.title.toLowerCase().includes(q) || item.skill_tag.toLowerCase().includes(q) || item.status.includes(q));
  }, [scenarios, search]);

  const selfCheckSteps = [
    "Bước 1: Thông tin cơ bản",
    "Bước 2: Câu hỏi",
    "Bước 3: Ngưỡng điểm",
    "Bước 4: Xem lại & Xuất bản",
  ] as const;
  const scenarioSteps = [
    "Bước 1: Thông tin cơ bản",
    "Bước 2: Lựa chọn phản hồi",
    "Bước 3: Bài học",
    "Bước 4: Xem lại & Xuất bản",
  ] as const;

  const selfCheckBasicCount = [selfCheckDraft.title.trim(), selfCheckDraft.description?.trim() ?? ""].filter(Boolean).length;
  const filledSelfCheckQuestions = selfCheckDraft.questions.filter((question) => question.text.trim().length > 0).length;
  const selfCheckQuestionsReady = selfCheckDraft.questions.filter(
    (question) => question.text.trim().length > 0 && question.choices.filter((choice) => choice.text.trim().length > 0).length >= 2,
  ).length;
  const selfCheckReviewItems = [
    { label: "Tên bài đã được nhập", passed: selfCheckDraft.title.trim().length > 0, step: 1 as EditorStep, fixHint: "Bước 1 →" },
    { label: "Có ít nhất 1 câu hỏi", passed: selfCheckDraft.questions.some((question) => question.text.trim().length > 0), step: 2 as EditorStep, fixHint: "Bước 2 →" },
    {
      label: "Mỗi câu hỏi có ít nhất 2 lựa chọn",
      passed:
        selfCheckDraft.questions.length > 0 &&
        selfCheckDraft.questions.every(
          (question) => question.text.trim().length > 0 && question.choices.filter((choice) => choice.text.trim().length > 0).length >= 2,
        ),
      step: 2 as EditorStep,
      fixHint: "Bước 2 →",
    },
    { label: "Có ít nhất 1 ngưỡng điểm", passed: selfCheckDraft.thresholds.length > 0, step: 3 as EditorStep, fixHint: "Bước 3 →" },
  ];
  const canPublishSelfCheck =
    Boolean(selfCheckDraft.id) && selfCheckDraft.status === "draft" && selfCheckReviewItems.every((item) => item.passed);

  const scenarioBasicCount = [scenarioDraft.title.trim(), scenarioDraft.situation.trim(), scenarioDraft.skill_tag.trim()].filter(Boolean).length;
  const filledScenarioChoices = scenarioDraft.choices.filter((choice) => choice.text.trim().length > 0).length;
  const filledScenarioLessons = [scenarioDraft.recommended_response.trim(), scenarioDraft.lesson.trim()].filter(Boolean).length;
  const scenarioReviewItems = [
    { label: "Tên bài đã được nhập", passed: scenarioDraft.title.trim().length > 0, step: 1 as EditorStep, fixHint: "Bước 1 →" },
    { label: "Có ít nhất 2 lựa chọn", passed: scenarioDraft.choices.filter((choice) => choice.text.trim().length > 0).length >= 2, step: 2 as EditorStep, fixHint: "Bước 2 →" },
    { label: "Đã nhập bài học", passed: scenarioDraft.lesson.trim().length > 0, step: 3 as EditorStep, fixHint: "Bước 3 →" },
  ];
  const canPublishScenario =
    Boolean(scenarioDraft.id) && scenarioDraft.status === "draft" && scenarioReviewItems.every((item) => item.passed);

  async function refreshContent() {
    const [loadedSelfChecks, loadedScenarios] = await Promise.all([listAdminSelfChecks(), listAdminScenarios()]);
    setSelfChecks(loadedSelfChecks);
    setScenarios(loadedScenarios);
  }

  useEffect(() => {
    refreshContent().finally(() => setIsLoading(false));
  }, []);

  function openSelfCheckEditor(item?: AdminSelfCheckContent) {
    setSelfCheckDraft(cloneSelfCheck(item ?? emptySelfCheck));
    setSelfCheckStep(1);
    setIsEditing(true);
    setError("");
  }

  function duplicateSelfCheck(item: AdminSelfCheckContent) {
    const clone = cloneSelfCheck(item);
    delete (clone as Record<string, unknown>).id;
    clone.title = `${clone.title} (bản sao)`;
    clone.status = "draft";
    setSelfCheckDraft(clone);
    setSelfCheckStep(1);
    setIsEditing(true);
    setError("");
  }

  function openScenarioEditor(item?: AdminScenarioContent) {
    setScenarioDraft(cloneScenario(item ?? emptyScenario));
    setScenarioStep(1);
    setIsEditing(true);
    setError("");
  }

  function duplicateScenario(item: AdminScenarioContent) {
    const clone = cloneScenario(item);
    delete (clone as Record<string, unknown>).id;
    clone.title = `${clone.title} (bản sao)`;
    clone.status = "draft";
    setScenarioDraft(clone);
    setScenarioStep(1);
    setIsEditing(true);
    setError("");
  }

  function closeEditor() {
    setIsEditing(false);
    setSelfCheckStep(1);
    setScenarioStep(1);
    setError("");
  }

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
      await action();
      await refreshContent();
      toastSuccess(successMessage);
    } catch (actionError) {
      setError(errorCopy(actionError));
    }
  }

  async function saveSelfCheckDraft() {
    try {
      setError("");
      const saved = selfCheckDraft.id
        ? await updateAdminSelfCheck(selfCheckDraft.id, selfCheckDraft)
        : await createAdminSelfCheck(selfCheckDraft);
      const loadedSelfChecks = await listAdminSelfChecks();
      setSelfChecks(loadedSelfChecks);
      setSelfCheckDraft(cloneSelfCheck(saved));
      toastSuccess("Đã lưu thành công!");
    } catch (saveError) {
      setError(errorCopy(saveError));
    }
  }

  async function saveScenarioDraft() {
    try {
      setError("");
      const saved = scenarioDraft.id
        ? await updateAdminScenario(scenarioDraft.id, scenarioDraft)
        : await createAdminScenario(scenarioDraft);
      const loadedScenarios = await listAdminScenarios();
      setScenarios(loadedScenarios);
      setScenarioDraft(cloneScenario(saved));
      toastSuccess("Đã lưu thành công!");
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
          "Đã lưu trữ thành công.",
        );
      }
      if (confirmed.type === "delete-self-check") {
        await runAction(() => deleteDraftAdminSelfCheck(confirmed.id), "Đã xóa bản nháp.");
      }
      if (confirmed.type === "archive-scenario") {
        await runAction(
          () => archiveAdminScenario(confirmed.id),
          "Đã lưu trữ thành công.",
        );
      }
      if (confirmed.type === "delete-scenario") {
        await runAction(() => deleteDraftAdminScenario(confirmed.id), "Đã xóa bản nháp.");
      }
      setIsEditing(false);
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
    <main className="mx-auto max-w-[1200px] space-y-5 pb-20 md:pb-0">
      {/* Header */}
      <header className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-on-background">Quản lý nội dung</h1>
            <p className="text-xs text-on-background/60">Soạn nội dung test tâm lý và tình huống cho học sinh</p>
          </div>
        </div>
      </header>

      {/* Notices */}
      {error ? <p role="alert" className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-xs text-red-800 dark:text-red-300">{error}</p> : null}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-outline-variant/20 bg-white dark:bg-[#1a2940] p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-on-background/10" />
                  <div className="h-3 w-24 rounded bg-on-background/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* === LIST VIEW === */}
      {!isEditing ? (
        <>
          {/* Tab navigation */}
          <nav className="flex flex-col gap-1 rounded-2xl border border-outline-variant/30 bg-white p-1.5 dark:bg-[#1a2940] sm:flex-row">
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

          {/* Create button */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-background/40" />
              <input
                type="text"
                placeholder="Tìm theo tên, kỹ năng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] pl-9 pr-3 text-sm text-on-background placeholder:text-on-background/40"
              />
            </div>
            <button
              type="button"
              onClick={() => activeTab === "self-check" ? openSelfCheckEditor() : openScenarioEditor()}
              className="btn-press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 sm:w-auto"
            >
              <Plus size={16} />
              {activeTab === "self-check" ? "Tạo mới" : "Tạo mới"}
            </button>
          </div>

          {/* Self-check list */}
          {activeTab === "self-check" ? (
            <div className="space-y-2">
              {filteredSelfChecks.length === 0 && !isLoading ? (
                <EmptyState heading="Chưa có bài tự kiểm tra" body={search ? "Không tìm thấy kết quả." : "Nhấn nút tạo mới để bắt đầu."} />
              ) : (
                filteredSelfChecks.map((item) => (
                  <button
                    key={item.id ?? item.title}
                    type="button"
                    onClick={() => openSelfCheckEditor(item)}
                    className="card-lift flex w-full items-start gap-3 rounded-xl border border-outline-variant/20 bg-white p-4 text-left transition-all hover:border-primary/30 dark:bg-[#1a2940]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-on-background">{item.title || "Chưa đặt tên"}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-on-background/50">{item.questions?.length ?? 0} câu hỏi · {item.thresholds?.length ?? 0} ngưỡng</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); duplicateSelfCheck(item); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); duplicateSelfCheck(item); } }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-primary/10"
                        title="Nhân bản"
                      >
                        <Copy size={15} className="text-primary/70" />
                      </span>
                      {item.status === "published" ? (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); item.id && setConfirmation({ type: "archive-self-check", id: item.id }); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); item.id && setConfirmation({ type: "archive-self-check", id: item.id }); } }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30"
                          title="Lưu trữ"
                        >
                          <Archive size={15} className="text-amber-600" />
                        </span>
                      ) : item.status === "draft" ? (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); item.id && setConfirmation({ type: "delete-self-check", id: item.id }); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); item.id && setConfirmation({ type: "delete-self-check", id: item.id }); } }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                          title="Xóa"
                        >
                          <Trash2 size={15} className="text-destructive" />
                        </span>
                      ) : null}
                      <ChevronRight size={16} className="text-on-background/30" />
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : null}

          {/* Scenario list */}
          {activeTab === "scenario" ? (
            <div className="space-y-2">
              {filteredScenarios.length === 0 && !isLoading ? (
                <EmptyState heading="Chưa có tình huống" body={search ? "Không tìm thấy kết quả." : "Nhấn nút tạo mới để bắt đầu."} />
              ) : (
                filteredScenarios.map((item) => (
                  <button
                    key={item.id ?? item.title}
                    type="button"
                    onClick={() => openScenarioEditor(item)}
                    className="card-lift flex w-full items-start gap-3 rounded-xl border border-outline-variant/20 bg-white p-4 text-left transition-all hover:border-primary/30 dark:bg-[#1a2940]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-on-background">{item.title || "Chưa đặt tên"}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-on-background/50">{item.skill_tag || "Chưa gắn kỹ năng"} · {item.choices?.length ?? 0} lựa chọn</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); duplicateScenario(item); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); duplicateScenario(item); } }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-primary/10"
                        title="Nhân bản"
                      >
                        <Copy size={15} className="text-primary/70" />
                      </span>
                      {item.status === "published" ? (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); item.id && setConfirmation({ type: "archive-scenario", id: item.id }); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); item.id && setConfirmation({ type: "archive-scenario", id: item.id }); } }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30"
                          title="Lưu trữ"
                        >
                          <Archive size={15} className="text-amber-600" />
                        </span>
                      ) : item.status === "draft" ? (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); item.id && setConfirmation({ type: "delete-scenario", id: item.id }); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); item.id && setConfirmation({ type: "delete-scenario", id: item.id }); } }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                          title="Xóa"
                        >
                          <Trash2 size={15} className="text-destructive" />
                        </span>
                      ) : null}
                      <ChevronRight size={16} className="text-on-background/30" />
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {/* === EDITOR VIEW (Self-check) === */}
      {isEditing && activeTab === "self-check" ? (
        <div className="space-y-4">
          <button type="button" onClick={closeEditor} className="inline-flex items-center gap-1.5 text-sm text-on-background/70 hover:text-primary transition-colors">
            <ArrowLeft size={16} />
            Quay lại danh sách
          </button>

          <article className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5 space-y-5">
            <div className="space-y-4 border-b border-outline-variant/20 pb-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-on-background">
                    {selfCheckDraft.id ? "Chỉnh sửa bài tự kiểm tra" : "Tạo bài tự kiểm tra mới"}
                  </h2>
                  <p className="text-sm text-on-background/60">Đi từng bước để soạn câu hỏi, ngưỡng điểm và kiểm tra trước khi xuất bản.</p>
                </div>
                <div className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-on-background/70">Đang ở bước {selfCheckStep}/4</div>
              </div>
              <StepIndicator steps={selfCheckSteps} currentStep={selfCheckStep} onStepChange={setSelfCheckStep} />
            </div>

            {selfCheckStep === 1 ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Bước 1: Thông tin cơ bản</p>
                    <h3 className="text-lg font-semibold text-on-background">Đặt tên và mô tả bài test</h3>
                    <p className="text-sm text-on-background/60">Các trường có dấu <span className="text-red-500">*</span> nên được hoàn thiện trước khi xuất bản.</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-on-background/70">{selfCheckBasicCount}/2 trường đã nhập</div>
                </div>
                <Field label="Tên bài" required value={selfCheckDraft.title} onChange={(value) => setSelfCheckDraft((current) => ({ ...current, title: value }))} placeholder="VD: Em đang cảm thấy thế nào?" hint="Tên ngắn gọn, dễ hiểu cho học sinh THCS/THPT" />
                <TextAreaField label="Mô tả ngắn" required value={selfCheckDraft.description ?? ""} onChange={(value) => setSelfCheckDraft((current) => ({ ...current, description: value }))} placeholder="VD: Bài kiểm tra giúp em nhận biết cảm xúc hiện tại và tìm cách hỗ trợ phù hợp." hint="1-2 câu giải thích mục đích bài test — sẽ hiển thị trước khi học sinh bắt đầu" />
              </section>
            ) : null}

            {selfCheckStep === 2 ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Bước 2: Câu hỏi</p>
                    <h3 className="text-lg font-semibold text-on-background">Soạn câu hỏi và lựa chọn trả lời</h3>
                    <p className="text-sm text-on-background/60">Mỗi câu hỏi nên có ít nhất 2 lựa chọn để học sinh dễ trả lời.</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-on-background/70">{filledSelfCheckQuestions}/{selfCheckDraft.questions.length} câu hỏi đã nhập</div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-4">
                  <div>
                    <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Tiến độ câu hỏi</p>
                    <p className="mt-1 text-sm text-on-background/70">{selfCheckQuestionsReady}/{selfCheckDraft.questions.length} câu hỏi đã đủ 2 lựa chọn</p>
                  </div>
                  <button type="button" onClick={addSelfCheckQuestion} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                    <Plus size={16} className="inline-flex" /> Thêm câu hỏi
                  </button>
                </div>

                {selfCheckDraft.questions.length === 0 ? <p className="rounded-xl bg-primary/5 p-3 text-xs text-on-background/60">Thêm ít nhất 1 câu hỏi.</p> : null}
                {selfCheckDraft.questions.map((question, qi) => (
                  <div key={question.id ?? `q-${qi}`} className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Câu hỏi {qi + 1}</p>
                        <p className="mt-1 text-sm text-on-background/70">{question.choices.filter((choice) => choice.text.trim().length > 0).length}/{question.choices.length} lựa chọn đã nhập</p>
                      </div>
                      <button type="button" onClick={() => removeSelfCheckQuestion(qi)} className="rounded-xl border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-destructive hover:bg-red-50 dark:hover:bg-red-900/20">
                        Xóa
                      </button>
                    </div>
                    <Field label="Nội dung câu hỏi" required value={question.text} onChange={(value) => updateSelfCheckQuestion(qi, "text", value)} placeholder="VD: Trong tuần qua, em có thường cảm thấy lo lắng không?" hint="Viết câu hỏi dễ hiểu, không phán xét — giúp em tự nhận biết cảm xúc" />
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Lựa chọn trả lời</p>
                        <button type="button" onClick={() => addSelfCheckChoice(qi)} className="rounded-xl border border-outline-variant/30 px-4 py-2 text-sm text-on-background/70 hover:bg-primary/5">
                          + Thêm lựa chọn
                        </button>
                      </div>
                      {question.choices.map((choice, ci) => (
                        <div key={choice.id ?? `c-${qi}-${ci}`} className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-3">
                              <label className="space-y-1.5 text-xs font-medium text-on-background/70">
                                <span>
                                  Lựa chọn {ci + 1}
                                  <span className="ml-0.5 text-red-500">*</span>
                                </span>
                                <input aria-label={`Lựa chọn ${ci + 1}`} type="text" value={choice.text} onChange={(event) => updateSelfCheckChoice(qi, ci, "text", event.target.value)} placeholder={ci === 0 ? "VD: Hầu như không bao giờ" : ci === 1 ? "VD: Thỉnh thoảng" : "VD: Rất thường xuyên"} className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background placeholder:text-on-background/30" />
                              </label>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr] sm:items-end">
                                <label className="space-y-1.5 text-xs font-medium text-on-background/70">
                                  <span>
                                    Điểm
                                    <span className="ml-0.5 text-red-500">*</span>
                                  </span>
                                  <input aria-label="Điểm" type="number" value={choice.score_value} onChange={(event) => updateSelfCheckChoice(qi, ci, "score_value", event.target.value)} className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background" />
                                </label>
                                <p className="pb-2 text-xs text-on-background/50">Điểm cao hơn = mức độ lo ngại cao hơn (VD: 0 = ổn, 1 = nhẹ, 2 = cần hỗ trợ)</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => removeSelfCheckChoice(qi, ci)} className="rounded-xl p-2 text-on-background/40 hover:bg-red-50 hover:text-destructive dark:hover:bg-red-900/20">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            {selfCheckStep === 3 ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Bước 3: Ngưỡng điểm</p>
                    <h3 className="text-lg font-semibold text-on-background">Thiết lập kết quả theo tổng điểm</h3>
                    <p className="text-sm text-on-background/60">Mỗi ngưỡng xác định kết quả dựa trên tổng điểm.</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-on-background/70">{selfCheckDraft.thresholds.length} ngưỡng đã cấu hình</div>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={addThreshold} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                    <Plus size={16} className="inline-flex" /> Thêm ngưỡng
                  </button>
                </div>

                {selfCheckDraft.thresholds.map((threshold, ti) => (
                  <div key={threshold.id ?? `th-${ti}`} className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Ngưỡng {ti + 1}</p>
                        <p className="mt-1 text-sm text-on-background/70">Thiết lập khoảng điểm và nội dung phản hồi cho kết quả này.</p>
                      </div>
                      <button type="button" onClick={() => removeThreshold(ti)} className="rounded-xl border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-destructive hover:bg-red-50 dark:hover:bg-red-900/20">
                        Xóa
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <label className="space-y-1.5 text-xs font-medium text-on-background/70">
                        <span>
                          Mức
                          <span className="ml-0.5 text-red-500">*</span>
                        </span>
                        <select aria-label="Mức" value={threshold.state_label} onChange={(event) => updateThreshold(ti, "state_label", event.target.value)} className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background">
                          {riskLabels.map((label) => <option key={label} value={label}>{riskLabelDisplay[label]}</option>)}
                        </select>
                      </label>
                      <Field label="Min" required value={threshold.min_score} type="number" onChange={(value) => updateThreshold(ti, "min_score", value)} />
                      <Field label="Max" required value={threshold.max_score} type="number" onChange={(value) => updateThreshold(ti, "max_score", value)} />
                    </div>
                    <TextAreaField label="Nhận xét" value={threshold.comment ?? ""} onChange={(value) => updateThreshold(ti, "comment", value)} placeholder="VD: Em đang ở trạng thái tâm lý khá ổn định." hint="Một câu mô tả trạng thái — sẽ hiển thị cho học sinh sau khi làm bài" />
                    <TextAreaField label="Gợi ý" value={threshold.advice ?? ""} onChange={(value) => updateThreshold(ti, "advice", value)} placeholder="VD: Hãy tiếp tục duy trì thói quen tốt và chia sẻ với người em tin tưởng." hint="Lời khuyên ngắn gọn, hỗ trợ — không phán xét, không chẩn đoán" />
                    <TextAreaField label="Nội dung tích cực" value={threshold.positive_content ?? ""} onChange={(value) => updateThreshold(ti, "positive_content", value)} placeholder="VD: Em biết cách nhận ra cảm xúc của mình — đó là một điểm mạnh!" hint="Một câu động viên — giúp học sinh cảm thấy được ghi nhận" />
                    <TextAreaField label="Hành động tiếp theo" value={threshold.suggested_next_action ?? ""} onChange={(value) => updateThreshold(ti, "suggested_next_action", value)} placeholder="VD: Thử làm bài kiểm tra lại sau 1 tuần, hoặc nói chuyện với giáo viên nếu em cần." hint="Gợi ý bước tiếp theo cụ thể cho học sinh" />
                  </div>
                ))}
              </section>
            ) : null}

            {selfCheckStep === 4 ? (
              <section className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Bước 4: Xem lại & Xuất bản</p>
                  <h3 className="text-lg font-semibold text-on-background">Kiểm tra nhanh trước khi xuất bản</h3>
                  <p className="text-sm text-on-background/60">Hệ thống sẽ chỉ cho phép xuất bản khi tất cả mục dưới đây đều đạt.</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                  <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
                    <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Tóm tắt nội dung</p>
                    <dl className="mt-4 space-y-3 text-sm text-on-background/80">
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-on-background/60">Tên bài</dt>
                        <dd className="text-right font-medium">{selfCheckDraft.title.trim() || "Chưa nhập"}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-on-background/60">Mô tả</dt>
                        <dd className="max-w-[70%] text-right">{selfCheckDraft.description?.trim() || "Chưa nhập"}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-on-background/60">Trạng thái</dt>
                        <dd className="text-right"><StatusBadge status={selfCheckDraft.status} /></dd>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-on-background/60">Câu hỏi</dt>
                        <dd className="text-right font-medium">{filledSelfCheckQuestions}/{selfCheckDraft.questions.length} đã nhập</dd>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-on-background/60">Ngưỡng điểm</dt>
                        <dd className="text-right font-medium">{selfCheckDraft.thresholds.length} ngưỡng</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
                    <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Checklist xuất bản</p>
                    <ul className="mt-4 space-y-3">
                      {selfCheckReviewItems.map((item) => <ChecklistItem key={item.label} passed={item.passed} label={item.label} fixHint={item.fixHint} onFix={() => setSelfCheckStep(item.step)} />)}
                    </ul>
                    {!selfCheckDraft.id ? (
                      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                        Lưu bản nháp trước khi xuất bản.
                      </p>
                    ) : !selfCheckReviewItems.every((item) => item.passed) ? (
                      <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        Chưa thể xuất bản — hãy bấm nút &quot;Đi sửa&quot; bên cạnh mục chưa đạt (✕) để quay lại bước cần hoàn thiện.
                      </p>
                    ) : null}
                    {selfCheckDraft.status !== "draft" ? (
                      <p className="mt-4 rounded-xl border border-outline-variant/30 bg-primary/5 px-3 py-2 text-xs text-on-background/70">
                        Chỉ có thể xuất bản khi nội dung đang ở trạng thái nháp.
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-outline-variant/20 pt-5 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                <button type="button" onClick={() => setSelfCheckStep(previousEditorStep(selfCheckStep))} disabled={selfCheckStep === 1} className="btn-press min-h-11 w-full rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm font-medium text-on-background/70 transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">
                  Quay lại
                </button>
                {selfCheckStep < 4 ? (
                  <button type="button" onClick={async () => { await saveSelfCheckDraft(); setSelfCheckStep(nextEditorStep(selfCheckStep)); }} className="btn-press min-h-11 w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 sm:w-auto">
                    Lưu & Tiếp theo
                  </button>
                ) : null}
              </div>
              <div className="hidden flex-1 sm:block" />
              <button type="button" onClick={saveSelfCheckDraft} className="btn-press min-h-11 w-full rounded-xl border border-primary/30 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5 sm:w-auto">
                {selfCheckDraft.id ? "Lưu thay đổi" : "Lưu bản nháp"}
              </button>
              {selfCheckStep === 4 && selfCheckDraft.id && selfCheckDraft.status === "draft" ? (
                <button type="button" disabled={!canPublishSelfCheck} onClick={() => runAction(() => publishAdminSelfCheck(selfCheckDraft.id as string), "Đã xuất bản!")} className="btn-press min-h-11 w-full rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                  Xuất bản
                </button>
              ) : null}
              {selfCheckDraft.id && selfCheckDraft.status === "published" ? (
                <button type="button" onClick={() => setConfirmation({ type: "archive-self-check", id: selfCheckDraft.id as string })} className="btn-press min-h-11 w-full rounded-xl border border-amber-300 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300 sm:w-auto">
                  Lưu trữ
                </button>
              ) : null}
              {selfCheckDraft.id && selfCheckDraft.status === "draft" ? (
                <button type="button" onClick={() => setConfirmation({ type: "delete-self-check", id: selfCheckDraft.id as string })} className="btn-press min-h-11 w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm text-destructive dark:border-red-800 sm:w-auto">
                  Xóa
                </button>
              ) : null}
            </div>
          </article>
        </div>
      ) : null}

      {/* === EDITOR VIEW (Scenario) === */}
      {isEditing && activeTab === "scenario" ? (
        <div className="space-y-4">
          <button type="button" onClick={closeEditor} className="inline-flex items-center gap-1.5 text-sm text-on-background/70 hover:text-primary transition-colors">
            <ArrowLeft size={16} />
            Quay lại danh sách
          </button>

          <article className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5 space-y-5">
            <div className="space-y-4 border-b border-outline-variant/20 pb-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-on-background">
                    {scenarioDraft.id ? "Chỉnh sửa tình huống" : "Tạo tình huống mới"}
                  </h2>
                  <p className="text-sm text-on-background/60">Đi từng bước để soạn tình huống, lựa chọn phản hồi và kiểm tra trước khi xuất bản.</p>
                </div>
                <div className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-on-background/70">Đang ở bước {scenarioStep}/4</div>
              </div>
              <StepIndicator steps={scenarioSteps} currentStep={scenarioStep} onStepChange={setScenarioStep} />
            </div>

            {scenarioStep === 1 ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Bước 1: Thông tin cơ bản</p>
                    <h3 className="text-lg font-semibold text-on-background">Giới thiệu tình huống</h3>
                    <p className="text-sm text-on-background/60">Các trường có dấu <span className="text-red-500">*</span> sẽ giúp giáo viên dễ kiểm tra trước khi xuất bản.</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-on-background/70">{scenarioBasicCount}/3 trường đã nhập</div>
                </div>
                <Field label="Tiêu đề" required value={scenarioDraft.title} onChange={(value) => setScenarioDraft((current) => ({ ...current, title: value }))} placeholder="VD: Bạn rủ em trốn học đi chơi" hint="Mô tả ngắn tình huống — sẽ hiển thị trong danh sách cho học sinh chọn" />
                <TextAreaField label="Mô tả tình huống" required value={scenarioDraft.situation} onChange={(value) => setScenarioDraft((current) => ({ ...current, situation: value }))} placeholder="VD: Đang giờ ra chơi, một nhóm bạn rủ em bỏ tiết chiều đi chơi game. Các bạn nói 'không sao đâu, cô không biết đâu'. Em đang phân vân..." hint="Viết bối cảnh rõ ràng, có chi tiết để học sinh hình dung — nên viết ở ngôi thứ 2 ('em')" />
                <Field label="Kỹ năng liên quan" required value={scenarioDraft.skill_tag} onChange={(value) => setScenarioDraft((current) => ({ ...current, skill_tag: value }))} placeholder="VD: Từ chối áp lực nhóm" hint="Kỹ năng sống mà bài tình huống rèn luyện" />
              </section>
            ) : null}

            {scenarioStep === 2 ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Bước 2: Lựa chọn phản hồi</p>
                    <h3 className="text-lg font-semibold text-on-background">Thêm các phản hồi học sinh có thể chọn</h3>
                    <p className="text-sm text-on-background/60">Nên có ít nhất 2 lựa chọn để học sinh so sánh và nhận biết tín hiệu an toàn.</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-on-background/70">{filledScenarioChoices}/{scenarioDraft.choices.length} lựa chọn đã nhập</div>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={addScenarioChoice} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                    <Plus size={16} className="inline-flex" /> Thêm lựa chọn
                  </button>
                </div>

                {scenarioDraft.choices.length === 0 ? <p className="rounded-xl bg-primary/5 p-3 text-xs text-on-background/60">Thêm ít nhất 2 lựa chọn.</p> : null}
                {scenarioDraft.choices.map((choice, ci) => (
                  <div key={choice.id ?? `sc-${ci}`} className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-on-background">Lựa chọn {ci + 1}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${choice.signal === "constructive" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
                          {choice.signal === "constructive" ? "Tích cực" : "Rủi ro"}
                        </span>
                      </div>
                      <button type="button" onClick={() => removeScenarioChoice(ci)} className="rounded-xl border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-destructive hover:bg-red-50 dark:hover:bg-red-900/20">
                        Xóa
                      </button>
                    </div>
                    <Field label="Nội dung" required value={choice.text} onChange={(value) => updateScenarioChoice(ci, "text", value)} placeholder={choice.signal === "constructive" ? "VD: Em từ chối nhẹ nhàng và quay lại lớp." : "VD: Em đi theo dù không thoải mái."} hint="Viết cách phản hồi mà học sinh có thể chọn trong tình huống này" />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="space-y-1.5 text-xs font-medium text-on-background/70">
                        <span>
                          Tín hiệu
                          <span className="ml-0.5 text-red-500">*</span>
                        </span>
                        <select aria-label="Tín hiệu" value={choice.signal} onChange={(event) => updateScenarioChoice(ci, "signal", event.target.value)} className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background">
                          {signalOptions.map((signal) => <option key={signal} value={signal}>{signal === "constructive" ? "Tích cực" : "Rủi ro"}</option>)}
                        </select>
                      </label>
                      <Field label="Thứ tự" value={choice.sort_order} type="number" onChange={(value) => updateScenarioChoice(ci, "sort_order", value)} />
                    </div>
                    <TextAreaField label="Phản hồi" required value={choice.feedback} onChange={(value) => updateScenarioChoice(ci, "feedback", value)} placeholder={choice.signal === "constructive" ? "VD: Cách phản hồi này giúp em giữ vững lập trường — tuyệt vời!" : "VD: Lựa chọn này có thể khiến em gặp rắc rối; em có thể tìm người hỗ trợ."} hint="Giải thích ngắn cho học sinh vì sao lựa chọn này tốt/rủi ro" />
                  </div>
                ))}
              </section>
            ) : null}

            {scenarioStep === 3 ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Bước 3: Bài học</p>
                    <h3 className="text-lg font-semibold text-on-background">Chốt thông điệp cho học sinh</h3>
                    <p className="text-sm text-on-background/60">Gợi ý cách phản hồi và bài học ngắn giúp học sinh biết nên làm gì tiếp theo.</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-on-background/70">{filledScenarioLessons}/2 nội dung đã nhập</div>
                </div>
                <TextAreaField label="Cách phản hồi nên thử" required value={scenarioDraft.recommended_response} onChange={(value) => setScenarioDraft((current) => ({ ...current, recommended_response: value }))} placeholder="VD: 'Mình không đi được đâu, cô sẽ gọi điện cho mẹ mình. Tụi mình chơi lúc khác nhé!'" hint="Một ví dụ cụ thể về cách nói/hành động tốt trong tình huống này" />
                <TextAreaField label="Điều em có thể rút ra" required value={scenarioDraft.lesson} onChange={(value) => setScenarioDraft((current) => ({ ...current, lesson: value }))} placeholder="VD: Từ chối không có nghĩa là mất bạn. Em có quyền nói không khi cảm thấy không an toàn." hint="Bài học ngắn gọn — giúp học sinh ghi nhớ kỹ năng sau khi hoàn thành" />
              </section>
            ) : null}

            {scenarioStep === 4 ? (
              <section className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Bước 4: Xem lại & Xuất bản</p>
                  <h3 className="text-lg font-semibold text-on-background">Kiểm tra nhanh trước khi xuất bản</h3>
                  <p className="text-sm text-on-background/60">Kiểm tra đủ các phần chính để tránh lỗi khi xuất bản nội dung.</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                  <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
                    <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Tóm tắt nội dung</p>
                    <dl className="mt-4 space-y-3 text-sm text-on-background/80">
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-on-background/60">Tiêu đề</dt>
                        <dd className="text-right font-medium">{scenarioDraft.title.trim() || "Chưa nhập"}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-on-background/60">Mô tả tình huống</dt>
                        <dd className="max-w-[70%] text-right">{scenarioDraft.situation.trim() || "Chưa nhập"}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-on-background/60">Kỹ năng liên quan</dt>
                        <dd className="text-right font-medium">{scenarioDraft.skill_tag.trim() || "Chưa nhập"}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-on-background/60">Lựa chọn</dt>
                        <dd className="text-right font-medium">{filledScenarioChoices}/{scenarioDraft.choices.length} đã nhập</dd>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-on-background/60">Bài học</dt>
                        <dd className="text-right font-medium">{scenarioDraft.lesson.trim() ? "Đã nhập" : "Chưa nhập"}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
                    <p className="text-xs font-medium text-on-background/70 uppercase tracking-wide">Checklist xuất bản</p>
                    <ul className="mt-4 space-y-3">
                      {scenarioReviewItems.map((item) => <ChecklistItem key={item.label} passed={item.passed} label={item.label} fixHint={item.fixHint} onFix={() => setScenarioStep(item.step)} />)}
                    </ul>
                    {!scenarioDraft.id ? (
                      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                        Lưu bản nháp trước khi xuất bản.
                      </p>
                    ) : !scenarioReviewItems.every((item) => item.passed) ? (
                      <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        Chưa thể xuất bản — hãy bấm nút &quot;Đi sửa&quot; bên cạnh mục chưa đạt (✕) để quay lại bước cần hoàn thiện.
                      </p>
                    ) : null}
                    {scenarioDraft.status !== "draft" ? (
                      <p className="mt-4 rounded-xl border border-outline-variant/30 bg-primary/5 px-3 py-2 text-xs text-on-background/70">
                        Chỉ có thể xuất bản khi nội dung đang ở trạng thái nháp.
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-outline-variant/20 pt-5 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                <button type="button" onClick={() => setScenarioStep(previousEditorStep(scenarioStep))} disabled={scenarioStep === 1} className="btn-press min-h-11 w-full rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm font-medium text-on-background/70 transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">
                  Quay lại
                </button>
                {scenarioStep < 4 ? (
                  <button type="button" onClick={async () => { await saveScenarioDraft(); setScenarioStep(nextEditorStep(scenarioStep)); }} className="btn-press min-h-11 w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 sm:w-auto">
                    Lưu & Tiếp theo
                  </button>
                ) : null}
              </div>
              <div className="hidden flex-1 sm:block" />
              <button type="button" onClick={saveScenarioDraft} className="btn-press min-h-11 w-full rounded-xl border border-primary/30 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5 sm:w-auto">
                {scenarioDraft.id ? "Lưu thay đổi" : "Lưu bản nháp"}
              </button>
              {scenarioStep === 4 && scenarioDraft.id && scenarioDraft.status === "draft" ? (
                <button type="button" disabled={!canPublishScenario} onClick={() => runAction(() => publishAdminScenario(scenarioDraft.id as string), "Đã xuất bản!")} className="btn-press min-h-11 w-full rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                  Xuất bản
                </button>
              ) : null}
              {scenarioDraft.id && scenarioDraft.status === "published" ? (
                <button type="button" onClick={() => setConfirmation({ type: "archive-scenario", id: scenarioDraft.id as string })} className="btn-press min-h-11 w-full rounded-xl border border-amber-300 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300 sm:w-auto">
                  Lưu trữ
                </button>
              ) : null}
              {scenarioDraft.id && scenarioDraft.status === "draft" ? (
                <button type="button" onClick={() => setConfirmation({ type: "delete-scenario", id: scenarioDraft.id as string })} className="btn-press min-h-11 w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm text-destructive dark:border-red-800 sm:w-auto">
                  Xóa
                </button>
              ) : null}
            </div>
          </article>
        </div>
      ) : null}

      <DestructiveConfirmDialog
        open={confirmation !== null}
        message={dialogProps.message}
        cancelLabel={dialogProps.cancelLabel}
        confirmLabel={dialogProps.confirmLabel}
        supportingText="Thao tác này chỉ thay đổi nội dung học sinh nhìn thấy."
        isConfirming={isConfirming}
        onCancel={() => setConfirmation(null)}
        onConfirm={handleConfirm}
      />
    </main>
  );
}
