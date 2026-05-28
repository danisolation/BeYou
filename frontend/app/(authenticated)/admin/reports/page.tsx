"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

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
      <div className="rounded-2xl bg-white dark:bg-[#1a2940] p-6 shadow-sm">
        <p className="text-xs font-semibold text-primary">Báo cáo hỗ trợ, không giám sát</p>
        <h1 className="mt-2 text-2xl font-bold">Báo cáo tổng hợp riêng tư</h1>
        <p className="mt-3 max-w-3xl text-sm">
          Xem xu hướng chung để cải thiện hỗ trợ học sinh mà không mở câu trả lời, tin nhắn, ghi chú hoặc danh sách nguy cơ của từng em.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl bg-primary/5 p-6">
          <h2 className="text-sm font-semibold">Ranh giới riêng tư</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(report?.privacy_notes ?? [
              "Chỉ hiển thị số liệu tổng hợp đã được giới hạn riêng tư. Trang này không hiển thị câu trả lời tự kiểm tra, tin nhắn chatbot, ghi chú SOS hay danh sách học sinh theo nguy cơ.",
              "Các nhóm nhạy cảm có ít hơn 3 bản ghi sẽ được ẩn để tránh nhận diện gián tiếp.",
              "Dùng báo cáo để cải thiện hỗ trợ chung, không dùng để xếp hạng hoặc giám sát từng học sinh.",
            ]).map((note) => (
              <li key={note}>• {note}</li>
            ))}
          </ul>
          <p className="mt-4 rounded-2xl bg-white dark:bg-[#1a2940] p-4 text-xs font-semibold text-primary">
            Không có xuất dữ liệu thô, không có danh sách học sinh theo nguy cơ.
          </p>
        </section>

        <section className="rounded-2xl bg-white dark:bg-[#1a2940] p-6 shadow-sm">
          <label className="block space-y-2 text-xs font-semibold">
            Phạm vi dữ liệu
            <select
              aria-label="Phạm vi dữ liệu"
              value={demoScope}
              onChange={(event) => setDemoScope(event.target.value as DemoScope)}
              className="w-full rounded-2xl border border-outline-variant/30 p-3 text-sm"
            >
              {SCOPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-4 text-sm">
            Nhãn demo/real được giữ rõ ràng theo `is_demo`; dữ liệu thật và demo có thể được xem riêng khi cần.
          </p>
          {generatedAt ? <p className="mt-3 text-xs">Cập nhật: {generatedAt}</p> : null}
        </section>
      </div>

      {isLoading ? <p className="rounded-2xl bg-white dark:bg-[#1a2940] p-6 shadow-sm">Đang tải báo cáo tổng hợp...</p> : null}
      {error ? <p className="rounded-2xl bg-white dark:bg-[#1a2940] p-6 text-red-700 shadow-sm">{error}</p> : null}

      {report ? (
        <>
          {!hasAnySensitiveData(report) ? (
            <p className="rounded-2xl bg-white dark:bg-[#1a2940] p-6 shadow-sm">
              Chưa có đủ dữ liệu tổng hợp trong phạm vi này. Peerlight AI vẫn giữ nguyên ranh giới riêng tư và sẽ hiển thị xu hướng khi nhóm đủ lớn.
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <ExactMetricCard title="Tài khoản" value={report.user_counts.total} description="Tổng số người dùng trong phạm vi đã chọn." />
            <ExactMetricCard title="Học sinh có người lớn hỗ trợ" value={report.linked_students.linked_students} description={`${formatCount(report.linked_students.total_active_links)} liên kết đang hoạt động.`} />
            <PrivacyMetricCard bucket={report.self_check_usage.total_completed} description="Tổng lượt tự kiểm tra, có ẩn nhóm nhỏ." />
            <PrivacyMetricCard bucket={report.sos_counts.total_alerts} description="Tổng tín hiệu SOS theo phạm vi đã chọn." />
            <PrivacyMetricCard bucket={report.scenario_usage.total_completed} description="Tổng lượt luyện tình huống đã hoàn tất." />
            <PrivacyMetricCard bucket={report.chatbot_safety.high_risk_signals} description="Chỉ là tín hiệu an toàn tổng hợp, không có nội dung trò chuyện." />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ReportSection title="Người dùng và dữ liệu demo" description="Đếm tài khoản theo vai trò, trạng thái và nhãn demo/real.">
              <ExactBucketList title="Theo vai trò" buckets={report.user_counts.by_role} />
              <ExactBucketList title="Theo trạng thái" buckets={report.user_counts.by_status} />
              <ExactBucketList title="Demo/real" buckets={report.user_counts.by_demo_status} />
            </ReportSection>

            <ReportSection title="Liên kết hỗ trợ" description="Chỉ đếm liên kết đang hoạt động, không mở hồ sơ từng học sinh.">
              <ExactBucketList title="Theo loại liên kết" buckets={report.linked_students.by_relationship} />
            </ReportSection>

            <ReportSection title="Tự kiểm tra" description="Tổng hợp lượt hoàn tất và phân bố trạng thái, không có câu trả lời riêng tư.">
              <PrivacyBucketList title="Theo bài tự kiểm tra" buckets={report.self_check_usage.by_test} />
              <PrivacyBucketList title="Theo mức hỗ trợ" buckets={report.self_check_usage.risk_distribution} />
            </ReportSection>

            <ReportSection title="SOS" description="Tổng hợp trạng thái an toàn, không hiển thị ghi chú SOS hoặc tên học sinh.">
              <PrivacyBucketList title="Theo trạng thái" buckets={report.sos_counts.by_status} />
              <PrivacyBucketList title="Theo mức khẩn" buckets={report.sos_counts.by_severity} />
              <PrivacyBucketList title="Theo nguồn" buckets={report.sos_counts.by_source} />
            </ReportSection>

            <ReportSection title="Tình huống phổ biến" description="Xem nội dung nào được luyện nhiều để cải thiện hỗ trợ chung.">
              <PrivacyBucketList title="Tình huống" buckets={report.scenario_usage.popular_scenarios} />
            </ReportSection>

            <ReportSection title="Tín hiệu an toàn chatbot" description="Chỉ là số liệu guardrail tổng hợp; học sinh vẫn sở hữu nội dung trò chuyện của mình.">
              <PrivacyMetricRow bucket={report.chatbot_safety.sos_suggested_signals} />
              <PrivacyBucketList title="Theo giai đoạn" buckets={report.chatbot_safety.by_stage} />
            </ReportSection>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ExactMetricCard({ title, value, description }: { title: string; value: number; description: string }) {
  return (
    <article className="rounded-2xl bg-white dark:bg-[#1a2940] p-6 shadow-sm">
      <p className="text-xs font-semibold text-primary">{title}</p>
      <p className="mt-2 text-2xl font-bold">{formatCount(value)}</p>
      <p className="mt-3 text-sm">{description}</p>
    </article>
  );
}

function PrivacyMetricCard({ bucket, description }: { bucket: PrivacyCountBucket; description: string }) {
  return (
    <article className="rounded-2xl bg-white dark:bg-[#1a2940] p-6 shadow-sm">
      <p className="text-xs font-semibold text-primary">{bucket.label}</p>
      <p className="mt-2 text-2xl font-bold">{privacyCountLabel(bucket)}</p>
      <p className="mt-3 text-sm">{description}</p>
      {bucket.suppressed ? <p className="mt-2 text-xs text-primary">Bảo vệ nhóm nhỏ theo ngưỡng riêng tư.</p> : null}
    </article>
  );
}

function ReportSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl bg-white dark:bg-[#1a2940] p-6 shadow-sm">
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
