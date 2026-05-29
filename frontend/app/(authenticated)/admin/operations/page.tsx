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
const safeMetadataFallback = "dữ liệu tổng hợp an toàn";

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
    return "Không có dữ liệu tổng hợp bổ sung.";
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
          setError("Chưa tải được dữ liệu tổng hợp của phần thử nghiệm. Hãy thử lại từ cổng quản trị hoặc kiểm tra mức sẵn sàng của hệ thống.");
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
    <section className="space-y-6 pb-20 md:pb-0">
      <header className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity size={18} />
          </div>
          <h1 className="text-lg font-semibold text-on-background">Vận hành thử nghiệm</h1>
        </div>
        <p className="mt-3 text-sm text-on-background/70">
          Kiểm tra mức sẵn sàng, bộ lọc rà soát và trạng thái hệ thống. Chỉ dữ liệu tổng hợp, không mở nội dung riêng tư.
        </p>
        <p className="mt-2 text-xs text-on-background/50">Cập nhật lần cuối: {generatedAt}</p>
      </header>

      {/* Compact privacy notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-xs text-on-background/70">
          <span className="font-semibold text-primary">An toàn:</span> Trang này chỉ hiển thị dữ liệu tổng hợp. Không có ghi chú SOS, câu trả lời, email hay thông tin nhạy cảm nào được hiển thị.
        </p>
      </div>

      {/* Filter - collapsible */}
      <div className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940]">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="btn-press flex w-full items-center justify-between p-5 text-sm font-semibold text-on-background"
        >
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-primary" />
            Bộ lọc rà soát
          </div>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showFilters && (
        <form className="grid grid-cols-1 gap-4 border-t border-outline-variant/20 p-5 sm:grid-cols-2 xl:grid-cols-3" onSubmit={applyFilters}>
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
          Trạng thái rà soát
          <input
            aria-label="Trạng thái rà soát"
            value={draftFilters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="min-h-11 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm text-on-background placeholder:text-on-background/40"
            placeholder="vd: success"
          />
        </label>
        <button type="submit" className="btn-press min-h-11 w-full rounded-xl bg-primary px-4 font-semibold text-white transition-colors hover:bg-primary/90 sm:w-auto xl:col-span-3">
          Áp dụng bộ lọc
        </button>
        </form>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
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

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <MetricCard title="Sẵn sàng" value={displayStatus(dashboard.readiness.status)} description="Trạng thái vận hành." />
            <MetricCard title="Dữ liệu mẫu" value={displayStatus(dashboard.demo_seed.status)} description="Tài khoản mẫu." />
            <MetricCard title="Email SOS" value={dashboard.sos_email.total} description="Tổng số lần gửi thử." />
            <MetricCard title="Sự kiện rà soát" value={dashboard.audit.total_matching} description="Khớp bộ lọc." />
          </div>

          <Panel
            title="Trạng thái mở thử nghiệm"
            description="Được tổng hợp từ danh sách kiểm tra."
            testId="pilot-launch-status"
          >
            <PilotLaunchStatusPanel summary={dashboard.pilot_launch ?? null} />
          </Panel>
          <Panel
            title="Checklist trước khi mở"
            description="Điều kiện vận hành, mức sẵn sàng, lớp bảo vệ và kiểm tra nhanh."
            testId="pilot-launch-checklist"
          >
            <PilotLaunchChecklistPanel checklist={dashboard.pilot_launch?.checklist ?? []} />
          </Panel>
          <Panel
            title="An toàn dữ liệu mẫu/thực tế"
            description="Số liệu tổng hợp để tránh phụ thuộc dữ liệu mẫu khi mở thử nghiệm."
            testId="pilot-data-safety"
          >
            <PilotDataSafetyPanel summary={dashboard.pilot_data_safety ?? null} />
          </Panel>

          {/* === NHÓM 2: CẤU HÌNH & TRIỂN KHAI === */}
          <SectionHeader label="Cấu hình & Triển khai" />

          <Panel
            title="Thiết lập ban đầu"
            description="Nội dung, chính sách và nhắc nhở cần sẵn sàng trước khi bắt đầu."
            testId="pilot-baseline-setup"
          >
            <PilotHandoffItems
              items={dashboard.pilot_handoff?.baseline_setup ?? []}
              emptyCopy="Chưa có dữ liệu tổng hợp về thiết lập. Hãy xác nhận nội dung và cấu hình thử nghiệm trước khi mở."
            />
          </Panel>

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="Chế độ vận hành" description="Chế độ hệ thống và chính sách dữ liệu mẫu/thử nghiệm.">
              <RuntimeModePanel runtime={dashboard.runtime} />
            </Panel>
            <Panel title="Kết nối hệ thống" description="Kết nối giao diện - hệ thống, CORS và cookie phiên.">
              <ConnectivityPanel connectivity={dashboard.connectivity} />
            </Panel>
          </section>

          <Panel
            title="Lớp bảo vệ khi triển khai"
            description="Kiểm tra Render, Vercel, đích API, CORS và cookie."
          >
            <DeploymentGuardrailsPanel items={dashboard.deployment_guardrails ?? []} />
          </Panel>

          {/* === NHÓM 3: TÀI KHOẢN & ĐĂNG NHẬP === */}
          <SectionHeader label="Tài khoản & Đăng nhập" />

          <Panel title="Tài khoản mẫu" description="Kiểm tra vai trò mẫu, kết nối hỗ trợ và dữ liệu khởi tạo.">
            <DemoSeedPanel demoSeed={dashboard.demo_seed} />
          </Panel>

          <Panel
            title="Xác thực đăng nhập ngoài"
            description="Cấu hình nguồn đăng nhập (không hiển thị thông tin nhạy cảm)."
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
              description="Phân bổ phiên đăng nhập theo phương thức và nguồn xác thực."
            >
              <SessionAuthPanel
                methodBuckets={dashboard.session_auth?.by_auth_method ?? []}
                providerBuckets={dashboard.session_auth?.by_provider ?? []}
              />
            </Panel>
          </section>

          {/* === NHÓM 4: KIỂM TRA & AUDIT === */}
          <SectionHeader label="Kiểm tra & rà soát" />

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="Kiểm tra mức sẵn sàng" description="Hạng mục, trạng thái và hướng xử lý.">
              <BucketList buckets={dashboard.readiness.checks_by_status} />
              {dashboard.readiness.attention_checks.length === 0 ? (
                <p className="mt-3 text-sm text-on-background/60">✓ Không có cảnh báo cần chú ý.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {dashboard.readiness.attention_checks.map((check) => (
                    <article key={check.key} className="rounded-2xl bg-primary/5 p-4">
                      <p className="font-semibold">
                        {check.key} · {displayStatus(check.status)}
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
              <BucketList title="Nguồn gửi" buckets={dashboard.sos_email.by_provider} />
              <BucketList title="Mã lỗi" buckets={dashboard.sos_email.by_error_code} emptyCopy="Không có lỗi." />
              <DeliveryList deliveries={dashboard.sos_email.recent} />
            </Panel>
          </section>

          <Panel title="Nhóm kiểm tra nhanh" description="Tách kiểm tra nhanh dữ liệu mẫu khỏi thử nghiệm thực tế.">
            <SmokeProfilesPanel profiles={dashboard.smoke_profiles ?? []} />
          </Panel>

          <Panel title="Danh sách kiểm tra nhanh" description="Các bước kiểm tra môi trường thật, không hiển thị thông tin nhạy cảm.">
            <SmokeChecklist items={dashboard.production_smoke} />
          </Panel>

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="Rà soát v1.2" description="Kế hoạch hỗ trợ, cảm xúc và tóm tắt cho người lớn.">
              <BucketList buckets={dashboard.v1_2_audit ?? []} emptyCopy="Chưa có dữ liệu rà soát v1.2." />
            </Panel>
            <Panel title="Rà soát v1.4" description="Đồng ý, nhắc nhở, chia sẻ ghi chú và chính sách.">
              <BucketList buckets={dashboard.v1_4_audit ?? []} emptyCopy="Chưa có dữ liệu rà soát v1.4." />
            </Panel>
          </section>

          <Panel title="Lịch sử rà soát" description="Lọc theo thời gian, vai trò, hành động và trạng thái.">
            {dashboard.audit.recent.length === 0 ? (
              <p className="text-sm text-on-background/60">Không có sự kiện rà soát nào khớp bộ lọc.</p>
            ) : (
              <div className="space-y-3">
                {dashboard.audit.recent.map((event) => (
                  <AuditEventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </Panel>

          {/* === NHÓM 5: ROLLBACK === */}
          <SectionHeader label="Khôi phục & bàn giao" />

          <Panel
            title="Hướng dẫn khôi phục"
            description="Dữ liệu tổng hợp tĩnh, không lưu thông tin liên hệ."
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

function displayStatus(status: string) {
  switch (status) {
    case "ready":
      return "Sẵn sàng";
    case "safe":
      return "An toàn";
    case "pass":
      return "Đạt";
    case "covered":
      return "Đã bao phủ";
    case "needs_review":
      return "Cần rà soát";
    case "warn":
      return "Cảnh báo";
    case "blocked":
      return "Bị chặn";
    case "disabled":
      return "Đã tắt";
    case "pending_review":
      return "Chờ duyệt";
    case "deprovisioned":
      return "Đã thu hồi";
    case "success":
      return "Thành công";
    case "fail":
      return "Không đạt";
    default:
      return status.replace(/_/g, " ");
  }
}

function yesNoText(value: boolean) {
  return value ? "Có" : "Không";
}

function onOffText(value: boolean) {
  return value ? "Bật" : "Tắt";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(status)}`}>
      {displayStatus(status)}
    </span>
  );
}

function pilotLaunchCopy(status: PilotLaunchSummary["status"]) {
  if (status === "blocked") {
    return "Thử nghiệm đang bị chặn. Hãy xử lý các mục không đạt trước khi dùng với dữ liệu học sinh thực tế.";
  }
  if (status === "ready") {
    return "Thử nghiệm đã sẵn sàng theo dữ liệu tổng hợp hiện tại. Vẫn cần xác nhận vận hành với nhà trường trước khi mở thực tế.";
  }
  return "Thử nghiệm cần rà soát thêm. Các mục cảnh báo không mở dữ liệu riêng tư nhưng cần được xác nhận trước khi triển khai.";
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
    return <p className="rounded-2xl bg-primary/5 p-4 text-sm">Chưa có danh sách kiểm tra thử nghiệm. Hãy kiểm tra mức sẵn sàng và tải lại trang vận hành.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {checklist.map((item) => (
        <article key={item.key} className="rounded-2xl border border-outline-variant/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{item.label}</h3>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-2 text-xs">Có chặn mở hay không: {yesNoText(item.blocking)}</p>
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
    return <p className="rounded-2xl bg-primary/5 p-4 text-sm">Chưa có dữ liệu tổng hợp về an toàn dữ liệu thử nghiệm. Không có dữ liệu thô nào được hiển thị.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary/5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={summary?.status ?? "needs_review"} />
          <p className="text-sm">Tổng hợp độ an toàn của dữ liệu mẫu/thực tế từ dữ liệu đếm tổng hợp.</p>
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
      <p className="mt-2 text-xs">Có chặn mở hay không: {yesNoText(bucket.blocking)}</p>
      <p className="mt-2 text-sm">{bucket.evidence}</p>
      {bucket.remediation ? <p className="mt-2 text-xs">{bucket.remediation}</p> : null}
    </article>
  );
}

function PilotHandoffPanel({ handoff }: { handoff: PilotHandoffSummary | null }) {
  const rollback = handoff?.rollback ?? [];
  const schoolHandoff = handoff?.school_handoff ?? [];
  if (rollback.length === 0 && schoolHandoff.length === 0) {
    return <p className="rounded-2xl bg-primary/5 p-4 text-sm">Chưa có hướng dẫn bàn giao. Hãy dùng quy trình khôi phục an toàn trong README và kiểm tra lại mức sẵn sàng.</p>;
  }

  return (
    <div className="space-y-4">
      <PilotHandoffItems title="Khôi phục" items={rollback} emptyCopy="Chưa có hướng dẫn khôi phục." />
      <PilotHandoffItems title="Bàn giao cho trường" items={schoolHandoff} emptyCopy="Chưa có dữ liệu tổng hợp để bàn giao cho trường." />
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
          Cho phép dữ liệu mẫu: {onOffText(demoSeed.allow_demo_seed)} · Kết nối mẫu đang hoạt động:{" "}
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
              Có tài khoản: {yesNoText(role.present)} · Đang hoạt động: {yesNoText(role.active)} · Là dữ liệu mẫu:{" "}
              {yesNoText(role.is_demo)}
            </p>
          </article>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard title="Bài tự kiểm tra" value={demoSeed.published_self_check_count} description="Bài tự kiểm tra mẫu đã xuất bản." />
        <MetricCard title="Tình huống" value={demoSeed.published_scenario_count} description="Tình huống mẫu đã xuất bản." />
        <MetricCard title="Cấu hình cảm xúc" value={demoSeed.published_mood_config_count} description="Cấu hình mẫu đã xuất bản." />
        <MetricCard title="Chính sách v1.4" value={demoSeed.v1_4_policy_count} description="Thiết lập chính sách mặc định cho dữ liệu mẫu." />
        <MetricCard title="Đồng ý v1.4" value={demoSeed.v1_4_preference_count} description="Trạng thái tuỳ chọn nhắc nhở cho dữ liệu mẫu." />
        <MetricCard title="Nhắc nhở v1.4" value={demoSeed.v1_4_reminder_state_count} description="Trạng thái nhắc nhở cho dữ liệu mẫu." />
        <MetricCard title="Chia sẻ v1.4" value={demoSeed.v1_4_share_count} description="Dữ liệu tổng hợp về chia sẻ mẫu." />
      </div>
    </div>
  );
}

function RuntimeModePanel({ runtime }: { runtime: RuntimeModeSummary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <MetricCard title="Chế độ hệ thống" value={runtime.mode} description="Chế độ vận hành hiện đang được cấu hình." />
      <MetricCard title="Chế độ mẫu" value={yesNoText(runtime.is_demo_runtime)} description="Cho phép hành vi dữ liệu mẫu." />
      <MetricCard title="Thử nghiệm thực tế" value={yesNoText(runtime.production_pilot)} description="Yêu cầu cấu hình thử nghiệm an toàn." />
      <MetricCard
        title="Điều kiện dữ liệu mẫu"
        value={onOffText(runtime.demo_seed_allowed || runtime.demo_login_allowed)}
        description="Dữ liệu tổng hợp về chính sách dữ liệu mẫu/đăng nhập."
      />
    </div>
  );
}

function ConnectivityPanel({ connectivity }: { connectivity: ConnectivitySummary }) {
  return (
    <div className="space-y-3 rounded-2xl bg-primary/5 p-4 text-sm">
      <p>
        <span className="font-semibold">Loại nguồn giao diện:</span> {connectivity.frontend_origin_kind}
      </p>
      <p>
        <span className="font-semibold">Nguồn được phép:</span> {connectivity.allowed_origin_count} · Cục bộ{" "}
        {yesNoText(connectivity.has_local_origin)} · Chỉ HTTPS {yesNoText(connectivity.all_origins_https)}
      </p>
      <p>
        <span className="font-semibold">Đường dẫn kiểm tra hệ thống:</span> {connectivity.health_live_path} ·{" "}
        {connectivity.health_ready_path}
      </p>
      <p>
        <span className="font-semibold">Dữ liệu cookie phiên:</span> Bảo mật{" "}
        {onOffText(connectivity.session_cookie_secure)} · SameSite {connectivity.session_cookie_samesite}
      </p>
      <p className="text-xs">
        Phương thức có xác thực: {connectivity.credentialed_cors_methods.join(", ")}. Không hiển thị giá trị cookie hoặc
        thông tin nhạy cảm.
      </p>
    </div>
  );
}

function AuthProviderPanel({ provider }: { provider: AuthProviderReadinessSummary | null }) {
  if (!provider) {
    return (
      <div className="rounded-2xl bg-primary/5 p-4">
        <h3 className="text-xs font-semibold">Chưa có dữ liệu tổng hợp về danh tính.</h3>
        <p className="mt-2 text-sm">Hãy kiểm tra cấu hình nguồn đăng nhập và tải lại trang vận hành.</p>
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
          <span className="font-semibold">Chế độ:</span> {provider.mode}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Đang bật:</span> {yesNoText(provider.enabled)}
        </p>
        {provider.provider_key ? (
          <p className="text-sm">
            <span className="font-semibold">Mã nguồn đăng nhập:</span> {provider.provider_key}
          </p>
        ) : null}
        {provider.last_check_status ? (
          <p className="text-sm">
            <span className="font-semibold">Lần kiểm tra gần nhất:</span> {displayStatus(provider.last_check_status)}
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
        emptyCopy="Chưa có dữ liệu tổng hợp về kết nối danh tính. Không có tài khoản nào được tự động cấp quyền từ thông tin xác thực bên ngoài."
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
      <MetricCard title="Chờ duyệt" value={mappings?.pending_review_count ?? 0} description="Liên kết cần duyệt." />
      <MetricCard title="Đã tắt" value={mappings?.disabled_count ?? 0} description="Liên kết đã tắt." />
      <MetricCard title="Đã thu hồi" value={mappings?.deprovisioned_count ?? 0} description="Liên kết đã thu hồi." />
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
        emptyCopy="Chưa có dữ liệu tổng hợp về phiên đăng nhập theo phương thức."
      />
      <BucketList title="Nguồn xác thực" buckets={providerBuckets} emptyCopy="Chưa có dữ liệu tổng hợp về phiên đăng nhập theo phương thức." />
      <p className="rounded-2xl bg-primary/5 p-4 text-sm">
        Phiên đăng nhập vẫn dùng cookie HttpOnly do hệ thống sở hữu; giao diện không đọc hoặc lưu mã truy cập.
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
        <h3 className="text-xs font-semibold">Chưa có kết quả kiểm tra lớp bảo vệ.</h3>
        <p className="mt-2 text-sm">Hãy chạy kiểm tra lớp bảo vệ hoặc lệnh kiểm tra nhanh rồi xem lại dữ liệu tổng hợp vận hành.</p>
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
        <h3 className="text-xs font-semibold">Chưa có kết quả kiểm tra lớp bảo vệ.</h3>
        <p className="mt-2 text-sm">Hãy chạy kiểm tra lớp bảo vệ hoặc lệnh kiểm tra nhanh rồi xem lại dữ liệu tổng hợp vận hành.</p>
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
              Kiểm tra nhanh cho thử nghiệm thực tế yêu cầu hệ thống sẵn sàng và không phụ thuộc tài khoản mẫu hoặc dữ liệu hướng dẫn.
            </p>
          ) : (
            <p className="mt-2 text-sm">
              Dùng tài khoản mẫu đã khởi tạo để kiểm tra trang đầu, đăng nhập theo vai trò và bảng điều khiển công khai.
            </p>
          )}
          <p className="mt-2 text-xs">
            Dùng tài khoản mẫu: {yesNoText(profile.uses_demo_accounts)} · Yêu cầu sẵn sàng:{" "}
            {yesNoText(profile.requires_readiness_ready)}
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
    <article className="card-lift rounded-2xl border border-outline-variant/30 bg-white p-5 transition-colors hover:border-primary/30 dark:bg-[#1a2940]">
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
    <section className="card-lift space-y-4 rounded-2xl border border-outline-variant/30 bg-white p-5 dark:bg-[#1a2940] sm:p-6" data-testid={testId}>
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
            <li key={`${bucket.key}-${bucket.label}`} className="flex items-start justify-between gap-4">
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
    return <p className="text-sm">Chưa có lượt gửi thử email SOS.</p>;
  }
  return (
    <div className="space-y-3">
      {deliveries.map((delivery) => (
        <article key={delivery.delivery_key} className="rounded-2xl border border-outline-variant/20 p-4">
          <p className="font-semibold">
            {delivery.provider} · {displayStatus(delivery.status)} · {delivery.recipient_role}
          </p>
          <p className="mt-2 text-xs">Cảnh báo: {delivery.alert_key}</p>
          <p className="text-xs">Số lần thử: {delivery.attempt_count}</p>
          {delivery.error_code ? <p className="text-xs">Lỗi: {delivery.error_code}</p> : null}
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
        {event.action} · {displayStatus(event.status)}
      </p>
      <p className="mt-1 text-xs text-on-background/50">
        {event.actor_role} · {event.resource_type} · {formatDate(event.timestamp)}
      </p>
      <p className="mt-2 text-xs text-on-background/70">{metadataText(event.metadata_summary)}</p>
    </article>
  );
}

