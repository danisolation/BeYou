"use client";

import { useEffect, useState } from "react";
import { FileText, Pencil, Trash2, Plus, Archive, ArrowLeft, ChevronRight } from "lucide-react";

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
  const [isEditing, setIsEditing] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

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
    setIsEditing(true);
    setNotice("");
    setError("");
  }

  function openScenarioEditor(item?: AdminScenarioContent) {
    setScenarioDraft(cloneScenario(item ?? emptyScenario));
    setIsEditing(true);
    setNotice("");
    setError("");
  }

  function closeEditor() {
    setIsEditing(false);
    setNotice("");
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
      setNotice("Đã lưu thành công!");
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
      setNotice("Đã lưu thành công!");
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
    <main className="mx-auto max-w-[1200px] space-y-5">
      {/* Header */}
      <header className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-on-background">Quản lý nội dung</h1>
            <p className="text-xs text-on-background/60">Tạo, sửa và xuất bản bài tự kiểm tra và tình huống</p>
          </div>
        </div>
      </header>

      {/* Notices */}
      {notice ? <p role="status" className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-2.5 text-xs text-green-800 dark:text-green-300">{notice}</p> : null}
      {error ? <p role="alert" className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-xs text-red-800 dark:text-red-300">{error}</p> : null}
      {isLoading ? <p className="text-sm text-on-background/60">Đang tải...</p> : null}

      {/* === LIST VIEW === */}
      {!isEditing ? (
        <>
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

          {/* Create button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => activeTab === "self-check" ? openSelfCheckEditor() : openScenarioEditor()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              {activeTab === "self-check" ? "Tạo bài tự kiểm tra" : "Tạo tình huống"}
            </button>
          </div>

          {/* Self-check list */}
          {activeTab === "self-check" ? (
            <div className="space-y-2">
              {selfChecks.length === 0 && !isLoading ? (
                <EmptyState heading="Chưa có bài tự kiểm tra" body="Nhấn nút tạo mới để bắt đầu." />
              ) : (
                selfChecks.map((item) => (
                  <button
                    key={item.id ?? item.title}
                    type="button"
                    onClick={() => openSelfCheckEditor(item)}
                    className="flex w-full items-center gap-3 rounded-xl border border-outline-variant/20 bg-white dark:bg-[#1a2940] p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-on-background">{item.title || "Chưa đặt tên"}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-on-background/50">{item.questions?.length ?? 0} câu hỏi · {item.thresholds?.length ?? 0} ngưỡng</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
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
              {scenarios.length === 0 && !isLoading ? (
                <EmptyState heading="Chưa có tình huống" body="Nhấn nút tạo mới để bắt đầu." />
              ) : (
                scenarios.map((item) => (
                  <button
                    key={item.id ?? item.title}
                    type="button"
                    onClick={() => openScenarioEditor(item)}
                    className="flex w-full items-center gap-3 rounded-xl border border-outline-variant/20 bg-white dark:bg-[#1a2940] p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-on-background">{item.title || "Chưa đặt tên"}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-on-background/50">{item.skill_tag || "Chưa gắn kỹ năng"} · {item.choices?.length ?? 0} lựa chọn</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
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

          <article className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6 space-y-5">
            <h2 className="text-base font-semibold">
              {selfCheckDraft.id ? "Chỉnh sửa bài tự kiểm tra" : "Tạo bài tự kiểm tra mới"}
            </h2>

            {/* Basic info */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Thông tin cơ bản</h3>
              <Field label="Tên bài" value={selfCheckDraft.title} onChange={(value) => setSelfCheckDraft((current) => ({ ...current, title: value }))} />
              <TextAreaField label="Mô tả ngắn" value={selfCheckDraft.description ?? ""} onChange={(value) => setSelfCheckDraft((current) => ({ ...current, description: value }))} />
              <label className="space-y-1 text-sm font-medium">
                Trạng thái
                <select aria-label="Trạng thái nội dung" value={selfCheckDraft.status} onChange={(event) => setSelfCheckDraft((current) => ({ ...current, status: event.target.value as AdminContentStatus }))} className="min-h-11 w-full rounded-xl border border-outline-variant/30 px-3 dark:bg-[#1e2d40]">
                  {statusOptions.map((s) => <option key={s} value={s}>{s === "draft" ? "Nháp" : s === "published" ? "Đã xuất bản" : "Đã lưu trữ"}</option>)}
                </select>
              </label>
            </section>

            {/* Questions */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Câu hỏi ({selfCheckDraft.questions.length})</h3>
                <button type="button" onClick={addSelfCheckQuestion} className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/30 px-3 py-1.5 text-xs font-medium hover:bg-primary/5">
                  <Plus size={14} /> Thêm
                </button>
              </div>
              {selfCheckDraft.questions.length === 0 ? <p className="rounded-xl bg-primary/5 p-3 text-xs text-on-background/60">Thêm ít nhất 1 câu hỏi.</p> : null}
              {selfCheckDraft.questions.map((question, qi) => (
                <details key={question.id ?? `q-${qi}`} className="rounded-xl border border-outline-variant/20 overflow-hidden" open={qi === 0}>
                  <summary className="cursor-pointer bg-primary/5 dark:bg-primary/10 px-4 py-3 text-sm font-medium select-none flex items-center justify-between">
                    <span>Câu {qi + 1}: {question.text || "Chưa nhập"}</span>
                    <button type="button" onClick={(e) => { e.preventDefault(); removeSelfCheckQuestion(qi); }} className="text-xs text-destructive hover:underline">Xóa</button>
                  </summary>
                  <div className="space-y-3 p-4">
                    <Field label="Nội dung câu hỏi" value={question.text} onChange={(v) => updateSelfCheckQuestion(qi, "text", v)} />
                    <Field label="Thứ tự" value={question.sort_order} type="number" onChange={(v) => updateSelfCheckQuestion(qi, "sort_order", v)} />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-on-background/70">Lựa chọn ({question.choices.length})</span>
                        <button type="button" onClick={() => addSelfCheckChoice(qi)} className="text-xs text-primary hover:underline">+ Thêm</button>
                      </div>
                      {question.choices.map((choice, ci) => (
                        <div key={choice.id ?? `c-${qi}-${ci}`} className="flex items-start gap-2 rounded-lg border border-outline-variant/10 bg-white dark:bg-[#1e2d40] p-3">
                          <div className="flex-1 space-y-2">
                            <input aria-label={`Lựa chọn ${ci + 1}`} type="text" value={choice.text} onChange={(e) => updateSelfCheckChoice(qi, ci, "text", e.target.value)} placeholder={`Lựa chọn ${ci + 1}`} className="w-full rounded-lg border border-outline-variant/20 px-3 py-2 text-sm dark:bg-[#1e2d40]" />
                            <div className="flex gap-2 items-center">
                              <input aria-label="Điểm" type="number" value={choice.score_value} onChange={(e) => updateSelfCheckChoice(qi, ci, "score_value", e.target.value)} className="w-20 rounded-lg border border-outline-variant/20 px-2 py-1 text-xs dark:bg-[#1e2d40]" />
                              <span className="text-xs text-on-background/50">điểm</span>
                            </div>
                          </div>
                          <button type="button" onClick={() => removeSelfCheckChoice(qi, ci)} className="mt-1 text-on-background/40 hover:text-destructive"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </section>

            {/* Thresholds */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Ngưỡng điểm ({selfCheckDraft.thresholds.length})</h3>
                <button type="button" onClick={addThreshold} className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/30 px-3 py-1.5 text-xs font-medium hover:bg-primary/5">
                  <Plus size={14} /> Thêm
                </button>
              </div>
              {selfCheckDraft.thresholds.map((threshold, ti) => (
                <div key={threshold.id ?? `th-${ti}`} className="rounded-xl border border-outline-variant/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ngưỡng {ti + 1}</span>
                    <button type="button" onClick={() => removeThreshold(ti)} className="text-xs text-destructive hover:underline">Xóa</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="space-y-1 text-sm font-medium">
                      Mức
                      <select aria-label="Mức" value={threshold.state_label} onChange={(e) => updateThreshold(ti, "state_label", e.target.value)} className="min-h-10 w-full rounded-lg border border-outline-variant/30 px-2 text-sm dark:bg-[#1e2d40]">
                        {riskLabels.map((l) => <option key={l} value={l}>{riskLabelDisplay[l]}</option>)}
                      </select>
                    </label>
                    <Field label="Min" value={threshold.min_score} type="number" onChange={(v) => updateThreshold(ti, "min_score", v)} />
                    <Field label="Max" value={threshold.max_score} type="number" onChange={(v) => updateThreshold(ti, "max_score", v)} />
                  </div>
                  <TextAreaField label="Nhận xét" value={threshold.comment ?? ""} onChange={(v) => updateThreshold(ti, "comment", v)} />
                  <TextAreaField label="Gợi ý" value={threshold.advice ?? ""} onChange={(v) => updateThreshold(ti, "advice", v)} />
                  <details className="text-xs">
                    <summary className="cursor-pointer text-on-background/50 hover:text-on-background select-none">Thêm trường...</summary>
                    <div className="mt-2 space-y-3">
                      <TextAreaField label="Nội dung tích cực" value={threshold.positive_content ?? ""} onChange={(v) => updateThreshold(ti, "positive_content", v)} />
                      <TextAreaField label="Hành động tiếp theo" value={threshold.suggested_next_action ?? ""} onChange={(v) => updateThreshold(ti, "suggested_next_action", v)} />
                    </div>
                  </details>
                </div>
              ))}
            </section>

            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant/20 pt-5">
              <button type="button" onClick={saveSelfCheckDraft} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                {selfCheckDraft.id ? "Lưu thay đổi" : "Lưu bản nháp"}
              </button>
              {selfCheckDraft.id && selfCheckDraft.status === "draft" ? (
                <button type="button" onClick={() => runAction(() => publishAdminSelfCheck(selfCheckDraft.id as string), "Đã xuất bản!")} className="rounded-xl border border-green-300 dark:border-green-700 px-5 py-2.5 text-sm font-medium text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20">
                  Xuất bản
                </button>
              ) : null}
              <div className="flex-1" />
              {selfCheckDraft.id && selfCheckDraft.status === "published" ? (
                <button type="button" onClick={() => setConfirmation({ type: "archive-self-check", id: selfCheckDraft.id as string })} className="rounded-xl border border-amber-300 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300">
                  Lưu trữ
                </button>
              ) : null}
              {selfCheckDraft.id && selfCheckDraft.status === "draft" ? (
                <button type="button" onClick={() => setConfirmation({ type: "delete-self-check", id: selfCheckDraft.id as string })} className="rounded-xl border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-destructive">
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

          <article className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6 space-y-5">
            <h2 className="text-base font-semibold">
              {scenarioDraft.id ? "Chỉnh sửa tình huống" : "Tạo tình huống mới"}
            </h2>

            {/* Basic info */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Thông tin cơ bản</h3>
              <Field label="Tiêu đề" value={scenarioDraft.title} onChange={(v) => setScenarioDraft((c) => ({ ...c, title: v }))} />
              <TextAreaField label="Mô tả tình huống" value={scenarioDraft.situation} onChange={(v) => setScenarioDraft((c) => ({ ...c, situation: v }))} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Kỹ năng liên quan" value={scenarioDraft.skill_tag} onChange={(v) => setScenarioDraft((c) => ({ ...c, skill_tag: v }))} />
                <label className="space-y-1 text-sm font-medium">
                  Trạng thái
                  <select aria-label="Trạng thái" value={scenarioDraft.status} onChange={(e) => setScenarioDraft((c) => ({ ...c, status: e.target.value as AdminContentStatus }))} className="min-h-11 w-full rounded-xl border border-outline-variant/30 px-3 dark:bg-[#1e2d40]">
                    {statusOptions.map((s) => <option key={s} value={s}>{s === "draft" ? "Nháp" : s === "published" ? "Đã xuất bản" : "Đã lưu trữ"}</option>)}
                  </select>
                </label>
              </div>
            </section>

            {/* Choices */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Lựa chọn phản hồi ({scenarioDraft.choices.length})</h3>
                <button type="button" onClick={addScenarioChoice} className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/30 px-3 py-1.5 text-xs font-medium hover:bg-primary/5">
                  <Plus size={14} /> Thêm
                </button>
              </div>
              {scenarioDraft.choices.length === 0 ? <p className="rounded-xl bg-primary/5 p-3 text-xs text-on-background/60">Thêm ít nhất 2 lựa chọn.</p> : null}
              {scenarioDraft.choices.map((choice, ci) => (
                <div key={choice.id ?? `sc-${ci}`} className="rounded-xl border border-outline-variant/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Lựa chọn {ci + 1}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${choice.signal === "constructive" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
                        {choice.signal === "constructive" ? "Tích cực" : "Rủi ro"}
                      </span>
                    </div>
                    <button type="button" onClick={() => removeScenarioChoice(ci)} className="text-xs text-destructive hover:underline">Xóa</button>
                  </div>
                  <Field label="Nội dung" value={choice.text} onChange={(v) => updateScenarioChoice(ci, "text", v)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="space-y-1 text-sm font-medium">
                      Tín hiệu
                      <select aria-label="Tín hiệu" value={choice.signal} onChange={(e) => updateScenarioChoice(ci, "signal", e.target.value)} className="min-h-10 w-full rounded-lg border border-outline-variant/30 px-2 text-sm dark:bg-[#1e2d40]">
                        {signalOptions.map((s) => <option key={s} value={s}>{s === "constructive" ? "Tích cực" : "Rủi ro"}</option>)}
                      </select>
                    </label>
                    <Field label="Thứ tự" value={choice.sort_order} type="number" onChange={(v) => updateScenarioChoice(ci, "sort_order", v)} />
                  </div>
                  <TextAreaField label="Phản hồi" value={choice.feedback} onChange={(v) => updateScenarioChoice(ci, "feedback", v)} />
                </div>
              ))}
            </section>

            {/* Lesson */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-on-background/50">Bài học & gợi ý</h3>
              <TextAreaField label="Cách phản hồi nên thử" value={scenarioDraft.recommended_response} onChange={(v) => setScenarioDraft((c) => ({ ...c, recommended_response: v }))} />
              <TextAreaField label="Điều em có thể rút ra" value={scenarioDraft.lesson} onChange={(v) => setScenarioDraft((c) => ({ ...c, lesson: v }))} />
            </section>

            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant/20 pt-5">
              <button type="button" onClick={saveScenarioDraft} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                {scenarioDraft.id ? "Lưu thay đổi" : "Lưu bản nháp"}
              </button>
              {scenarioDraft.id && scenarioDraft.status === "draft" ? (
                <button type="button" onClick={() => runAction(() => publishAdminScenario(scenarioDraft.id as string), "Đã xuất bản!")} className="rounded-xl border border-green-300 dark:border-green-700 px-5 py-2.5 text-sm font-medium text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20">
                  Xuất bản
                </button>
              ) : null}
              <div className="flex-1" />
              {scenarioDraft.id && scenarioDraft.status === "published" ? (
                <button type="button" onClick={() => setConfirmation({ type: "archive-scenario", id: scenarioDraft.id as string })} className="rounded-xl border border-amber-300 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300">
                  Lưu trữ
                </button>
              ) : null}
              {scenarioDraft.id && scenarioDraft.status === "draft" ? (
                <button type="button" onClick={() => setConfirmation({ type: "delete-scenario", id: scenarioDraft.id as string })} className="rounded-xl border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-destructive">
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
