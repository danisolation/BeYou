"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Activity, ShieldCheck, Filter, ChevronDown, ChevronUp } from "lucide-react";

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
  const [showFilters, setShowFilters] = useState(false);

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
      <header className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity size={18} />
          </div>
          <h1 className="text-lg font-semibold text-on-background">Vận hành Pilot</h1>
        </div>
        <p className="mt-3 text-sm text-on-background/70">
          Kiểm tra sẵn sàng, bộ lọc audit và trạng thái hệ thống. Chỉ metadata, không mở nội dung riêng tư.
        </p>
        <p className="mt-2 text-xs text-on-background/50">Cập nhật lần cuối: {generatedAt}</p>
      </header>

      {/* Compact privacy notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-xs text-on-background/70">
          <span className="font-semibold text-primary">An toàn:</span> Trang này chỉ hiển thị metadata tổng hợp. Không có ghi chú SOS, câu trả lời, email hay secret nào được hiển thị.
        </p>
      </div>

      {/* Filter - collapsible */}
      <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940]">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex w-full items-center justify-between p-5 text-sm font-semibold text-on-background"
        >
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-primary" />
            Bộ lọc Audit
          </div>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showFilters && (
        <form className="grid gap-4 border-t border-outline-variant/20 p-5 md:grid-cols-3" onSubmit={applyFilters}>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Từ thời điểm
          <input
            aria-label="Từ thời điểm"
            type="datetime-local"
            value={draftFilters.startAt}
            onChange={(event) => updateFilter("startAt", event.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background"
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Đến thời điểm
          <input
            aria-label="Đến thời điểm"
            type="datetime-local"
            value={draftFilters.endAt}
            onChange={(event) => updateFilter("endAt", event.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background"
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Vai trò người thực hiện
          <select
            aria-label="Vai trò người thực hiện"
            value={draftFilters.actorRole}
            onChange={(event) => updateFilter("actorRole", event.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Loại hành động
          <input
            aria-label="Loại hành động"
            value={draftFilters.actionType}
            onChange={(event) => updateFilter("actionType", event.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background placeholder:text-on-background/40"
            placeholder="vd: account_status_changed"
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Loại mục tiêu
          <input
            aria-label="Loại mục tiêu"
            value={draftFilters.targetType}
            onChange={(event) => updateFilter("targetType", event.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background placeholder:text-on-background/40"
            placeholder="vd: account_profile"
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-on-background/70">
          Trạng thái audit
          <input
            aria-label="Trạng thái audit"
            value={draftFilters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background placeholder:text-on-background/40"
            placeholder="vd: success"
          />
        </label>
        <button type="submit" className="min-h-11 rounded-xl bg-primary px-4 font-semibold text-white hover:bg-primary/90 transition-colors md:col-span-3">
          Áp dụng bộ lọc
        </button>
        </form>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
                <div className="h-3 w-16 rounded bg-on-background/10" />
                <div className="mt-3 h-7 w-12 rounded bg-on-background/10" />
                <div className="mt-3 h-3 w-24 rounded bg-on-background/10" />
              </div>
            ))}
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
              <div className="h-4 w-40 rounded bg-on-background/10" />
              <div className="mt-3 h-3 w-64 rounded bg-on-background/10" />
              <div className="mt-4 h-20 w-full rounded-xl bg-on-background/5" />
            </div>
          ))}
        </div>
      ) : null}
      {error ? <p className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-5 text-sm text-red-700 dark:text-red-300">{error}</p> : null}

      {dashboard ? (
        <>
          {/* === NHÓM 1: TRẠNG THÁI TỔNG QUAN === */}
          <SectionHeader label="Trạng thái tổng quan" />

          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="Readiness" value={dashboard.readiness.status} description="Trạng thái vận hành." />
            <MetricCard title="Demo seed" value={dashboard.demo_seed.status} description="Tài khoản demo." />
            <MetricCard title="Email SOS" value={dashboard.sos_email.total} description="Tổng attempt." />
            <MetricCard title="Audit events" value={dashboard.audit.total_matching} description="Khớp bộ lọc." />
          </div>

          <Panel
            title="Trạng thái launch pilot"
            description="Suy ra từ checklist metadata."
            testId="pilot-launch-status"
          >
            <PilotLaunchStatusPanel summary={dashboard.pilot_launch ?? null} />
          </Panel>
          <Panel
            title="Checklist trước khi mở"
            description="Điều kiện runtime, readiness, guardrail, smoke."
            testId="pilot-launch-checklist"
          >
            <PilotLaunchChecklistPanel checklist={dashboard.pilot_launch?.checklist ?? []} />
          </Panel>
          <Panel
            title="An toàn dữ liệu Demo/Thật"
            description="Đếm tổng hợp để tránh phụ thuộc demo khi mở pilot."
            testId="pilot-data-safety"
          >
            <PilotDataSafetyPanel summary={dashboard.pilot_data_safety ?? null} />
          </Panel>

          {/* === NHÓM 2: CẤU HÌNH & TRIỂN KHAI === */}
          <SectionHeader label="Cấu hình & Triển khai" />

          <Panel
            title="Thiết lập ban đầu"
            description="Nội dung, policy và reminder cần sẵn sàng trước onboarding."
            testId="pilot-baseline-setup"
          >
            <PilotHandoffItems
              items={dashboard.pilot_handoff?.baseline_setup ?? []}
              emptyCopy="Chưa có metadata thiết lập. Hãy xác nhận nội dung và cấu hình pilot trước khi mở."
            />
          </Panel>

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="Chế độ vận hành" description="Mode sản phẩm và chính sách demo/pilot.">
              <RuntimeModePanel runtime={dashboard.runtime} />
            </Panel>
            <Panel title="Kết nối hệ thống" description="Frontend/backend, CORS và cookie session.">
              <ConnectivityPanel connectivity={dashboard.connectivity} />
            </Panel>
          </section>

          <Panel
            title="Guardrails triển khai"
            description="Kiểm tra Render, Vercel, API target, CORS và cookie."
          >
            <DeploymentGuardrailsPanel items={dashboard.deployment_guardrails ?? []} />
          </Panel>

          {/* === NHÓM 3: TÀI KHOẢN & ĐĂNG NHẬP === */}
          <SectionHeader label="Tài khoản & Đăng nhập" />

          <Panel title="Tài khoản demo" description="Kiểm tra vai trò demo, liên kết hỗ trợ và nội dung seed.">
            <DemoSeedPanel demoSeed={dashboard.demo_seed} />
          </Panel>

          <Panel
            title="Xác thực đăng nhập ngoài"
            description="Cấu hình provider đăng nhập (không hiển thị secret)."
          >
            <AuthProviderPanel provider={dashboard.auth_provider ?? null} />
          </Panel>

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Liên kết danh tính"
              description="Trạng thái liên kết tài khoản ngoài."
            >
              <IdentityMappingPanel
                mappings={dashboard.identity_mappings ?? null}
                buckets={dashboard.identity_mappings?.by_status ?? []}
              />
            </Panel>
            <Panel
              title="Phương thức đăng nhập"
              description="Phân bổ session theo phương thức và provider."
            >
              <SessionAuthPanel
                methodBuckets={dashboard.session_auth?.by_auth_method ?? []}
                providerBuckets={dashboard.session_auth?.by_provider ?? []}
              />
            </Panel>
          </section>

          {/* === NHÓM 4: KIỂM TRA & AUDIT === */}
          <SectionHeader label="Kiểm tra & Audit" />

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="Kiểm tra Readiness" description="Key, trạng thái và hướng xử lý.">
              <BucketList buckets={dashboard.readiness.checks_by_status} />
              {dashboard.readiness.attention_checks.length === 0 ? (
                <p className="mt-3 text-sm text-on-background/60">✓ Không có cảnh báo cần chú ý.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {dashboard.readiness.attention_checks.map((check) => (
                    <article key={check.key} className="rounded-2xl bg-primary/5 p-4">
                      <p className="font-semibold">
                        {check.key} · {check.status}
                      </p>
                      <p className="mt-2 text-sm">{check.summary}</p>
                      {check.remediation ? <p className="mt-2 text-xs">{check.remediation}</p> : null}
                    </article>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Email SOS" description="Trạng thái gửi email (không hiển thị email người nhận).">
              <BucketList buckets={dashboard.sos_email.by_status} />
              <BucketList title="Provider" buckets={dashboard.sos_email.by_provider} />
              <BucketList title="Mã lỗi" buckets={dashboard.sos_email.by_error_code} emptyCopy="Không có lỗi." />
              <DeliveryList deliveries={dashboard.sos_email.recent} />
            </Panel>
          </section>

          <Panel title="Smoke profiles" description="Tách smoke demo khỏi production pilot.">
            <SmokeProfilesPanel profiles={dashboard.smoke_profiles ?? []} />
          </Panel>

          <Panel title="Smoke checklist" description="Các bước kiểm tra production không xuất secret.">
            <SmokeChecklist items={dashboard.production_smoke} />
          </Panel>

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="Audit v1.2" description="Support plan, mood, adult summary.">
              <BucketList buckets={dashboard.v1_2_audit ?? []} emptyCopy="Chưa có audit v1.2." />
            </Panel>
            <Panel title="Audit v1.4" description="Consent, reminders, note sharing, policy.">
              <BucketList buckets={dashboard.v1_4_audit ?? []} emptyCopy="Chưa có audit v1.4." />
            </Panel>
          </section>

          <Panel title="Lịch sử Audit" description="Lọc theo thời gian, vai trò, hành động và trạng thái.">
            {dashboard.audit.recent.length === 0 ? (
              <p className="text-sm text-on-background/60">Không có audit event khớp bộ lọc.</p>
            ) : (
              <div className="space-y-3">
                {dashboard.audit.recent.map((event) => (
                  <AuditEventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </Panel>

          {/* === NHÓM 5: ROLLBACK === */}
          <SectionHeader label="Rollback & Bàn giao" />

          <Panel
            title="Hướng dẫn rollback"
            description="Metadata tĩnh, không lưu contact details."
            testId="pilot-handoff-guidance"
          >
            <PilotHandoffPanel handoff={dashboard.pilot_handoff ?? null} />
          </Panel>
        </>
      ) : null}
    </section>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-on-background/50">{label}</h2>
      <div className="h-px flex-1 bg-outline-variant/30" />
    </div>
  );
}

function statusClass(status: string) {
  if (status === "ready" || status === "safe" || status === "pass" || status === "covered") {
    return "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "needs_review" || status === "warn") {
    return "border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200";
  }
  return "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(status)}`}>
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
    <div className="rounded-2xl bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        <p className="text-sm">{pilotLaunchCopy(status)}</p>
      </div>
      {summary?.generated_at ? <p className="mt-3 text-xs">Cập nhật checklist: {formatDate(summary.generated_at)}</p> : null}
    </div>
  );
}

function PilotLaunchChecklistPanel({ checklist }: { checklist: PilotLaunchChecklistItem[] }) {
  if (checklist.length === 0) {
    return <p className="rounded-2xl bg-primary/5 p-4 text-sm">Chưa có checklist pilot. Hãy kiểm tra readiness và tải lại trang vận hành.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {checklist.map((item) => (
        <article key={item.key} className="rounded-2xl border border-outline-variant/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{item.label}</h3>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-2 text-xs">Blocking: {item.blocking ? "yes" : "no"}</p>
          <p className="mt-2 text-sm">{item.evidence}</p>
          {item.command ? <p className="mt-2 rounded-2xl bg-primary/5 px-3 py-2 text-xs">{item.command}</p> : null}
          {item.remediation ? <p className="mt-2 text-xs">{item.remediation}</p> : null}
        </article>
      ))}
    </div>
  );
}

function PilotDataSafetyPanel({ summary }: { summary: PilotDataSafetySummary | null }) {
  const buckets = summary?.buckets ?? [];
  if (buckets.length === 0) {
    return <p className="rounded-2xl bg-primary/5 p-4 text-sm">Chưa có metadata an toàn dữ liệu pilot. Không có dữ liệu thô được hiển thị.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary/5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={summary?.status ?? "needs_review"} />
          <p className="text-sm">Tổng hợp demo/real data safety bằng count metadata.</p>
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
    <article className="rounded-2xl border border-outline-variant/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{bucket.label}</h3>
        <StatusBadge status={bucket.status} />
      </div>
      <p className="mt-2 text-2xl font-bold">{bucket.count}</p>
      <p className="mt-2 text-xs">Blocking: {bucket.blocking ? "yes" : "no"}</p>
      <p className="mt-2 text-sm">{bucket.evidence}</p>
      {bucket.remediation ? <p className="mt-2 text-xs">{bucket.remediation}</p> : null}
    </article>
  );
}

function PilotHandoffPanel({ handoff }: { handoff: PilotHandoffSummary | null }) {
  const rollback = handoff?.rollback ?? [];
  const schoolHandoff = handoff?.school_handoff ?? [];
  if (rollback.length === 0 && schoolHandoff.length === 0) {
    return <p className="rounded-2xl bg-primary/5 p-4 text-sm">Chưa có hướng dẫn handoff. Hãy dùng quy trình rollback an toàn trong README và kiểm tra lại readiness.</p>;
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
    return <p className="rounded-2xl bg-primary/5 p-4 text-sm">{emptyCopy}</p>;
  }

  return (
    <div className="space-y-3">
      {title ? <h3 className="text-xs font-semibold text-primary">{title}</h3> : null}
      {items.map((item) => (
        <article key={item.key} className="rounded-2xl border border-outline-variant/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">{item.label}</h4>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-2 text-sm">{item.guidance}</p>
          {item.command ? <p className="mt-2 rounded-2xl bg-primary/5 px-3 py-2 text-xs">{item.command}</p> : null}
        </article>
      ))}
    </div>
  );
}

function DemoSeedPanel({ demoSeed }: { demoSeed: DemoSeedSummary }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary/5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={demoSeed.status} />
          <p className="text-sm">{demoSeed.summary}</p>
        </div>
        {demoSeed.remediation ? <p className="mt-2 text-xs">{demoSeed.remediation}</p> : null}
        <p className="mt-3 text-xs">
          ALLOW_DEMO_SEED: {demoSeed.allow_demo_seed ? "enabled" : "disabled"} · Active demo links:{" "}
          {demoSeed.active_link_count}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {demoSeed.roles.map((role) => (
          <article key={role.role} className="rounded-2xl border border-outline-variant/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{role.role}</h3>
              <StatusBadge status={role.present && role.active && role.is_demo ? "pass" : "fail"} />
            </div>
            <p className="mt-2 break-all text-xs">{role.account_key}</p>
            <p className="mt-2 text-xs">
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
    <div className="space-y-3 rounded-2xl bg-primary/5 p-4 text-sm">
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
      <p className="text-xs">
        Credentialed methods: {connectivity.credentialed_cors_methods.join(", ")}. Không hiển thị cookie value hoặc
        secret.
      </p>
    </div>
  );
}

function AuthProviderPanel({ provider }: { provider: AuthProviderReadinessSummary | null }) {
  if (!provider) {
    return (
      <div className="rounded-2xl bg-primary/5 p-4">
        <h3 className="text-xs font-semibold">Chưa có metadata danh tính.</h3>
        <p className="mt-2 text-sm">Hãy kiểm tra cấu hình provider và tải lại trang vận hành.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={provider.status} />
        <h3 className="font-semibold">{provider.provider_label}</h3>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <p className="text-sm">
          <span className="font-semibold">Mode:</span> {provider.mode}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Enabled:</span> {provider.enabled ? "yes" : "no"}
        </p>
        {provider.provider_key ? (
          <p className="text-sm">
            <span className="font-semibold">Provider key:</span> {provider.provider_key}
          </p>
        ) : null}
        {provider.last_check_status ? (
          <p className="text-sm">
            <span className="font-semibold">Last check:</span> {provider.last_check_status}
          </p>
        ) : null}
      </div>
      {provider.remediation ? <p className="mt-3 text-xs">{provider.remediation}</p> : null}
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
        <p className="rounded-2xl bg-primary/5 p-4 text-sm">
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
      <p className="rounded-2xl bg-primary/5 p-4 text-sm">
        Session vẫn dùng cookie HttpOnly do backend sở hữu; UI không đọc hoặc lưu access token.
      </p>
    </div>
  );
}

function SmokeChecklist({ items }: { items: ProductionSmokeChecklistItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.key} className="rounded-2xl border border-outline-variant/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{item.label}</h3>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-2 text-sm">{item.evidence}</p>
          {item.command ? <p className="mt-2 rounded-2xl bg-primary/5 px-3 py-2 text-xs">{item.command}</p> : null}
          {item.remediation ? <p className="mt-2 text-xs">{item.remediation}</p> : null}
        </article>
      ))}
    </div>
  );
}

function DeploymentGuardrailsPanel({ items }: { items: DeploymentGuardrailItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-primary/5 p-4">
        <h3 className="text-xs font-semibold">Chưa có kết quả guardrail.</h3>
        <p className="mt-2 text-sm">Hãy chạy guardrail hoặc smoke command rồi kiểm tra lại metadata vận hành.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <article key={item.key} className="rounded-2xl border border-outline-variant/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{item.key}</h3>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-2 text-xs">{item.category}</p>
          <p className="mt-2 text-sm">{item.evidence}</p>
          {item.command ? <p className="mt-2 rounded-2xl bg-primary/5 px-3 py-2 text-xs">{item.command}</p> : null}
          {item.remediation ? <p className="mt-2 text-xs">{item.remediation}</p> : null}
        </article>
      ))}
    </div>
  );
}

function SmokeProfilesPanel({ profiles }: { profiles: SmokeProfileItem[] }) {
  if (profiles.length === 0) {
    return (
      <div className="rounded-2xl bg-primary/5 p-4">
        <h3 className="text-xs font-semibold">Chưa có kết quả guardrail.</h3>
        <p className="mt-2 text-sm">Hãy chạy guardrail hoặc smoke command rồi kiểm tra lại metadata vận hành.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {profiles.map((profile) => (
        <article key={profile.key} className="rounded-2xl border border-outline-variant/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{profile.label}</h3>
            <StatusBadge status={profile.status} />
          </div>
          {profile.key === "pilot_smoke" ? (
            <p className="mt-2 text-sm">
              Production pilot smoke yêu cầu readiness ready và không phụ thuộc tài khoản demo hoặc dữ liệu walkthrough.
            </p>
          ) : (
            <p className="mt-2 text-sm">
              Dùng tài khoản demo đã seed để kiểm tra landing, đăng nhập theo vai trò và dashboard public demo.
            </p>
          )}
          <p className="mt-2 text-xs">
            Uses demo accounts: {profile.uses_demo_accounts ? "yes" : "no"} · Requires readiness ready:{" "}
            {profile.requires_readiness_ready ? "yes" : "no"}
          </p>
          <p className="mt-2 text-sm">{profile.evidence}</p>
          <p className="mt-2 rounded-2xl bg-primary/5 px-3 py-2 text-xs">{profile.command}</p>
          {profile.remediation ? <p className="mt-2 text-xs">{profile.remediation}</p> : null}
        </article>
      ))}
    </div>
  );
}

function MetricCard({ title, value, description }: { title: string; value: string | number; description: string }) {
  return (
    <article className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5 transition-colors hover:border-primary/30">
      <p className="text-xs font-semibold text-primary">{title}</p>
      <p className="mt-2 text-2xl font-bold text-on-background">{value}</p>
      <p className="mt-2 text-xs text-on-background/60">{description}</p>
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
    <section className="space-y-4 rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5 sm:p-6" data-testid={testId}>
      <div>
        <h2 className="text-sm font-semibold text-on-background">{title}</h2>
        <p className="mt-1 text-xs text-on-background/60">{description}</p>
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
    <div className="rounded-2xl bg-primary/5 p-4">
      {title ? <h3 className="text-xs font-semibold">{title}</h3> : null}
      {buckets.length === 0 ? (
        <p className="text-sm">{emptyCopy}</p>
      ) : (
        <ul className="space-y-2 text-sm">
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
    return <p className="text-sm">Chưa có attempt email SOS.</p>;
  }
  return (
    <div className="space-y-3">
      {deliveries.map((delivery) => (
        <article key={delivery.delivery_key} className="rounded-2xl border border-outline-variant/20 p-4">
          <p className="font-semibold">
            {delivery.provider} · {delivery.status} · {delivery.recipient_role}
          </p>
          <p className="mt-2 text-xs">Alert: {delivery.alert_key}</p>
          <p className="text-xs">Attempts: {delivery.attempt_count}</p>
          {delivery.error_code ? <p className="text-xs">Error: {delivery.error_code}</p> : null}
          <p className="text-xs">Tạo lúc: {formatDate(delivery.created_at)}</p>
        </article>
      ))}
    </div>
  );
}

function AuditEventCard({ event }: { event: AuditEventItem }) {
  return (
    <article className="rounded-2xl border border-outline-variant/20 bg-white dark:bg-[#1e2d40] p-4 transition-colors hover:border-outline-variant/40">
      <p className="font-semibold text-on-background">
        {event.action} · {event.status}
      </p>
      <p className="mt-1 text-xs text-on-background/50">
        {event.actor_role} · {event.resource_type} · {formatDate(event.timestamp)}
      </p>
      <p className="mt-2 text-xs text-on-background/70">{metadataText(event.metadata_summary)}</p>
    </article>
  );
}

