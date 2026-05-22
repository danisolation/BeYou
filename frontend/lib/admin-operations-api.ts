import { apiFetch } from "@/lib/api";

export type OperationCountBucket = {
  key: string;
  label: string;
  count: number;
};

export type OperationReadinessSummary = {
  status: "ready" | "degraded" | "not_ready";
  generated_at: string;
  checks_by_status: OperationCountBucket[];
  attention_checks: Array<{
    key: string;
    category: string;
    status: "pass" | "warn" | "fail";
    summary: string;
    remediation: string | null;
  }>;
};

export type SosEmailDeliveryItem = {
  id: string;
  alert_id: string;
  channel: string;
  provider: string;
  recipient_role: string;
  status: string;
  attempt_count: number;
  error_code: string | null;
  last_attempt_at: string | null;
  delivered_at: string | null;
  created_at: string;
  is_demo: boolean;
};

export type AuditEventItem = {
  id: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  status: string;
  timestamp: string;
  reason: string | null;
  metadata_summary: Record<string, unknown>;
  is_demo: boolean;
};

export type AdminOperationsDashboard = {
  generated_at: string;
  privacy_notes: string[];
  readiness: OperationReadinessSummary;
  sos_email: {
    total: number;
    by_status: OperationCountBucket[];
    by_provider: OperationCountBucket[];
    by_error_code: OperationCountBucket[];
    recent: SosEmailDeliveryItem[];
  };
  v1_2_audit?: OperationCountBucket[];
  audit: {
    total_matching: number;
    filters: {
      start_at: string | null;
      end_at: string | null;
      actor_role: string | null;
      action_type: string | null;
      target_type: string | null;
      status: string | null;
    };
    recent: AuditEventItem[];
  };
};

export type AdminOperationsFilters = {
  startAt?: string;
  endAt?: string;
  actorRole?: string;
  actionType?: string;
  targetType?: string;
  status?: string;
  limit?: number;
};

export function getAdminOperationsDashboard(filters: AdminOperationsFilters = {}) {
  const params = new URLSearchParams();
  if (filters.startAt) params.set("start_at", filters.startAt);
  if (filters.endAt) params.set("end_at", filters.endAt);
  if (filters.actorRole) params.set("actor_role", filters.actorRole);
  if (filters.actionType) params.set("action_type", filters.actionType);
  if (filters.targetType) params.set("target_type", filters.targetType);
  if (filters.status) params.set("status", filters.status);
  params.set("limit", String(filters.limit ?? 25));
  return apiFetch<AdminOperationsDashboard>(`/api/admin/operations/dashboard?${params.toString()}`);
}

