import { apiFetch } from "@/lib/api";

export type DemoScope = "all" | "demo" | "real";

export type ExactCountBucket = {
  key: string;
  label: string;
  count: number;
};

export type PrivacyCountBucket = {
  key: string;
  label: string;
  count: number | null;
  suppressed: boolean;
};

export type AdminAggregateReport = {
  generated_at: string;
  demo_scope: DemoScope;
  suppression_threshold: number;
  privacy_notes: string[];
  user_counts: {
    total: number;
    by_role: ExactCountBucket[];
    by_status: ExactCountBucket[];
    by_demo_status: ExactCountBucket[];
  };
  linked_students: {
    linked_students: number;
    total_active_links: number;
    by_relationship: ExactCountBucket[];
  };
  self_check_usage: {
    total_completed: PrivacyCountBucket;
    by_test: PrivacyCountBucket[];
    risk_distribution: PrivacyCountBucket[];
  };
  sos_counts: {
    total_alerts: PrivacyCountBucket;
    by_status: PrivacyCountBucket[];
    by_severity: PrivacyCountBucket[];
    by_source: PrivacyCountBucket[];
  };
  scenario_usage: {
    total_completed: PrivacyCountBucket;
    popular_scenarios: PrivacyCountBucket[];
  };
  chatbot_safety: {
    high_risk_signals: PrivacyCountBucket;
    sos_suggested_signals: PrivacyCountBucket;
    by_stage: PrivacyCountBucket[];
  };
};

export function getAdminAggregateReport(demoScope: DemoScope = "all") {
  const params = new URLSearchParams({ demo_scope: demoScope });
  return apiFetch<AdminAggregateReport>(`/api/admin/reports/aggregate?${params.toString()}`);
}
