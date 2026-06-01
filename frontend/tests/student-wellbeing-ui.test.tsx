import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentDashboardPage from "@/app/(authenticated)/student/page";
import SelfCheckHistoryDetailPage from "@/app/(authenticated)/student/self-checks/history/[attemptId]/page";
import SelfCheckHistoryPage from "@/app/(authenticated)/student/self-checks/history/page";
import SelfCheckResultPage from "@/app/(authenticated)/student/self-checks/results/[attemptId]/page";
import SelfCheckTakePage from "@/app/(authenticated)/student/self-checks/[testId]/page";
import SelfCheckListPage from "@/app/(authenticated)/student/self-checks/page";
import ScenarioDetailPage from "@/app/(authenticated)/student/scenarios/[scenarioId]/page";
import ScenarioHistoryPage from "@/app/(authenticated)/student/scenarios/history/page";
import ScenarioListPage from "@/app/(authenticated)/student/scenarios/page";
import {
  listScenarioHistory,
  listScenarios,
  listSelfCheckHistory,
  listSelfChecks,
  submitScenarioAttempt,
  submitSelfCheckAttempt,
} from "@/lib/wellbeing-api";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function mockFetch(responses: Record<string, unknown>) {
  const fetchMock = vi.fn((url: string) => {
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
    push.mockReset();
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

    expect(await screen.findByText(/Nguyễn An Demo/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Khám phá ngay" })).toHaveAttribute("href", "/student/self-checks");
    expect(screen.getByText("Nhận diện và hiểu rõ cảm xúc của bạn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Luyện tập ngay" })).toHaveAttribute("href", "/student/scenarios");
    expect(screen.getByText("Rèn luyện kỹ năng ứng phó với áp lực")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trò chuyện cùng AI" })).toHaveAttribute("href", "/student/chat");
  });
});

describe("student self-check UI flow", () => {
  beforeEach(() => {
    push.mockReset();
    vi.restoreAllMocks();
  });

  it("lists published self-checks with demo badges and warm CTAs", async () => {
    mockFetch({
      "/api/student/self-checks": [
        {
          id: "test-1",
          title: "Sức khỏe cảm xúc",
          description: "Một bài ngắn để em nhìn lại cảm xúc gần đây.",
          status: "published",
          is_active: true,
          is_demo: true,
        },
      ],
      "/api/student/self-checks/history": { items: [] },
    });

    render(<SelfCheckListPage />);

    expect(await screen.findByText("Khám phá cảm xúc")).toBeInTheDocument();
    expect(screen.getByText("Một bài ngắn để em nhìn lại cảm xúc gần đây.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bắt đầu" })).toHaveAttribute("href", "/student/self-checks/test-1");
    expect(screen.getByRole("heading", { name: "Lịch sử làm bài" })).toBeInTheDocument();
    expect(screen.getByText("Sau khi hoàn thành một bài, kết quả và gợi ý của em sẽ xuất hiện ở đây.")).toBeInTheDocument();
  });

  it("validates one selected answer per question and routes to the result after submit", async () => {
    mockFetch({
      "/api/student/self-checks/test-1": {
        id: "test-1",
        title: "Sức khỏe cảm xúc",
        description: "Một bài ngắn để em nhìn lại cảm xúc gần đây.",
        status: "published",
        is_active: true,
        is_demo: true,
        questions: [
          {
            id: "question-1",
            text: "Hôm nay em thấy thế nào?",
            sort_order: 1,
            is_demo: true,
            choices: [
              { id: "choice-1", text: "Khá ổn", sort_order: 1, is_demo: true },
              { id: "choice-2", text: "Cần thêm hỗ trợ", sort_order: 2, is_demo: true },
            ],
          },
        ],
      },
      "/api/student/self-checks/test-1/attempts": {
        attempt_id: "attempt-1",
        test_id: "test-1",
        test_title: "Sức khỏe cảm xúc",
        state_label: "On dinh",
        supportive_headline: "Em đang có nhiều dấu hiệu ổn định.",
        suggested_next_action: "Tiếp tục giữ thói quen giúp em thấy an toàn và thoải mái.",
        score: 1,
        completed_at: "2026-05-21T00:00:00Z",
        is_demo: true,
      },
    });

    render(<SelfCheckTakePage params={{ testId: "test-1" }} />);

    expect(await screen.findByText("Câu 1 / 1")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Gửi câu trả lời" }));
    expect(
      screen.getByText("Hãy chọn một câu trả lời phù hợp nhất với em trước khi tiếp tục."),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "Khá ổn" }));
    await userEvent.click(screen.getByRole("button", { name: "Gửi câu trả lời" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/student/self-checks/results/attempt-1"));
  });

  it("shows result detail with supportive content before secondary score metadata", async () => {
    mockFetch({
      "/api/student/self-checks/history/attempt-1": {
        attempt_id: "attempt-1",
        test_id: "test-1",
        test_title: "Sức khỏe cảm xúc",
        state_label: "Can chu y",
        supportive_headline: "Có một vài dấu hiệu em nên để ý thêm.",
        short_comment: "Em đã nhận ra điều mình đang trải qua.",
        advice_summary: "Thử ghi lại điều làm em thấy nhẹ hơn.",
        support_suggestion: "Chia sẻ với một người em tin tưởng nếu cần.",
        positive_content: "Một bước nhỏ cũng đáng được ghi nhận.",
        suggested_next_action: "Thử một tình huống luyện kỹ năng hoặc chia sẻ với người em tin tưởng.",
        score: 5,
        completed_at: "2026-05-21T00:00:00Z",
        is_demo: true,
        answers: [],
      },
    });

    render(<SelfCheckResultPage params={{ attemptId: "attempt-1" }} />);

    expect(await screen.findByRole("heading", { name: "Có một vài dấu hiệu em nên để ý thêm." })).toBeInTheDocument();
    expect(screen.getByText("Cần quan tâm")).toBeInTheDocument();
    expect(screen.getByText("Thử một tình huống luyện kỹ năng hoặc chia sẻ với người em tin tưởng.")).toBeInTheDocument();
    expect(screen.getByText("Điểm tham khảo: 5")).toBeInTheDocument();
    expect(
      screen.getByText("Điểm này chỉ giúp Peerlight AI chọn gợi ý phù hợp, không phải chẩn đoán."),
    ).toBeInTheDocument();
    const backLinks = screen.getAllByRole("link", { name: "Quay lại danh sách" });
    expect(backLinks).toHaveLength(2);
    backLinks.forEach((link) => expect(link).toHaveAttribute("href", "/student/self-checks"));
    expect(screen.getByRole("link", { name: "Xem tình huống xử lý thực tế" })).toHaveAttribute(
      "href",
      "/student/scenarios",
    );
  });

  it("shows self-check history summaries and private raw answer detail", async () => {
    mockFetch({
      "/api/student/self-checks/history": {
        items: [
          {
            attempt_id: "attempt-1",
            test_id: "test-1",
            test_title: "Sức khỏe cảm xúc",
            state_label: "On dinh",
            supportive_headline: "Em đang có nhiều dấu hiệu ổn định.",
            suggested_next_action: "Tiếp tục giữ thói quen giúp em thấy an toàn và thoải mái.",
            completed_at: "2026-05-21T00:00:00Z",
            is_demo: true,
          },
        ],
      },
      "/api/student/self-checks/history/attempt-1": {
        attempt_id: "attempt-1",
        test_id: "test-1",
        test_title: "Sức khỏe cảm xúc",
        state_label: "On dinh",
        supportive_headline: "Em đang có nhiều dấu hiệu ổn định.",
        score: 2,
        completed_at: "2026-05-21T00:00:00Z",
        is_demo: true,
        answers: [
          {
            question_id: "question-1",
            choice_id: "choice-1",
            question_text_snapshot: "Hôm nay em thấy thế nào?",
            choice_text_snapshot: "Khá ổn",
            score_value_snapshot: 1,
            sort_order: 1,
            is_demo: true,
          },
        ],
      },
    });

    render(
      <>
        <SelfCheckHistoryPage />
        <SelfCheckHistoryDetailPage params={{ attemptId: "attempt-1" }} />
      </>,
    );

    expect(await screen.findByText("Lịch sử test tâm lý")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sức khỏe cảm xúc/ })).toHaveAttribute(
      "href",
      "/student/self-checks/history/attempt-1",
    );
    await waitFor(() =>
      expect(
        screen.getAllByText(
          "Câu trả lời chi tiết là riêng tư với em theo mặc định. Người lớn được liên kết chỉ xem phần tóm tắt cần thiết để hỗ trợ em.",
        ).length,
      ).toBeGreaterThan(0),
    );
    expect(
      screen.getByText("Nội dung này là bản ghi tại thời điểm em hoàn thành test tâm lý."),
    ).toBeInTheDocument();
    expect(screen.getByText("Hôm nay em thấy thế nào?")).toBeInTheDocument();
    expect(screen.getByText("Khá ổn")).toBeInTheDocument();
  });
});

