"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";

import {
  type AdminOperationsDashboard,
  type AdminOperationsFilters,
  type AuthProviderReadinessSummary,
  type AuditEventItem,
  type ConnectivitySummary,
  type DemoSeedSummary,
  type DeploymentGuardrailItem,
  type IdentityMappingOperationsSummary,
  getAdminOperationsDashboard,
  type OperationCountBucket,
  type PilotDataSafetyBucket,
  type PilotDataSafetySummary,
  type PilotHandoffItem,
  type PilotHandoffSummary,
  type PilotLaunchChecklistItem,
  type PilotLaunchSummary,
  type ProductionSmokeChecklistItem,
  type RuntimeModeSummary,
  type SessionAuthOperationsSummary,
  type SmokeProfileItem,
  type SosEmailDeliveryItem,
} from "@/lib/admin-operations-api";

const emptyFilters = {
  startAt: "",
  endAt: "",
  actorRole: "",
  actionType: "",
  targetType: "",
  status: "",
};

type FilterFormState = typeof emptyFilters;

const roleOptions = [
  { value: "", label: "Tất cả vai trò" },
  { value: "admin", label: "Admin" },
  { value: "student", label: "Học sinh" },
  { value: "teacher", label: "Giáo viên" },
  { value: "parent", label: "Phụ huynh" },
];

const forbiddenMetadataKeyPattern =
  /email|student_id|recipient_id|private_note|sos_note|transcript|self_check_answer|scenario_answer|reason_text|access_reason_text|provider_subject|raw_claims|export_url|risk_leaderboard/i;
const unsafeMetadataValuePattern =
  /@|https?:\/\/|eyJ[A-Za-z0-9_-]{10,}|private_note|sos_note|transcript|self_check_answer|scenario_answer|provider_subject|raw_claims|risk leaderboard|xếp hạng nguy cơ/i;
const safeMetadataFallback = "metadata_an_toan";

function formatDate(value: string | null) {
  if (!value) {
    return "Chưa có";
  }
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function metadataText(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata)
    .filter(([key]) => !forbiddenMetadataKeyPattern.test(key))
    .map(([key, value]) => {
      const rendered = String(value);
      return [key, unsafeMetadataValuePattern.test(rendered) ? safeMetadataFallback : rendered] as const;
    });
  if (entries.length === 0) {
    return "Không có metadata bổ sung.";
  }
  return entries.map(([key, value]) => `${key}: ${value}`).join(" · ");
}

function toApiFilters(filters: FilterFormState): AdminOperationsFilters {
  return {
    startAt: filters.startAt || undefined,
    endAt: filters.endAt || undefined,
    actorRole: filters.actorRole || undefined,
    actionType: filters.actionType.trim() || undefined,
    targetType: filters.targetType.trim() || undefined,
    status: filters.status.trim() || undefined,
    limit: 25,
  };
}

