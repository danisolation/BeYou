import { apiFetch } from "@/lib/api";

export type RiskStateLabel = "On dinh" | "Can chu y" | "Nen tim ho tro" | "Can ho tro som";
export type ScenarioSignal = "constructive" | "risky";

export type SelfCheckListItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  is_active: boolean;
  is_demo: boolean;
};

export type SelfCheckChoice = {
  id: string;
  text: string;
  sort_order: number;
  is_demo: boolean;
};

export type SelfCheckQuestion = {
  id: string;
  text: string;
  sort_order: number;
  choices: SelfCheckChoice[];
  is_demo: boolean;
};

export type SelfCheckDetail = SelfCheckListItem & {
  questions: SelfCheckQuestion[];
};

export type SelfCheckAnswerSubmit = {
  question_id: string;
  choice_id: string;
};

export type SelfCheckResult = {
  attempt_id: string;
  test_id: string;
  test_title: string;
  state_label: RiskStateLabel;
  supportive_headline: string;
  short_comment: string | null;
  advice_summary: string | null;
  support_suggestion: string | null;
  positive_content: string | null;
  suggested_next_action: string | null;
  score: number;
  completed_at: string;
  is_demo: boolean;
};

export type SelfCheckHistoryItem = {
  attempt_id: string;
  test_id: string;
  test_title: string;
  state_label: RiskStateLabel;
  supportive_headline: string | null;
  suggested_next_action: string | null;
  completed_at: string;
  is_demo: boolean;
};

export type SelfCheckHistoryResponse = {
  items: SelfCheckHistoryItem[];
};

export type SelfCheckAttemptAnswer = {
  question_id: string | null;
  choice_id: string | null;
  question_text_snapshot: string;
  choice_text_snapshot: string;
  score_value_snapshot: number;
  sort_order: number;
  is_demo: boolean;
};

export type SelfCheckAttemptDetail = SelfCheckResult & {
  answers: SelfCheckAttemptAnswer[];
};

export type ScenarioListItem = {
  id: string;
  title: string;
  situation: string;
  skill_tag: string;
  status: string;
  is_demo: boolean;
};

export type ScenarioChoice = {
  id: string;
  text: string;
  signal: ScenarioSignal;
  feedback: string;
  sort_order: number;
  is_demo: boolean;
};

export type ScenarioDetail = ScenarioListItem & {
  recommended_response: string;
  lesson: string;
  choices: ScenarioChoice[];
};

export type ScenarioFeedback = {
  attempt_id: string;
  scenario_id: string;
  selected_choice_id: string | null;
  selected_choice: string | null;
  signal: ScenarioSignal | null;
  feedback: string | null;
  recommended_response: string;
  lesson: string;
  skill_tag: string;
  completed_at: string;
  is_demo: boolean;
};

export type ScenarioHistoryItem = {
  attempt_id: string;
  scenario_id: string;
  scenario_title: string;
  selected_choice: string | null;
  signal: ScenarioSignal | null;
  feedback: string | null;
  skill_tag: string;
  completed_at: string;
  is_demo: boolean;
};

export type ScenarioHistoryResponse = {
  items: ScenarioHistoryItem[];
};

export function listSelfChecks() {
  return apiFetch<SelfCheckListItem[]>("/api/student/self-checks");
}

export function getSelfCheck(testId: string) {
  return apiFetch<SelfCheckDetail>(`/api/student/self-checks/${testId}`);
}

export function submitSelfCheckAttempt(testId: string, answers: SelfCheckAnswerSubmit[]) {
  return apiFetch<SelfCheckResult>(`/api/student/self-checks/${testId}/attempts`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export function listSelfCheckHistory() {
  return apiFetch<SelfCheckHistoryResponse>("/api/student/self-checks/history");
}

export function getSelfCheckAttemptDetail(attemptId: string) {
  return apiFetch<SelfCheckAttemptDetail>(`/api/student/self-checks/history/${attemptId}`);
}

export function listScenarios() {
  return apiFetch<ScenarioListItem[]>("/api/student/scenarios");
}

export function getScenario(scenarioId: string) {
  return apiFetch<ScenarioDetail>(`/api/student/scenarios/${scenarioId}`);
}

export function submitScenarioAttempt(scenarioId: string, selectedChoiceId: string) {
  return apiFetch<ScenarioFeedback>(`/api/student/scenarios/${scenarioId}/attempts`, {
    method: "POST",
    body: JSON.stringify({ selected_choice_id: selectedChoiceId }),
  });
}

export function listScenarioHistory() {
  return apiFetch<ScenarioHistoryResponse>("/api/student/scenarios/history");
}
