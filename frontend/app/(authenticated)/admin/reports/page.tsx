"use client";

import { PageSkeleton } from "@/components/skeletons";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Shield } from "lucide-react";

import {
  type AdminAggregateReport,
  type DemoScope,
  type ExactCountBucket,
  getAdminAggregateReport,
  type PrivacyCountBucket,
} from "@/lib/admin-reports-api";

const SCOPE_OPTIONS: { value: DemoScope; label: string }[] = [
  { value: "all", label: "Tất cả dữ liệu" },
  { value: "demo", label: "Chỉ dữ liệu demo" },
  { value: "real", label: "Chỉ dữ liệu thật" },
];

const SUPPRESSED_LABEL = "Đã ẩn để bảo vệ riêng tư (<3)";

function formatCount(count: number) {
  return new Intl.NumberFormat("vi-VN").format(count);
}

function privacyCountLabel(bucket: PrivacyCountBucket) {
  if (bucket.suppressed) {
    return SUPPRESSED_LABEL;
  }
  return formatCount(bucket.count ?? 0);
}

function hasAnySensitiveData(report: AdminAggregateReport) {
  return [
    report.self_check_usage.total_completed,
    report.sos_counts.total_alerts,
    report.scenario_usage.total_completed,
    report.chatbot_safety.high_risk_signals,
  ].some((bucket) => bucket.suppressed || (bucket.count ?? 0) > 0);
}

