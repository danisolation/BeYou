import { apiFetch } from "@/lib/api";

export type AdultSummaryStudent = {
  id: string;
  full_name: string;
  school: string | null;
  class_name: string | null;
};

export type AdultSelfCheckSummaryItem = {
  completed_at: string;
  test_type?: string;
  test_title?: string;
  state_label: "On dinh" | "Can chu y" | "Nen tim ho tro" | "Can ho tro som";
  advice_summary: string | null;
  support_suggestion: string | null;
  is_demo: boolean;
};

export type AdultSelfCheckSummaryResponse = {
  student: AdultSummaryStudent;
  latest_summary: AdultSelfCheckSummaryItem | null;
  recent_summaries: AdultSelfCheckSummaryItem[];
  is_demo: boolean;
};

export function getTeacherSelfCheckSummaries(studentId: string) {
  return apiFetch<AdultSelfCheckSummaryResponse>(`/api/teacher/students/${studentId}/self-check-summaries`);
}

export function getParentSelfCheckSummaries(studentId: string) {
  return apiFetch<AdultSelfCheckSummaryResponse>(`/api/parent/students/${studentId}/self-check-summaries`);
}
