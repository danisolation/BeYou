import { apiFetch } from "@/lib/api";

export type AdminContentStatus = "draft" | "published" | "archived";
export type AdminRiskStateLabel = "On dinh" | "Can chu y" | "Nen tim ho tro" | "Can ho tro som";
export type AdminScenarioSignal = "constructive" | "risky";

export type AdminSelfCheckChoice = {
  id?: string;
  text: string;
  score_value: number;
  sort_order: number;
  is_demo?: boolean | null;
};

export type AdminSelfCheckQuestion = {
  id?: string;
  text: string;
  sort_order: number;
  choices: AdminSelfCheckChoice[];
  is_demo?: boolean | null;
};

export type AdminSelfCheckThreshold = {
  id?: string;
  state_label: AdminRiskStateLabel;
  min_score: number;
  max_score: number;
  comment: string | null;
  advice: string | null;
  positive_content: string | null;
  suggested_next_action: string | null;
  is_demo?: boolean | null;
};

export type AdminSelfCheckContent = {
  id?: string;
  title: string;
  description: string | null;
  status: AdminContentStatus;
  is_active?: boolean;
  is_demo?: boolean | null;
  created_at?: string;
  updated_at?: string;
  questions: AdminSelfCheckQuestion[];
  thresholds: AdminSelfCheckThreshold[];
};

export type AdminScenarioChoice = {
  id?: string;
  text: string;
  signal: AdminScenarioSignal;
  feedback: string;
  sort_order: number;
  is_demo?: boolean | null;
};

export type AdminScenarioContent = {
  id?: string;
  title: string;
  situation: string;
  skill_tag: string;
  status: AdminContentStatus;
  recommended_response: string;
  lesson: string;
  is_demo?: boolean | null;
  created_at?: string;
  updated_at?: string;
  choices: AdminScenarioChoice[];
};

export function listAdminSelfChecks() {
  return apiFetch<AdminSelfCheckContent[]>("/api/admin/content/self-checks");
}

export function createAdminSelfCheck(payload: AdminSelfCheckContent) {
  return apiFetch<AdminSelfCheckContent>("/api/admin/content/self-checks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminSelfCheck(testId: string, payload: AdminSelfCheckContent) {
  return apiFetch<AdminSelfCheckContent>(`/api/admin/content/self-checks/${testId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function publishAdminSelfCheck(testId: string) {
  return apiFetch<AdminSelfCheckContent>(`/api/admin/content/self-checks/${testId}/publish`, {
    method: "POST",
  });
}

export function archiveAdminSelfCheck(testId: string) {
  return apiFetch<AdminSelfCheckContent>(`/api/admin/content/self-checks/${testId}/archive`, {
    method: "POST",
  });
}

export function deleteDraftAdminSelfCheck(testId: string) {
  return apiFetch<AdminSelfCheckContent>(`/api/admin/content/self-checks/${testId}`, {
    method: "DELETE",
  });
}

export function listAdminScenarios() {
  return apiFetch<AdminScenarioContent[]>("/api/admin/content/scenarios");
}

export function createAdminScenario(payload: AdminScenarioContent) {
  return apiFetch<AdminScenarioContent>("/api/admin/content/scenarios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminScenario(scenarioId: string, payload: AdminScenarioContent) {
  return apiFetch<AdminScenarioContent>(`/api/admin/content/scenarios/${scenarioId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function publishAdminScenario(scenarioId: string) {
  return apiFetch<AdminScenarioContent>(`/api/admin/content/scenarios/${scenarioId}/publish`, {
    method: "POST",
  });
}

export function archiveAdminScenario(scenarioId: string) {
  return apiFetch<AdminScenarioContent>(`/api/admin/content/scenarios/${scenarioId}/archive`, {
    method: "POST",
  });
}

export function deleteDraftAdminScenario(scenarioId: string) {
  return apiFetch<AdminScenarioContent>(`/api/admin/content/scenarios/${scenarioId}`, {
    method: "DELETE",
  });
}
