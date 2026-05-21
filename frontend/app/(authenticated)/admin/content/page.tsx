"use client";

import { useEffect, useState } from "react";

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

const statusOptions: AdminContentStatus[] = ["draft", "published", "archived"];
const riskLabels: AdminRiskStateLabel[] = ["On dinh", "Can chu y", "Nen tim ho tro", "Can ho tro som"];
const signalOptions: AdminScenarioSignal[] = ["constructive", "risky"];

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
    { text: "", signal: "risky", feedback: "", sort_order: 2, is_demo: false },
  ],
};

type ConfirmationState =
  | { type: "archive-self-check"; id: string }
  | { type: "delete-self-check"; id: string }
  | { type: "archive-scenario"; id: string }
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
    <label className="space-y-1 text-label font-semibold">
      {label}
      <input
        aria-label={label}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3"
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
    <label className="space-y-1 text-label font-semibold">
      {label}
      <textarea
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 w-full rounded-2xl border border-[#CFE8E1] px-3 py-2"
      />
    </label>
  );
}

export default function AdminContentPage() {
  const [selfChecks, setSelfChecks] = useState<AdminSelfCheckContent[]>([]);
  const [scenarios, setScenarios] = useState<AdminScenarioContent[]>([]);
  const [selfCheckDraft, setSelfCheckDraft] = useState<AdminSelfCheckContent>(cloneSelfCheck(emptySelfCheck));
  const [scenarioDraft, setScenarioDraft] = useState<AdminScenarioContent>(cloneScenario(emptyScenario));
  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  function updateSelfCheckQuestion(value: string) {
    setSelfCheckDraft((current) => ({
      ...current,
      questions: [{ ...(current.questions[0] ?? emptySelfCheck.questions[0]), text: value }],
    }));
  }

  function updateSelfCheckChoice(field: "text" | "score_value", value: string) {
    setSelfCheckDraft((current) => {
      const question = current.questions[0] ?? emptySelfCheck.questions[0];
      const choice = question.choices[0] ?? emptySelfCheck.questions[0].choices[0];
      return {
        ...current,
        questions: [
          {
            ...question,
            choices: [{ ...choice, [field]: field === "score_value" ? Number(value) : value }, ...question.choices.slice(1)],
          },
        ],
      };
    });
  }

  function updateThreshold(field: keyof AdminSelfCheckContent["thresholds"][number], value: string) {
    setSelfCheckDraft((current) => {
      const threshold = current.thresholds[0] ?? emptySelfCheck.thresholds[0];
      const numericFields = ["min_score", "max_score"];
      return {
        ...current,
        thresholds: [
          {
            ...threshold,
            [field]: numericFields.includes(String(field)) ? Number(value) : value,
          },
        ],
      };
    });
  }

  function updateScenarioChoice(field: "text" | "signal" | "feedback", value: string) {
    setScenarioDraft((current) => {
      const choice = current.choices[0] ?? emptyScenario.choices[0];
      return {
        ...current,
        choices: [{ ...choice, [field]: value }, ...current.choices.slice(1)],
      };
    });
  }

  async function runAction(action: () => Promise<unknown>) {
    try {
      setError("");
      await action();
      await refreshContent();
    } catch {
      setError("Chưa lưu được nội dung. Hãy kiểm tra lại các trường bắt buộc và thử lại.");
    }
  }

  async function saveSelfCheckDraft() {
    await runAction(() =>
      selfCheckDraft.id ? updateAdminSelfCheck(selfCheckDraft.id, selfCheckDraft) : createAdminSelfCheck(selfCheckDraft),
    );
  }

  async function saveScenarioDraft() {
    await runAction(() =>
      scenarioDraft.id ? updateAdminScenario(scenarioDraft.id, scenarioDraft) : createAdminScenario(scenarioDraft),
    );
  }

  async function handleConfirm() {
    if (confirmation?.type === "archive-self-check") {
      await runAction(() => archiveAdminSelfCheck(confirmation.id));
    }
    if (confirmation?.type === "delete-self-check") {
      await runAction(() => deleteDraftAdminSelfCheck(confirmation.id));
    }
    if (confirmation?.type === "archive-scenario") {
      await runAction(() => archiveAdminScenario(confirmation.id));
    }
    setConfirmation(null);
  }

  const dialogProps =
    confirmation?.type === "delete-self-check"
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
      <header className="rounded-3xl bg-secondary p-6 shadow-sm">
        <h1 className="text-display">Nội dung tự kiểm tra và tình huống</h1>
        <p className="mt-3 text-body">Tạo, chỉnh sửa và xuất bản nội dung hỗ trợ học sinh theo đúng phạm vi an toàn.</p>
      </header>

      {error ? <p className="rounded-2xl border border-warning/40 bg-white px-4 py-3 text-label">{error}</p> : null}
      {isLoading ? <p>Đang tải thông tin...</p> : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="space-y-5 rounded-3xl bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-heading">Quản lý bài tự kiểm tra</h2>
            <p className="mt-2 text-body">Tạo bài tự kiểm tra</p>
          </div>
          {selfChecks.length === 0 && !isLoading ? (
            <EmptyState heading="Chưa có bài tự kiểm tra" body="Tạo bản nháp đầu tiên để chuẩn bị nội dung hỗ trợ học sinh." />
          ) : null}
          <div className="space-y-4">
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
            <label className="space-y-1 text-label font-semibold">
              Trạng thái nội dung
              <select
                aria-label="Trạng thái nội dung"
                value={selfCheckDraft.status}
                onChange={(event) => setSelfCheckDraft((current) => ({ ...current, status: event.target.value as AdminContentStatus }))}
                className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <TextAreaField
              label="Câu hỏi tự kiểm tra"
              value={selfCheckDraft.questions[0]?.text ?? ""}
              onChange={updateSelfCheckQuestion}
            />
            <Field
              label="Lựa chọn trả lời"
              value={selfCheckDraft.questions[0]?.choices[0]?.text ?? ""}
              onChange={(value) => updateSelfCheckChoice("text", value)}
            />
            <Field
              label="Giá trị điểm"
              value={selfCheckDraft.questions[0]?.choices[0]?.score_value ?? 0}
              type="number"
              onChange={(value) => updateSelfCheckChoice("score_value", value)}
            />
            <label className="space-y-1 text-label font-semibold">
              Nhãn trạng thái
              <select
                aria-label="Nhãn trạng thái"
                value={selfCheckDraft.thresholds[0]?.state_label ?? "On dinh"}
                onChange={(event) => updateThreshold("state_label", event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3"
              >
                {riskLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Điểm tối thiểu" value={selfCheckDraft.thresholds[0]?.min_score ?? 0} type="number" onChange={(value) => updateThreshold("min_score", value)} />
            <Field label="Điểm tối đa" value={selfCheckDraft.thresholds[0]?.max_score ?? 0} type="number" onChange={(value) => updateThreshold("max_score", value)} />
            <TextAreaField label="Nhận xét" value={selfCheckDraft.thresholds[0]?.comment ?? ""} onChange={(value) => updateThreshold("comment", value)} />
            <TextAreaField label="Tóm tắt gợi ý" value={selfCheckDraft.thresholds[0]?.advice ?? ""} onChange={(value) => updateThreshold("advice", value)} />
            <TextAreaField label="Nội dung tích cực" value={selfCheckDraft.thresholds[0]?.positive_content ?? ""} onChange={(value) => updateThreshold("positive_content", value)} />
            <TextAreaField
              label="Hành động tiếp theo gợi ý"
              value={selfCheckDraft.thresholds[0]?.suggested_next_action ?? ""}
              onChange={(value) => updateThreshold("suggested_next_action", value)}
            />
          </div>
          <div className="rounded-2xl bg-secondary p-4">
            <h3 className="text-heading">{selfCheckDraft.title || "Bản xem trước bài tự kiểm tra"}</h3>
            <p className="mt-2 text-body">{selfCheckDraft.description || "Nội dung hỗ trợ học sinh sẽ hiển thị tại đây."}</p>
            <p className="mt-2 text-label">Trạng thái nội dung: {selfCheckDraft.status}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={saveSelfCheckDraft} className="min-h-11 rounded-2xl bg-accent px-4 font-semibold text-white">
              Lưu bản nháp
            </button>
            <button
              type="button"
              onClick={() => selfCheckDraft.id && runAction(() => publishAdminSelfCheck(selfCheckDraft.id as string))}
              className="min-h-11 rounded-2xl bg-accent px-4 font-semibold text-white"
            >
              Xuất bản
            </button>
            <button
              type="button"
              onClick={() => selfCheckDraft.id && setConfirmation({ type: "archive-self-check", id: selfCheckDraft.id })}
              className="min-h-11 rounded-2xl border border-warning px-4"
            >
              Lưu trữ
            </button>
            <button
              type="button"
              onClick={() => selfCheckDraft.id && setConfirmation({ type: "delete-self-check", id: selfCheckDraft.id })}
              className="min-h-11 rounded-2xl bg-destructive px-4 font-semibold text-white"
            >
              Xóa bản nháp chưa dùng
            </button>
          </div>
        </article>

        <article className="space-y-5 rounded-3xl bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-heading">Quản lý tình huống</h2>
            <p className="mt-2 text-body">Tạo tình huống</p>
          </div>
          {scenarios.length === 0 && !isLoading ? (
            <EmptyState heading="Chưa có tình huống" body="Tạo bản nháp tình huống để học sinh luyện cách phản hồi an toàn hơn." />
          ) : null}
          <div className="space-y-4">
            <Field label="Tiêu đề tình huống" value={scenarioDraft.title} onChange={(value) => setScenarioDraft((current) => ({ ...current, title: value }))} />
            <TextAreaField label="Mô tả tình huống" value={scenarioDraft.situation} onChange={(value) => setScenarioDraft((current) => ({ ...current, situation: value }))} />
            <Field label="Kỹ năng liên quan" value={scenarioDraft.skill_tag} onChange={(value) => setScenarioDraft((current) => ({ ...current, skill_tag: value }))} />
            <label className="space-y-1 text-label font-semibold">
              Trạng thái nội dung
              <select
                aria-label="Trạng thái nội dung"
                value={scenarioDraft.status}
                onChange={(event) => setScenarioDraft((current) => ({ ...current, status: event.target.value as AdminContentStatus }))}
                className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Lựa chọn phản hồi" value={scenarioDraft.choices[0]?.text ?? ""} onChange={(value) => updateScenarioChoice("text", value)} />
            <label className="space-y-1 text-label font-semibold">
              Tín hiệu constructive/risky
              <select
                aria-label="Tín hiệu constructive/risky"
                value={scenarioDraft.choices[0]?.signal ?? "constructive"}
                onChange={(event) => updateScenarioChoice("signal", event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3"
              >
                {signalOptions.map((signal) => (
                  <option key={signal} value={signal}>
                    {signal}
                  </option>
                ))}
              </select>
            </label>
            <TextAreaField label="Phản hồi cho lựa chọn" value={scenarioDraft.choices[0]?.feedback ?? ""} onChange={(value) => updateScenarioChoice("feedback", value)} />
            <TextAreaField
              label="Cách phản hồi nên thử"
              value={scenarioDraft.recommended_response}
              onChange={(value) => setScenarioDraft((current) => ({ ...current, recommended_response: value }))}
            />
            <TextAreaField label="Điều em có thể rút ra" value={scenarioDraft.lesson} onChange={(value) => setScenarioDraft((current) => ({ ...current, lesson: value }))} />
          </div>
          <div className="rounded-2xl bg-secondary p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-heading">{scenarioDraft.title || "Bản xem trước tình huống"}</h3>
              {scenarioDraft.is_demo ? <DemoBadge /> : null}
            </div>
            <p className="mt-2 text-body">{scenarioDraft.situation || "Mô tả tình huống sẽ hiển thị tại đây."}</p>
            <p className="mt-2 text-label">Trạng thái nội dung: {scenarioDraft.status}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={saveScenarioDraft} className="min-h-11 rounded-2xl border border-[#CFE8E1] px-4">
              Lưu bản nháp tình huống
            </button>
            <button
              type="button"
              onClick={() => scenarioDraft.id && runAction(() => publishAdminScenario(scenarioDraft.id as string))}
              className="min-h-11 rounded-2xl bg-accent px-4 font-semibold text-white"
            >
              Xuất bản
            </button>
            <button
              type="button"
              onClick={() => scenarioDraft.id && setConfirmation({ type: "archive-scenario", id: scenarioDraft.id })}
              className="min-h-11 rounded-2xl border border-warning px-4"
            >
              Lưu trữ
            </button>
            <button type="button" className="min-h-11 rounded-2xl border border-[#CFE8E1] px-4">
              Xóa bản nháp tình huống chưa dùng
            </button>
          </div>
        </article>
      </section>

      <DestructiveConfirmDialog
        open={confirmation !== null}
        message={dialogProps.message}
        cancelLabel={dialogProps.cancelLabel}
        confirmLabel={dialogProps.confirmLabel}
        onCancel={() => setConfirmation(null)}
        onConfirm={handleConfirm}
      />
    </main>
  );
}
