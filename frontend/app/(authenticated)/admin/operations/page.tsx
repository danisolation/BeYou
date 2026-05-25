"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";

import {
  type AdminOperationsDashboard,
  type AdminOperationsFilters,
  type AuditEventItem,
  type ConnectivitySummary,
  type DemoSeedSummary,
  type DeploymentGuardrailItem,
  getAdminOperationsDashboard,
  type OperationCountBucket,
  type ProductionSmokeChecklistItem,
  type RuntimeModeSummary,
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

function formatDate(value: string | null) {
  if (!value) {
    return "Chưa có";
  }
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function metadataText(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata);
  if (entries.length === 0) {
    return "Không có metadata bổ sung.";
  }
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(" · ");
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
          setError("Chưa tải được dữ liệu vận hành. Hãy thử lại từ cổng quản trị.");
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
        <p className="text-label font-semibold text-accent">Vận hành an toàn</p>
        <h1 className="mt-2 text-display">Vận hành metadata-only</h1>
        <p className="mt-3 max-w-3xl text-body">
          Theo dõi readiness, gửi email SOS và audit vận hành bằng metadata. Trang này không mở nội dung riêng tư của học sinh.
        </p>
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
          Không có xuất dữ liệu thô, không có danh sách học sinh theo nguy cơ, không có drilldown hồ sơ học sinh.
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

      {isLoading ? <p className="rounded-3xl bg-white p-6 shadow-sm">Đang tải dữ liệu vận hành...</p> : null}
      {error ? <p className="rounded-3xl bg-white p-6 text-red-700 shadow-sm">{error}</p> : null}

      {dashboard ? (
        <>
          <Panel
            title="Deployment guardrails"
            description="Kiểm tra Render, Vercel, API target, CORS và cookie bằng metadata an toàn."
          >
            <DeploymentGuardrailsPanel items={dashboard.deployment_guardrails} />
          </Panel>
          <Panel
            title="Smoke profiles"
            description="Tách smoke public demo khỏi production pilot để không tạo tự tin sai từ tài khoản demo."
          >
            <SmokeProfilesPanel profiles={dashboard.smoke_profiles} />
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
  if (status === "pass" || status === "covered") {
    return "border-accent bg-secondary text-accent-dark";
  }
  if (status === "warn") {
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
      <p className="mt-2 text-display">{value}</p>
      <p className="mt-3 text-body">{description}</p>
    </article>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
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