describe("student scenario UI flow", () => {
  beforeEach(() => {
    push.mockReset();
    vi.restoreAllMocks();
  });

  it("lists scenarios with skill tags, demo badges, and history link", async () => {
    mockFetch({
      "/api/student/scenarios": [
        {
          id: "scenario-1",
          title: "Khi bạn rủ rê bỏ tiết",
          situation: "Một nhóm bạn muốn em bỏ tiết để đi chơi.",
          skill_tag: "Từ chối an toàn",
          status: "published",
          is_demo: true,
        },
      ],
      "/api/student/scenarios/history": { items: [] },
    });

    render(<ScenarioListPage />);

    expect(await screen.findByText("Tình huống xử lý thực tế")).toBeInTheDocument();
    expect(
      screen.getByText("Chọn một tình huống gần với đời sống học đường để thử cách phản hồi an toàn hơn."),
    ).toBeInTheDocument();
    expect(screen.getByText("Từ chối an toàn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Thực hành" })).toHaveAttribute("href", "/student/scenarios/scenario-1");
    expect(screen.getByRole("heading", { name: "Lịch sử tình huống" })).toBeInTheDocument();
    expect(screen.getByText("Sau khi chọn cách phản hồi trong một tình huống, lịch sử luyện tập sẽ hiển thị ở đây.")).toBeInTheDocument();
  });

  it("saves one scenario response and shows constructive feedback snapshots", async () => {
    mockFetch({
      "/api/student/scenarios/scenario-1": {
        id: "scenario-1",
        title: "Khi bạn rủ rê bỏ tiết",
        situation: "Một nhóm bạn muốn em bỏ tiết để đi chơi.",
        skill_tag: "Từ chối an toàn",
        status: "published",
        is_demo: true,
        recommended_response: "Em có thể nói em muốn vào lớp và hẹn gặp sau giờ học.",
        lesson: "Nói rõ ranh giới giúp em giữ an toàn mà vẫn tôn trọng bạn.",
        choices: [
          {
            id: "choice-1",
            text: "Em nói nhẹ nhàng rằng em muốn vào lớp.",
            signal: "constructive",
            feedback: "Lựa chọn này có điểm tích cực vì em nói rõ điều mình cần.",
            sort_order: 1,
            is_demo: true,
          },
          {
            id: "choice-2",
            text: "Em im lặng đi theo nhóm.",
            signal: "risky",
            feedback: "Lựa chọn này có thể khiến tình huống khó hơn vì em chưa nói điều mình cần.",
            sort_order: 2,
            is_demo: true,
          },
        ],
      },
      "/api/student/scenarios/scenario-1/attempts": {
        attempt_id: "attempt-1",
        scenario_id: "scenario-1",
        selected_choice_id: "choice-1",
        selected_choice: "Em nói nhẹ nhàng rằng em muốn vào lớp.",
        signal: "constructive",
        feedback: "Lựa chọn này có điểm tích cực vì em nói rõ điều mình cần.",
        recommended_response: "Em có thể nói em muốn vào lớp và hẹn gặp sau giờ học.",
        lesson: "Nói rõ ranh giới giúp em giữ an toàn mà vẫn tôn trọng bạn.",
        skill_tag: "Từ chối an toàn",
        completed_at: "2026-05-21T00:00:00Z",
        is_demo: true,
      },
    });

    render(<ScenarioDetailPage params={{ scenarioId: "scenario-1" }} />);

    expect(await screen.findByText("Khi bạn rủ rê bỏ tiết")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Em nói nhẹ nhàng rằng em muốn vào lớp." }));
    await userEvent.click(screen.getByRole("button", { name: "Chọn cách phản hồi này" }));

    expect(await screen.findByText("Lời khuyên")).toBeInTheDocument();
    expect(screen.getByText("Lựa chọn có điểm tích cực")).toBeInTheDocument();
    expect(screen.getByText("Lời khuyên nên thử")).toBeInTheDocument();
    expect(screen.getByText("Lời khuyên để nhớ")).toBeInTheDocument();
    expect(screen.getAllByText(/Kỹ năng liên quan:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Từ chối an toàn").length).toBeGreaterThan(0);
  });

  it("shows empty scenario history with exact supportive copy", async () => {
    mockFetch({
      "/api/student/scenarios/history": { items: [] },
    });

    render(<ScenarioHistoryPage />);

    expect(await screen.findByText("Em chưa thử tình huống nào")).toBeInTheDocument();
    expect(
      screen.getByText("Sau khi chọn cách phản hồi trong một tình huống, lịch sử luyện tập sẽ hiển thị ở đây."),
    ).toBeInTheDocument();
  });
});
