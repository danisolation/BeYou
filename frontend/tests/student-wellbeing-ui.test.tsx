import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentDashboardPage from "@/app/(authenticated)/student/page";
import {
  listScenarioHistory,
  listScenarios,
  listSelfCheckHistory,
  listSelfChecks,
  submitScenarioAttempt,
  submitSelfCheckAttempt,
} from "@/lib/wellbeing-api";

function mockFetch(responses: Record<string, unknown>) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const body = responses[path];
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: body === undefined ? 404 : 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("student wellbeing dashboard and API helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses cookie API paths for student self-check and scenario helpers", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchMock = mockFetch({
      "/api/student/self-checks": [],
      "/api/student/self-checks/history": { items: [] },
      "/api/student/scenarios": [],
      "/api/student/scenarios/history": { items: [] },
      "/api/student/self-checks/test-1/attempts": {
        attempt_id: "attempt-1",
        test_id: "test-1",
        test_title: "Sức khỏe cảm xúc",
        state_label: "On dinh",
        supportive_headline: "Em đang có nhiều dấu hiệu ổn định.",
        score: 3,
        completed_at: "2026-05-21T00:00:00Z",
        is_demo: true,
      },
      "/api/student/scenarios/scenario-1/attempts": {
        attempt_id: "scenario-attempt-1",
        scenario_id: "scenario-1",
        selected_choice_id: "choice-1",
        selected_choice: "Em nói rõ điều em cần.",
        signal: "constructive",
        feedback: "Lựa chọn này có điểm tích cực...",
        recommended_response: "Em có thể nói chậm lại và nhờ hỗ trợ.",
        lesson: "Tạm dừng giúp em chọn phản hồi an toàn hơn.",
        skill_tag: "Giao tiếp",
        completed_at: "2026-05-21T00:00:00Z",
        is_demo: true,
      },
    });

    await listSelfChecks();
    await listSelfCheckHistory();
    await listScenarios();
    await listScenarioHistory();
    await submitSelfCheckAttempt("test-1", [{ question_id: "question-1", choice_id: "choice-1" }]);
    await submitScenarioAttempt("scenario-1", "choice-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/student/self-checks",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/student/self-checks/test-1/attempts",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ answers: [{ question_id: "question-1", choice_id: "choice-1" }] }),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/student/scenarios/scenario-1/attempts",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ selected_choice_id: "choice-1" }),
      }),
    );
    expect(localStorageSpy).not.toHaveBeenCalled();
  });

  it("renders student wellbeing entry cards with exact supportive copy", async () => {
    mockFetch({
      "/api/student/profile": {
        id: "student-1",
        full_name: "Nguyễn An Demo",
        email: "student.demo@beyou.local",
        school: "Trường THPT BeYou Demo",
        class_name: "10A1",
        is_demo: true,
        linked_adults: [],
      },
    });

    render(<StudentDashboardPage />);

    expect(await screen.findByText("Bảng điều khiển của em")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tự kiểm tra cảm xúc/ })).toHaveAttribute(
      "href",
      "/student/self-checks",
    );
    expect(screen.getByText("Chọn một bài ngắn để hiểu trạng thái hiện tại của em. Kết quả không phải chẩn đoán.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tình huống luyện tập/ })).toHaveAttribute(
      "href",
      "/student/scenarios",
    );
    expect(
      screen.getByText("Chọn một tình huống gần với đời sống học đường để thử cách phản hồi an toàn hơn."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Xem lịch sử tự kiểm tra/ })).toHaveAttribute(
      "href",
      "/student/self-checks/history",
    );
    expect(screen.getByRole("link", { name: /Xem lịch sử tình huống/ })).toHaveAttribute(
      "href",
      "/student/scenarios/history",
    );

    await waitFor(() => expect(screen.queryByText("Đang tải thông tin...")).not.toBeInTheDocument());
  });
});