export default function AdminOperationsPage() {
  const [draftFilters, setDraftFilters] = useState<FilterFormState>(emptyFilters);
  const [activeFilters, setActiveFilters] = useState<FilterFormState>(emptyFilters);
  const [dashboard, setDashboard] = useState<AdminOperationsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");
    getAdminOperationsDashboard(toApiFilters(activeFilters))
      .then((loaded) => {
        if (!cancelled) {
          setDashboard(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Chưa tải được metadata pilot. Hãy thử lại từ cổng quản trị hoặc kiểm tra readiness backend.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeFilters]);

  const generatedAt = useMemo(() => formatDate(dashboard?.generated_at ?? null), [dashboard]);

  function updateFilter(field: keyof FilterFormState, value: string) {
    setDraftFilters((current) => ({ ...current, [field]: value }));
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveFilters(draftFilters);
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-label font-semibold text-accent">Vận hành pilot an toàn</p>
        <h1 className="mt-2 text-2xl font-bold">Sẵn sàng mở pilot trường học</h1>
        <p className="mt-3 max-w-3xl text-body">
          Theo dõi readiness, checklist launch, an toàn dữ liệu demo/thật và hướng dẫn rollback bằng metadata. Trang này
          không mở nội dung riêng tư của học sinh.
        </p>
        <p className="mt-3 text-label font-semibold text-accent">Vận hành metadata-only</p>
        <p className="mt-3 text-label">Cập nhật: {generatedAt}</p>
      </header>

      <section className="rounded-3xl bg-secondary p-6">
        <h2 className="text-heading">Ranh giới riêng tư</h2>
        <ul className="mt-3 space-y-2 text-body">
          {(dashboard?.privacy_notes ?? [
            "Chỉ hiển thị metadata vận hành.",
            "Không hiển thị ghi chú SOS, câu trả lời tự kiểm tra, nội dung chatbot, email người nhận hoặc secret.",
          ]).map((note) => (
            <li key={note}>• {note}</li>
          ))}
        </ul>
        <p className="mt-4 rounded-2xl bg-white p-4 text-label font-semibold text-accent">
          Không có xuất dữ liệu thô, không có danh sách học sinh theo nguy cơ, không có đường mở hồ sơ học sinh.
        </p>
        <p className="mt-4 rounded-2xl bg-white p-4 text-label font-semibold text-accent">
          Danh tính ngoài chỉ được hiển thị bằng metadata tổng hợp. Quyền xem học sinh vẫn do vai trò trong ứng dụng,
          liên kết đang hoạt động và SOS của học sinh quyết định.
        </p>
      </section>

      <form className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-3" onSubmit={applyFilters}>
        <label className="space-y-2 text-label font-semibold">
          Từ thời điểm
          <input
            aria-label="Từ thời điểm"
            type="datetime-local"
            value={draftFilters.startAt}
            onChange={(event) => updateFilter("startAt", event.target.value)}
            className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3"
          />
        </label>
        <label className="space-y-2 text-label font-semibold">
          Đến thời điểm
          <input
            aria-label="Đến thời điểm"
            type="datetime-local"
            value={draftFilters.endAt}
            onChange={(event) => updateFilter("endAt", event.target.value)}
            className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3"
          />
        </label>
        <label className="space-y-2 text-label font-semibold">
          Vai trò người thực hiện
          <select
            aria-label="Vai trò người thực hiện"
            value={draftFilters.actorRole}
            onChange={(event) => updateFilter("actorRole", event.target.value)}
            className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-label font-semibold">
          Loại hành động
          <input
            aria-label="Loại hành động"
            value={draftFilters.actionType}
            onChange={(event) => updateFilter("actionType", event.target.value)}
            className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3"
            placeholder="vd: account_status_changed"
          />
        </label>
        <label className="space-y-2 text-label font-semibold">
          Loại mục tiêu
          <input
            aria-label="Loại mục tiêu"
            value={draftFilters.targetType}
            onChange={(event) => updateFilter("targetType", event.target.value)}
            className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3"
            placeholder="vd: account_profile"
          />
        </label>
        <label className="space-y-2 text-label font-semibold">
          Trạng thái audit
          <input
            aria-label="Trạng thái audit"
            value={draftFilters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="min-h-11 w-full rounded-2xl border border-[#CFE8E1] px-3"
            placeholder="vd: success"
          />
        </label>
        <button type="submit" className="min-h-11 rounded-2xl bg-accent px-4 font-semibold text-white md:col-span-3">
          Áp dụng bộ lọc
        </button>
      </form>

      {isLoading ? <p className="rounded-3xl bg-white p-6 shadow-sm">Đang tải metadata vận hành pilot...</p> : null}
      {error ? <p className="rounded-3xl bg-white p-6 text-red-700 shadow-sm">{error}</p> : null}

      {dashboard ? (
        <>
          <Panel
            title="Production pilot launch status"
            description="Trạng thái launch pilot được suy ra từ checklist metadata, không phải phê duyệt pháp lý hoặc lâm sàng."
            testId="pilot-launch-status"
          >
            <PilotLaunchStatusPanel summary={dashboard.pilot_launch ?? null} />
          </Panel>
          <Panel
            title="Launch checklist"
            description="Các điều kiện runtime, readiness, guardrail, smoke, baseline và policy trước khi dùng với dữ liệu học sinh thật."
            testId="pilot-launch-checklist"
          >
            <PilotLaunchChecklistPanel checklist={dashboard.pilot_launch?.checklist ?? []} />
          </Panel>
          <Panel
            title="Demo/real data safety"
            description="Đếm aggregate demo/real metadata để tránh phụ thuộc demo khi mở production pilot."
            testId="pilot-data-safety"
          >
            <PilotDataSafetyPanel summary={dashboard.pilot_data_safety ?? null} />
          </Panel>
          <Panel
            title="Baseline setup"
            description="Thiết lập nội dung, policy và reminder không-demo trước khi trường bắt đầu onboarding."
            testId="pilot-baseline-setup"
          >
            <PilotHandoffItems
              items={dashboard.pilot_handoff?.baseline_setup ?? []}
              emptyCopy="Chưa có metadata thiết lập baseline. Hãy xác nhận nội dung, chính sách và cấu hình pilot trước khi mở cho trường."
            />
          </Panel>
          <Panel
            title="Rollback và handoff"
            description="Hướng dẫn rollback và bàn giao chỉ là metadata tĩnh; không lưu contact details hoặc incident free text."
            testId="pilot-handoff-guidance"
          >
            <PilotHandoffPanel handoff={dashboard.pilot_handoff ?? null} />
          </Panel>
          <Panel
            title="Deployment guardrails"
            description="Kiểm tra Render, Vercel, API target, CORS và cookie bằng metadata an toàn."
          >
            <DeploymentGuardrailsPanel items={dashboard.deployment_guardrails ?? []} />
          </Panel>
          <Panel
            title="Smoke profiles"
            description="Tách smoke public demo khỏi production pilot để không tạo tự tin sai từ tài khoản demo."
          >
            <SmokeProfilesPanel profiles={dashboard.smoke_profiles ?? []} />
          </Panel>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard title="Readiness" value={dashboard.readiness.status} description="Trạng thái vận hành tổng thể." />
            <MetricCard title="Demo seed" value={dashboard.demo_seed.status} description="Vai trò demo, liên kết và nội dung walkthrough." />
            <MetricCard title="SOS email attempts" value={dashboard.sos_email.total} description="Tổng attempt email SOS metadata." />
            <MetricCard title="Audit matching" value={dashboard.audit.total_matching} description="Số audit event khớp bộ lọc." />
          </div>
          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="Runtime mode" description="Tóm tắt mode vận hành và chính sách demo/pilot bằng metadata an toàn.">
              <RuntimeModePanel runtime={dashboard.runtime} />
            </Panel>
            <Panel title="Demo seed readiness" description="Kiểm tra tài khoản demo, liên kết hỗ trợ và nội dung seed bằng metadata an toàn.">
              <DemoSeedPanel demoSeed={dashboard.demo_seed} />
            </Panel>
            <Panel title="Connectivity & session contract" description="Xác nhận frontend/backend, CORS credentialed và cookie session theo cấu hình đã mask.">
              <ConnectivityPanel connectivity={dashboard.connectivity} />
            </Panel>
          </section>
          <Panel
            title="Auth provider readiness"
            description="Theo dõi cấu hình đăng nhập ngoài bằng metadata an toàn, không hiển thị client ID, issuer, callback URL hoặc secret."
          >
            <AuthProviderPanel provider={dashboard.auth_provider ?? null} />
          </Panel>
          <section className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Identity mapping buckets"
              description="Tóm tắt trạng thái liên kết danh tính theo count metadata; không có email, subject, claim hoặc đường mở tài khoản."
            >
              <IdentityMappingPanel
                mappings={dashboard.identity_mappings ?? null}
                buckets={dashboard.identity_mappings?.by_status ?? []}
              />
            </Panel>
            <Panel
              title="Session auth methods"
              description="Tóm tắt session backend-owned theo phương thức đăng nhập và provider an toàn; không lưu token trong trình duyệt."
            >
              <SessionAuthPanel
                methodBuckets={dashboard.session_auth?.by_auth_method ?? []}
                providerBuckets={dashboard.session_auth?.by_provider ?? []}
              />
            </Panel>
          </section>
          <Panel title="Production smoke checklist" description="Các bước smoke production có thể chạy mà không xuất secret hoặc dữ liệu riêng tư.">
            <SmokeChecklist items={dashboard.production_smoke} />
          </Panel>
          <Panel title="v1.2 support metadata" description="Support plan, mood check-in, adult summary và admin config theo count metadata an toàn.">
            <BucketList buckets={dashboard.v1_2_audit ?? []} emptyCopy="Chưa có audit v1.2." />
          </Panel>
          <Panel
            title="v1.4 privacy controls"
            description="Consent, reminders, note sharing, reason-gated reads và policy updates theo count metadata an toàn."
          >
            <BucketList buckets={dashboard.v1_4_audit ?? []} emptyCopy="Chưa có audit v1.4." />
          </Panel>

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="Readiness checks" description="Chỉ hiển thị key, trạng thái và hướng xử lý đã được masking.">
              <BucketList buckets={dashboard.readiness.checks_by_status} />
              {dashboard.readiness.attention_checks.length === 0 ? (
                <p className="mt-3 text-body">Không có cảnh báo readiness cần chú ý.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {dashboard.readiness.attention_checks.map((check) => (
                    <article key={check.key} className="rounded-2xl bg-secondary p-4">
                      <p className="font-semibold">
                        {check.key} · {check.status}
                      </p>
                      <p className="mt-2 text-body">{check.summary}</p>
                      {check.remediation ? <p className="mt-2 text-label">{check.remediation}</p> : null}
                    </article>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="SOS email delivery metadata" description="Không hiển thị email người nhận hoặc ghi chú SOS.">
              <BucketList buckets={dashboard.sos_email.by_status} />
              <BucketList title="Provider" buckets={dashboard.sos_email.by_provider} />
              <BucketList title="Mã lỗi an toàn" buckets={dashboard.sos_email.by_error_code} emptyCopy="Chưa có lỗi email." />
              <DeliveryList deliveries={dashboard.sos_email.recent} />
            </Panel>
          </section>

          <Panel title="Audit events" description="Có thể lọc theo thời gian, vai trò, hành động, mục tiêu và trạng thái.">
            {dashboard.audit.recent.length === 0 ? (
              <p className="text-body">Không có audit event khớp bộ lọc.</p>
            ) : (
              <div className="space-y-3">
                {dashboard.audit.recent.map((event) => (
                  <AuditEventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </Panel>
        </>
      ) : null}
    </section>
  );
}

function statusClass(status: string) {
  if (status === "ready" || status === "safe" || status === "pass" || status === "covered") {
    return "border-accent bg-secondary text-accent-dark";
  }
  if (status === "needs_review" || status === "warn") {
    return "border-warning bg-[#FFF8E8] text-[#6B4A00]";
  }
  return "border-[#F3C0C0] bg-white text-red-700";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-label font-semibold ${statusClass(status)}`}>
      {status}
    </span>
  );
}

function pilotLaunchCopy(status: PilotLaunchSummary["status"]) {
  if (status === "blocked") {
    return "Pilot đang bị chặn. Hãy xử lý các mục fail trước khi dùng với dữ liệu học sinh thật.";
  }
  if (status === "ready") {
    return "Pilot sẵn sàng theo metadata hiện tại. Vẫn cần xác nhận vận hành với trường trước khi mở thực tế.";
  }
  return "Pilot cần rà soát thêm. Các mục warn không mở dữ liệu riêng tư nhưng cần xác nhận trước launch.";
}

function PilotLaunchStatusPanel({ summary }: { summary: PilotLaunchSummary | null }) {
  const status = summary?.status ?? "needs_review";
  return (
    <div className="rounded-2xl bg-secondary p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        <p className="text-body">{pilotLaunchCopy(status)}</p>
      </div>
      {summary?.generated_at ? <p className="mt-3 text-label">Cập nhật checklist: {formatDate(summary.generated_at)}</p> : null}
    </div>
  );
}

function PilotLaunchChecklistPanel({ checklist }: { checklist: PilotLaunchChecklistItem[] }) {
  if (checklist.length === 0) {
    return <p className="rounded-2xl bg-secondary p-4 text-body">Chưa có checklist pilot. Hãy kiểm tra readiness và tải lại trang vận hành.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {checklist.map((item) => (
        <article key={item.key} className="rounded-2xl border border-[#D7EFE8] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{item.label}</h3>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-2 text-label">Blocking: {item.blocking ? "yes" : "no"}</p>
          <p className="mt-2 text-body">{item.evidence}</p>
          {item.command ? <p className="mt-2 rounded-2xl bg-secondary px-3 py-2 text-label">{item.command}</p> : null}
          {item.remediation ? <p className="mt-2 text-label">{item.remediation}</p> : null}
        </article>
      ))}
    </div>
  );
}

function PilotDataSafetyPanel({ summary }: { summary: PilotDataSafetySummary | null }) {
  const buckets = summary?.buckets ?? [];
  if (buckets.length === 0) {
    return <p className="rounded-2xl bg-secondary p-4 text-body">Chưa có metadata an toàn dữ liệu pilot. Không có dữ liệu thô được hiển thị.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-secondary p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={summary?.status ?? "needs_review"} />
          <p className="text-body">Tổng hợp demo/real data safety bằng count metadata.</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {buckets.map((bucket) => (
          <PilotDataSafetyBucketCard key={bucket.key} bucket={bucket} />
        ))}
      </div>
    </div>
  );
}

function PilotDataSafetyBucketCard({ bucket }: { bucket: PilotDataSafetyBucket }) {
  return (
    <article className="rounded-2xl border border-[#D7EFE8] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{bucket.label}</h3>
        <StatusBadge status={bucket.status} />
      </div>
      <p className="mt-2 text-2xl font-bold">{bucket.count}</p>
      <p className="mt-2 text-label">Blocking: {bucket.blocking ? "yes" : "no"}</p>
      <p className="mt-2 text-body">{bucket.evidence}</p>
      {bucket.remediation ? <p className="mt-2 text-label">{bucket.remediation}</p> : null}
    </article>
  );
}

function PilotHandoffPanel({ handoff }: { handoff: PilotHandoffSummary | null }) {
  const rollback = handoff?.rollback ?? [];
  const schoolHandoff = handoff?.school_handoff ?? [];
  if (rollback.length === 0 && schoolHandoff.length === 0) {
    return <p className="rounded-2xl bg-secondary p-4 text-body">Chưa có hướng dẫn handoff. Hãy dùng quy trình rollback an toàn trong README và kiểm tra lại readiness.</p>;
  }

  return (
    <div className="space-y-4">
      <PilotHandoffItems title="Rollback" items={rollback} emptyCopy="Chưa có hướng dẫn rollback." />
      <PilotHandoffItems title="School handoff" items={schoolHandoff} emptyCopy="Chưa có metadata handoff cho trường." />
    </div>
  );
}

function PilotHandoffItems({
  title,
  items,
  emptyCopy,
}: {
  title?: string;
  items: PilotHandoffItem[];
  emptyCopy: string;
}) {
  if (items.length === 0) {
    return <p className="rounded-2xl bg-secondary p-4 text-body">{emptyCopy}</p>;
  }

  return (
    <div className="space-y-3">
      {title ? <h3 className="text-label font-semibold text-accent">{title}</h3> : null}
      {items.map((item) => (
        <article key={item.key} className="rounded-2xl border border-[#D7EFE8] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">{item.label}</h4>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-2 text-body">{item.guidance}</p>
          {item.command ? <p className="mt-2 rounded-2xl bg-secondary px-3 py-2 text-label">{item.command}</p> : null}
        </article>
      ))}
    </div>
  );
}

function DemoSeedPanel({ demoSeed }: { demoSeed: DemoSeedSummary }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-secondary p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={demoSeed.status} />
          <p className="text-body">{demoSeed.summary}</p>
        </div>
        {demoSeed.remediation ? <p className="mt-2 text-label">{demoSeed.remediation}</p> : null}
        <p className="mt-3 text-label">
          ALLOW_DEMO_SEED: {demoSeed.allow_demo_seed ? "enabled" : "disabled"} · Active demo links:{" "}
          {demoSeed.active_link_count}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {demoSeed.roles.map((role) => (
          <article key={role.role} className="rounded-2xl border border-[#D7EFE8] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{role.role}</h3>
              <StatusBadge status={role.present && role.active && role.is_demo ? "pass" : "fail"} />
            </div>
            <p className="mt-2 break-all text-label">{role.account_key}</p>
            <p className="mt-2 text-label">
              Present: {role.present ? "yes" : "no"} · Active: {role.active ? "yes" : "no"} · Demo:{" "}
              {role.is_demo ? "yes" : "no"}
            </p>
          </article>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard title="Self-checks" value={demoSeed.published_self_check_count} description="Published demo tests." />
        <MetricCard title="Scenarios" value={demoSeed.published_scenario_count} description="Published demo scenarios." />
        <MetricCard title="Mood configs" value={demoSeed.published_mood_config_count} description="Published demo config." />
        <MetricCard title="v1.4 policy" value={demoSeed.v1_4_policy_count} description="Demo policy defaults." />
        <MetricCard title="v1.4 consent" value={demoSeed.v1_4_preference_count} description="Demo reminder preference state." />
        <MetricCard title="v1.4 reminders" value={demoSeed.v1_4_reminder_state_count} description="Demo reminder state." />
        <MetricCard title="v1.4 shares" value={demoSeed.v1_4_share_count} description="Demo share metadata." />
      </div>
    </div>
  );
}

function RuntimeModePanel({ runtime }: { runtime: RuntimeModeSummary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <MetricCard title="Runtime" value={runtime.mode} description="Mode sản phẩm đang cấu hình." />
      <MetricCard title="Demo runtime" value={runtime.is_demo_runtime ? "yes" : "no"} description="Cho phép hành vi demo." />
      <MetricCard title="Production pilot" value={runtime.production_pilot ? "yes" : "no"} description="Yêu cầu cấu hình pilot an toàn." />
      <MetricCard
        title="Demo gates"
        value={runtime.demo_seed_allowed || runtime.demo_login_allowed ? "enabled" : "disabled"}
        description="Demo seed/login policy metadata."
      />
    </div>
  );
}

function ConnectivityPanel({ connectivity }: { connectivity: ConnectivitySummary }) {
  return (
    <div className="space-y-3 rounded-2xl bg-secondary p-4 text-body">
      <p>
        <span className="font-semibold">Frontend origin kind:</span> {connectivity.frontend_origin_kind}
      </p>
      <p>
        <span className="font-semibold">Allowed origins:</span> {connectivity.allowed_origin_count} · Local{" "}
        {connectivity.has_local_origin ? "yes" : "no"} · HTTPS only {connectivity.all_origins_https ? "yes" : "no"}
      </p>
      <p>
        <span className="font-semibold">Health paths:</span> {connectivity.health_live_path} ·{" "}
        {connectivity.health_ready_path}
      </p>
      <p>
        <span className="font-semibold">Session cookie metadata:</span> Secure{" "}
        {connectivity.session_cookie_secure ? "on" : "off"} · SameSite {connectivity.session_cookie_samesite}
      </p>
      <p className="text-label">
        Credentialed methods: {connectivity.credentialed_cors_methods.join(", ")}. Không hiển thị cookie value hoặc
        secret.
      </p>
    </div>
  );
}

function AuthProviderPanel({ provider }: { provider: AuthProviderReadinessSummary | null }) {
  if (!provider) {
    return (
      <div className="rounded-2xl bg-secondary p-4">
        <h3 className="text-label font-semibold">Chưa có metadata danh tính.</h3>
        <p className="mt-2 text-body">Hãy kiểm tra cấu hình provider và tải lại trang vận hành.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-secondary p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={provider.status} />
        <h3 className="font-semibold">{provider.provider_label}</h3>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <p className="text-body">
          <span className="font-semibold">Mode:</span> {provider.mode}
        </p>
        <p className="text-body">
          <span className="font-semibold">Enabled:</span> {provider.enabled ? "yes" : "no"}
        </p>
        {provider.provider_key ? (
          <p className="text-body">
            <span className="font-semibold">Provider key:</span> {provider.provider_key}
          </p>
        ) : null}
        {provider.last_check_status ? (
          <p className="text-body">
            <span className="font-semibold">Last check:</span> {provider.last_check_status}
          </p>
        ) : null}
      </div>
      {provider.remediation ? <p className="mt-3 text-label">{provider.remediation}</p> : null}
    </div>
  );
}

function IdentityMappingPanel({
  mappings,
  buckets,
}: {
  mappings: IdentityMappingOperationsSummary | null;
  buckets: OperationCountBucket[];
}) {
  return (
    <div className="space-y-4">
      <BucketList
        buckets={buckets}
        emptyCopy="Chưa có metadata liên kết danh tính. Không có tài khoản nào được tự động cấp quyền từ claim bên ngoài."
      />
      <IdentityMappingMetrics mappings={mappings} />
      {(mappings?.pending_review_count ?? 0) > 0 ? (
        <p className="rounded-2xl bg-secondary p-4 text-body">
          Một số liên kết danh tính đang chờ duyệt. Không có tài khoản nào được tự động cấp quyền.
        </p>
      ) : null}
    </div>
  );
}

function IdentityMappingMetrics({ mappings }: { mappings: IdentityMappingOperationsSummary | null }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <MetricCard title="Pending review" value={mappings?.pending_review_count ?? 0} description="Liên kết cần duyệt." />
      <MetricCard title="Disabled" value={mappings?.disabled_count ?? 0} description="Liên kết đã tắt." />
      <MetricCard title="Deprovisioned" value={mappings?.deprovisioned_count ?? 0} description="Liên kết đã thu hồi." />
    </div>
  );
}

function SessionAuthPanel({
  methodBuckets,
  providerBuckets,
}: {
  methodBuckets: SessionAuthOperationsSummary["by_auth_method"];
  providerBuckets: SessionAuthOperationsSummary["by_provider"];
}) {
  return (
    <div className="space-y-4">
      <BucketList
        title="Phương thức đăng nhập"
        buckets={methodBuckets}
        emptyCopy="Chưa có metadata session theo phương thức đăng nhập."
      />
      <BucketList title="Provider" buckets={providerBuckets} emptyCopy="Chưa có metadata session theo phương thức đăng nhập." />
      <p className="rounded-2xl bg-secondary p-4 text-body">
        Session vẫn dùng cookie HttpOnly do backend sở hữu; UI không đọc hoặc lưu access token.
      </p>
    </div>
  );
}

function SmokeChecklist({ items }: { items: ProductionSmokeChecklistItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.key} className="rounded-2xl border border-[#D7EFE8] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{item.label}</h3>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-2 text-body">{item.evidence}</p>
          {item.command ? <p className="mt-2 rounded-2xl bg-secondary px-3 py-2 text-label">{item.command}</p> : null}
          {item.remediation ? <p className="mt-2 text-label">{item.remediation}</p> : null}
        </article>
      ))}
    </div>
  );
}

function DeploymentGuardrailsPanel({ items }: { items: DeploymentGuardrailItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-secondary p-4">
        <h3 className="text-label font-semibold">Chưa có kết quả guardrail.</h3>
        <p className="mt-2 text-body">Hãy chạy guardrail hoặc smoke command rồi kiểm tra lại metadata vận hành.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <article key={item.key} className="rounded-2xl border border-[#D7EFE8] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{item.key}</h3>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-2 text-label">{item.category}</p>
          <p className="mt-2 text-body">{item.evidence}</p>
          {item.command ? <p className="mt-2 rounded-2xl bg-secondary px-3 py-2 text-label">{item.command}</p> : null}
          {item.remediation ? <p className="mt-2 text-label">{item.remediation}</p> : null}
        </article>
      ))}
    </div>
  );
}

function SmokeProfilesPanel({ profiles }: { profiles: SmokeProfileItem[] }) {
  if (profiles.length === 0) {
    return (
      <div className="rounded-2xl bg-secondary p-4">
        <h3 className="text-label font-semibold">Chưa có kết quả guardrail.</h3>
        <p className="mt-2 text-body">Hãy chạy guardrail hoặc smoke command rồi kiểm tra lại metadata vận hành.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {profiles.map((profile) => (
        <article key={profile.key} className="rounded-2xl border border-[#D7EFE8] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{profile.label}</h3>
            <StatusBadge status={profile.status} />
          </div>
          {profile.key === "pilot_smoke" ? (
            <p className="mt-2 text-body">
              Production pilot smoke yêu cầu readiness ready và không phụ thuộc tài khoản demo hoặc dữ liệu walkthrough.
            </p>
          ) : (
            <p className="mt-2 text-body">
              Dùng tài khoản demo đã seed để kiểm tra landing, đăng nhập theo vai trò và dashboard public demo.
            </p>
          )}
          <p className="mt-2 text-label">
            Uses demo accounts: {profile.uses_demo_accounts ? "yes" : "no"} · Requires readiness ready:{" "}
            {profile.requires_readiness_ready ? "yes" : "no"}
          </p>
          <p className="mt-2 text-body">{profile.evidence}</p>
          <p className="mt-2 rounded-2xl bg-secondary px-3 py-2 text-label">{profile.command}</p>
          {profile.remediation ? <p className="mt-2 text-label">{profile.remediation}</p> : null}
        </article>
      ))}
    </div>
  );
}

function MetricCard({ title, value, description }: { title: string; value: string | number; description: string }) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-label font-semibold text-accent">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-3 text-body">{description}</p>
    </article>
  );
}

function Panel({
  title,
  description,
  children,
  testId,
}: {
  title: string;
  description: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm" data-testid={testId}>
      <div>
        <h2 className="text-heading">{title}</h2>
        <p className="mt-2 text-body">{description}</p>
      </div>
      {children}
    </section>
  );
}

function BucketList({
  title,
  buckets,
  emptyCopy = "Chưa có dữ liệu.",
}: {
  title?: string;
  buckets: OperationCountBucket[];
  emptyCopy?: string;
}) {
  return (
    <div className="rounded-2xl bg-secondary p-4">
      {title ? <h3 className="text-label font-semibold">{title}</h3> : null}
      {buckets.length === 0 ? (
        <p className="text-body">{emptyCopy}</p>
      ) : (
        <ul className="space-y-2 text-body">
          {buckets.map((bucket) => (
            <li key={`${bucket.key}-${bucket.label}`} className="flex justify-between gap-4">
              <span>{bucket.label}</span>
              <span className="font-semibold">{bucket.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeliveryList({ deliveries }: { deliveries: SosEmailDeliveryItem[] }) {
  if (deliveries.length === 0) {
    return <p className="text-body">Chưa có attempt email SOS.</p>;
  }
  return (
    <div className="space-y-3">
      {deliveries.map((delivery) => (
        <article key={delivery.delivery_key} className="rounded-2xl border border-[#D7EFE8] p-4">
          <p className="font-semibold">
            {delivery.provider} · {delivery.status} · {delivery.recipient_role}
          </p>
          <p className="mt-2 text-label">Alert: {delivery.alert_key}</p>
          <p className="text-label">Attempts: {delivery.attempt_count}</p>
          {delivery.error_code ? <p className="text-label">Error: {delivery.error_code}</p> : null}
          <p className="text-label">Tạo lúc: {formatDate(delivery.created_at)}</p>
        </article>
      ))}
    </div>
  );
}

function AuditEventCard({ event }: { event: AuditEventItem }) {
  return (
    <article className="rounded-2xl border border-[#D7EFE8] p-4">
      <p className="font-semibold">
        {event.action} · {event.status}
      </p>
      <p className="mt-2 text-label">
        {event.actor_role} · {event.resource_type} · {formatDate(event.timestamp)}
      </p>
      <p className="mt-2 text-body">{metadataText(event.metadata_summary)}</p>
    </article>
  );
}