export default function AdminReportsPage() {
  const [demoScope, setDemoScope] = useState<DemoScope>("all");
  const [report, setReport] = useState<AdminAggregateReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");
    getAdminAggregateReport(demoScope)
      .then((loaded) => {
        if (!cancelled) {
          setReport(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Chưa tải được báo cáo tổng hợp. Hãy thử lại từ cổng quản trị.");
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
  }, [demoScope]);

  const generatedAt = useMemo(() => {
    if (!report) {
      return "";
    }
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(report.generated_at));
  }, [report]);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-on-background">Báo cáo tổng hợp</h1>
            {generatedAt ? <p className="text-xs text-on-background/50">Cập nhật: {generatedAt}</p> : null}
          </div>
        </div>
        <p className="mt-3 text-sm text-on-background/70">
          Số liệu xu hướng chung để cải thiện hỗ trợ. Nhóm nhỏ hơn 3 sẽ tự ẩn.
        </p>
      </header>

      {/* Compact privacy notice + scope selector in one row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs text-on-background/70">
          <span className="font-semibold text-primary">🔒 An toàn:</span> Không hiển thị câu trả lời, tin nhắn, ghi chú SOS hay danh sách học sinh.
        </p>
        <select
          aria-label="Phạm vi dữ liệu"
          value={demoScope}
          onChange={(event) => setDemoScope(event.target.value as DemoScope)}
          className="min-h-9 w-full rounded-xl border border-outline-variant/30 bg-white dark:bg-[#1e2d40] px-3 text-sm sm:w-44"
        >
          {SCOPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? <PageSkeleton /> : null}
      {error ? <p className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6 text-sm text-red-700">{error}</p> : null}

      {report ? (
        <>
          {!hasAnySensitiveData(report) ? (
            <p className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6 text-sm text-on-background/70">
              Chưa có đủ dữ liệu. Xu hướng sẽ hiển thị khi nhóm đủ lớn.
            </p>
          ) : null}

          {/* Quick metrics row */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <ExactMetricCard title="Tài khoản" value={report.user_counts.total} />
            <ExactMetricCard title="HS có hỗ trợ" value={report.linked_students.linked_students} />
            <PrivacyMetricCard bucket={report.self_check_usage.total_completed} />
            <PrivacyMetricCard bucket={report.sos_counts.total_alerts} />
            <PrivacyMetricCard bucket={report.scenario_usage.total_completed} />
            <PrivacyMetricCard bucket={report.chatbot_safety.high_risk_signals} />
          </div>

          {/* Detail sections */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ReportSection title="Người dùng" description="Phân bổ theo vai trò, trạng thái và nhãn demo/real.">
              <ExactBucketList title="Theo vai trò" buckets={report.user_counts.by_role} />
              <ExactBucketList title="Theo trạng thái" buckets={report.user_counts.by_status} />
              <ExactBucketList title="Demo/Real" buckets={report.user_counts.by_demo_status} />
            </ReportSection>

            <ReportSection title="Liên kết hỗ trợ" description={`${formatCount(report.linked_students.total_active_links)} liên kết đang hoạt động.`}>
              <ExactBucketList title="Theo loại" buckets={report.linked_students.by_relationship} />
            </ReportSection>

            <ReportSection title="Tự kiểm tra" description="Phân bố lượt hoàn tất, không có câu trả lời.">
              <PrivacyBucketList title="Theo bài" buckets={report.self_check_usage.by_test} />
              <PrivacyBucketList title="Theo mức hỗ trợ" buckets={report.self_check_usage.risk_distribution} />
            </ReportSection>

            <ReportSection title="Tín hiệu SOS" description="Trạng thái tổng hợp, không hiển thị ghi chú.">
              <PrivacyBucketList title="Theo trạng thái" buckets={report.sos_counts.by_status} />
              <PrivacyBucketList title="Theo mức khẩn" buckets={report.sos_counts.by_severity} />
              <PrivacyBucketList title="Theo nguồn" buckets={report.sos_counts.by_source} />
            </ReportSection>

            <ReportSection title="Tình huống" description="Nội dung nào được luyện nhiều nhất.">
              <PrivacyBucketList title="Tình huống phổ biến" buckets={report.scenario_usage.popular_scenarios} />
            </ReportSection>

            <ReportSection title="An toàn Chatbot" description="Guardrail tổng hợp, HS sở hữu nội dung chat.">
              <PrivacyMetricRow bucket={report.chatbot_safety.sos_suggested_signals} />
              <PrivacyBucketList title="Theo giai đoạn" buckets={report.chatbot_safety.by_stage} />
            </ReportSection>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ExactMetricCard({ title, value }: { title: string; value: number }) {
  return (
    <article className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-4 text-center">
      <p className="text-2xl font-bold text-on-background">{formatCount(value)}</p>
      <p className="mt-1 text-xs text-on-background/60">{title}</p>
    </article>
  );
}

function PrivacyMetricCard({ bucket }: { bucket: PrivacyCountBucket }) {
  return (
    <article className="rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-4 text-center">
      <p className="text-2xl font-bold text-on-background">{privacyCountLabel(bucket)}</p>
      <p className="mt-1 text-xs text-on-background/60">{bucket.label}</p>
      {bucket.suppressed ? <p className="mt-1 text-xs text-primary">Ẩn nhóm nhỏ</p> : null}
    </article>
  );
}

function ReportSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-outline-variant/30 bg-white dark:bg-[#1a2940] p-6">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-2 text-sm">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ExactBucketList({ title, buckets }: { title: string; buckets: ExactCountBucket[] }) {
  return (
    <div className="rounded-2xl bg-primary/5 p-4">
      <h3 className="text-xs font-semibold">{title}</h3>
      {buckets.length ? (
        <ul className="mt-3 space-y-2">
          {buckets.map((bucket) => (
            <li key={`${bucket.key}-${bucket.label}`} className="flex items-center justify-between gap-4 text-sm">
              <span>{bucket.label}</span>
              <span className="font-semibold">{formatCount(bucket.count)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm">Chưa có dữ liệu trong phạm vi này.</p>
      )}
    </div>
  );
}

function PrivacyBucketList({ title, buckets }: { title: string; buckets: PrivacyCountBucket[] }) {
  return (
    <div className="rounded-2xl bg-primary/5 p-4">
      <h3 className="text-xs font-semibold">{title}</h3>
      {buckets.length ? (
        <ul className="mt-3 space-y-2">
          {buckets.map((bucket) => (
            <PrivacyMetricRow key={`${bucket.key}-${bucket.label}`} bucket={bucket} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm">Chưa có dữ liệu tổng hợp đủ lớn trong phạm vi này.</p>
      )}
    </div>
  );
}

function PrivacyMetricRow({ bucket }: { bucket: PrivacyCountBucket }) {
  return (
    <li className="flex items-start justify-between gap-4 text-sm">
      <span>{bucket.label}</span>
      <span className="text-right font-semibold">
        {privacyCountLabel(bucket)}
        {bucket.suppressed ? <span className="block text-xs font-normal text-primary">Bảo vệ nhóm nhỏ</span> : null}
      </span>
    </li>
  );
}
