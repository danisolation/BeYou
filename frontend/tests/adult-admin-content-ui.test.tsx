import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminContentPage from "@/app/(authenticated)/admin/content/page";
import AdminDashboardPage from "@/app/(authenticated)/admin/page";
import ParentSummaryPage from "@/app/(authenticated)/parent/students/[studentId]/self-check-summaries/page";
import ParentDashboardPage from "@/app/(authenticated)/parent/page";
import TeacherSummaryPage from "@/app/(authenticated)/teacher/students/[studentId]/self-check-summaries/page";
import TeacherDashboardPage from "@/app/(authenticated)/teacher/page";
import {
  archiveAdminScenario,
  createAdminSelfCheck,
  deleteDraftAdminScenario,
  deleteDraftAdminSelfCheck,
  type AdminScenarioContent,
  type AdminSelfCheckContent,
  listAdminScenarios,
  listAdminSelfChecks,
  publishAdminSelfCheck,
  updateAdminScenario,
} from "@/lib/admin-content-api";
import { getParentSelfCheckSummaries, getTeacherSelfCheckSummaries } from "@/lib/adult-summary-api";

function mockFetch(responses: Record<string, unknown>) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const body = responses[path];
    if (body instanceof Response) {
      return Promise.resolve(body);
    }
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

const linkedStudent = {
  id: "student-1",
  full_name: "Nguyễn An Demo",
  email: "student.demo@beyou.local",
  school: "Trường THPT BeYou Demo",
  class_name: "10A1",
  relationship_type: "teacher",
  link_status: "active",
  is_demo: true,
};

const adultSummary = {
  student: {
    id: "student-1",
    full_name: "Nguyễn An Demo",
    school: "Trường THPT BeYou Demo",
    class_name: "10A1",
    is_demo: true,
  },
  latest_summary: {
    attempt_id: "attempt-1",
    test_title: "Sức khỏe cảm xúc",
    state_label: "Can chu y",
    completed_at: "2026-05-21T00:00:00Z",
    advice_summary: "Em nên để ý thêm cảm xúc trong ngày.",
    support_suggestion: "Hỏi em cần hỗ trợ gì và nhắc em chọn người lớn tin cậy.",
    is_demo: true,
  },
  recent_summaries: [
    {
      attempt_id: "attempt-2",
      test_title: "Áp lực bạn bè",
      state_label: "On dinh",
      completed_at: "2026-05-20T00:00:00Z",
      advice_summary: "Em đang có nhiều dấu hiệu ổn định.",
      support_suggestion: "Tiếp tục khích lệ em giữ thói quen an toàn.",
      is_demo: true,
    },
  ],
};

describe("adult summary-only UI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses teacher and parent summary API paths without browser token storage", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchMock = mockFetch({
      "/api/teacher/students/student-1/self-check-summaries": adultSummary,
      "/api/parent/students/student-1/self-check-summaries": adultSummary,
    });

    await getTeacherSelfCheckSummaries("student-1");
    await getParentSelfCheckSummaries("student-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/teacher/students/student-1/self-check-summaries",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/parent/students/student-1/self-check-summaries",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(localStorageSpy).not.toHaveBeenCalled();
  });

  it("adds summary support links to teacher and parent dashboards", async () => {
    mockFetch({
      "/api/teacher/students": [linkedStudent],
      "/api/parent/students": [linkedStudent],
    });

    const { rerender } = render(<TeacherDashboardPage />);
    expect(await screen.findByText("Tóm tắt tự kiểm tra được phép xem")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem tóm tắt hỗ trợ" })).toHaveAttribute(
      "href",
      "/teacher/students/student-1/self-check-summaries",
    );

    rerender(<ParentDashboardPage />);
    expect(await screen.findByText("Tóm tắt hỗ trợ của con")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem tóm tắt hỗ trợ" })).toHaveAttribute(
      "href",
      "/parent/students/student-1/self-check-summaries",
    );
  });

  it("renders teacher summary detail with privacy boundaries and no raw answer exposure", async () => {
    mockFetch({ "/api/teacher/students/student-1/self-check-summaries": adultSummary });

    render(<TeacherSummaryPage params={{ studentId: "student-1" }} />);

    expect(await screen.findByText("Tóm tắt được phép xem")).toBeInTheDocument();
    expect(screen.getByText("Tóm tắt gần nhất")).toBeInTheDocument();
    expect(screen.getByText("Các lần gần đây")).toBeInTheDocument();
    expect(screen.getAllByText("Tóm tắt gợi ý")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Gợi ý hỗ trợ")[0]).toBeInTheDocument();
    expect(
      screen.getByText("BeYou không hiển thị câu trả lời riêng tư của học sinh tại đây. Nội dung này chỉ nhằm hỗ trợ em đúng lúc."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bạn đang xem phần tóm tắt được phép xem, không phải toàn bộ câu trả lời riêng tư của học sinh."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/raw answer|answer_text|score_breakdown|scenario/i)).not.toBeInTheDocument();
  });

  it("renders parent summary detail with allowed summary-only copy", async () => {
    mockFetch({ "/api/parent/students/student-1/self-check-summaries": adultSummary });

    render(<ParentSummaryPage params={{ studentId: "student-1" }} />);

    expect(await screen.findByText("Tóm tắt được phép xem")).toBeInTheDocument();
    expect(screen.getByText("Tóm tắt hỗ trợ của con")).toBeInTheDocument();
    expect(screen.getByText("học sinh cần được quan tâm")).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText("Đang tải thông tin...")).not.toBeInTheDocument());
  });
});

const selfCheckContent: AdminSelfCheckContent = {
  id: "self-check-1",
  title: "Sức khỏe cảm xúc",
  description: "Một bài ngắn để học sinh nhìn lại cảm xúc.",
  status: "draft",
  is_active: true,
  is_demo: true,
  created_at: "2026-05-21T00:00:00Z",
  updated_at: "2026-05-21T00:00:00Z",
  questions: [
    {
      id: "question-1",
      text: "Hôm nay em thấy thế nào?",
      sort_order: 1,
      is_demo: true,
      choices: [
        { id: "choice-1", text: "Khá ổn", score_value: 0, sort_order: 1, is_demo: true },
        { id: "choice-2", text: "Cần thêm hỗ trợ", score_value: 2, sort_order: 2, is_demo: true },
      ],
    },
  ],
  thresholds: [
    {
      id: "threshold-1",
      state_label: "On dinh",
      min_score: 0,
      max_score: 1,
      comment: "Em đang ổn định.",
      advice: "Tiếp tục giữ thói quen an toàn.",
      positive_content: "Em đã nhận ra điều hỗ trợ mình.",
      suggested_next_action: "Nói chuyện với người tin tưởng khi cần.",
      is_demo: true,
    },
  ],
};

const scenarioContent: AdminScenarioContent = {
  id: "scenario-1",
  title: "Rủ rê sau giờ học",
  situation: "Bạn rủ em làm điều em chưa sẵn sàng.",
  skill_tag: "Từ chối an toàn",
  status: "published",
  recommended_response: "Em có thể nói rõ ranh giới và rời đi.",
  lesson: "Tạm dừng giúp em chọn phản hồi an toàn hơn.",
  is_demo: true,
  created_at: "2026-05-21T00:00:00Z",
  updated_at: "2026-05-21T00:00:00Z",
  choices: [
    {
      id: "scenario-choice-1",
      text: "Em nói không và tìm bạn khác.",
      signal: "constructive",
      feedback: "Lựa chọn này có điểm tích cực vì em giữ ranh giới.",
      sort_order: 1,
      is_demo: true,
    },
    {
      id: "scenario-choice-2",
      text: "Em làm theo dù không thoải mái.",
      signal: "risky",
      feedback: "Lựa chọn này có thể khiến tình huống khó hơn.",
      sort_order: 2,
      is_demo: true,
    },
  ],
};

describe("admin content management UI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("adds admin content dashboard card with exact copy", async () => {
    mockFetch({
      "/api/admin/users": [{ id: "admin-1" }],
      "/api/admin/links": [],
    });

    render(<AdminDashboardPage />);

    expect(await screen.findByRole("link", { name: /Nội dung tự kiểm tra và tình huống/ })).toHaveAttribute(
      "href",
      "/admin/content",
    );
    expect(screen.getByText("Tạo, chỉnh sửa và xuất bản nội dung hỗ trợ học sinh theo đúng phạm vi an toàn.")).toBeInTheDocument();
    expect(screen.getByText("Quản lý nội dung")).toBeInTheDocument();
  });

  it("uses admin content API helpers for lifecycle endpoints", async () => {
    const fetchMock = mockFetch({
      "/api/admin/content/self-checks": [selfCheckContent],
      "/api/admin/content/scenarios": [scenarioContent],
      "/api/admin/content/self-checks/self-check-1/publish": selfCheckContent,
      "/api/admin/content/self-checks/self-check-1": selfCheckContent,
      "/api/admin/content/scenarios/scenario-1": scenarioContent,
      "/api/admin/content/scenarios/scenario-1/archive": scenarioContent,
    });

    await listAdminSelfChecks();
    await listAdminScenarios();
    await createAdminSelfCheck(selfCheckContent);
    await publishAdminSelfCheck("self-check-1");
    await updateAdminScenario("scenario-1", scenarioContent);
    await archiveAdminScenario("scenario-1");
    await deleteDraftAdminSelfCheck("self-check-1");
    await deleteDraftAdminScenario("scenario-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/admin/content/self-checks",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/admin/content/self-checks",
      expect.objectContaining({ method: "POST", body: JSON.stringify(selfCheckContent) }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/admin/content/self-checks/self-check-1/publish",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/admin/content/scenarios/scenario-1/archive",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/admin/content/self-checks/self-check-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/admin/content/scenarios/scenario-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("renders nested self-check and scenario editors with lifecycle controls", async () => {
    mockFetch({
      "/api/admin/content/self-checks": [selfCheckContent],
      "/api/admin/content/scenarios": [scenarioContent],
    });

    render(<AdminContentPage />);

    expect(await screen.findByText("Quản lý bài tự kiểm tra")).toBeInTheDocument();
    expect(screen.getByText("Quản lý tình huống")).toBeInTheDocument();
    expect(screen.getByLabelText("Tên bài tự kiểm tra")).toBeInTheDocument();
    expect(screen.getByLabelText("Mô tả ngắn")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Trạng thái nội dung")[0]).toBeInTheDocument();
    expect(screen.getByLabelText("Câu hỏi tự kiểm tra")).toBeInTheDocument();
    expect(screen.getByLabelText("Lựa chọn trả lời")).toBeInTheDocument();
    expect(screen.getByLabelText("Giá trị điểm")).toBeInTheDocument();
    expect(screen.getByLabelText("Nhãn trạng thái")).toBeInTheDocument();
    expect(screen.getByLabelText("Điểm tối thiểu")).toBeInTheDocument();
    expect(screen.getByLabelText("Điểm tối đa")).toBeInTheDocument();
    expect(screen.getByLabelText("Nhận xét")).toBeInTheDocument();
    expect(screen.getByLabelText("Tóm tắt gợi ý")).toBeInTheDocument();
    expect(screen.getByLabelText("Nội dung tích cực")).toBeInTheDocument();
    expect(screen.getByLabelText("Hành động tiếp theo gợi ý")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm câu hỏi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm ngưỡng điểm" })).toBeInTheDocument();
    expect(screen.getByLabelText("Tiêu đề tình huống")).toBeInTheDocument();
    expect(screen.getByLabelText("Mô tả tình huống")).toBeInTheDocument();
    expect(screen.getByLabelText("Lựa chọn phản hồi")).toBeInTheDocument();
    expect(screen.getByLabelText("Tín hiệu constructive/risky")).toBeInTheDocument();
    expect(screen.getByLabelText("Phản hồi cho lựa chọn")).toBeInTheDocument();
    expect(screen.getByLabelText("Cách phản hồi nên thử")).toBeInTheDocument();
    expect(screen.getByLabelText("Điều em có thể rút ra")).toBeInTheDocument();
    expect(screen.getByLabelText("Kỹ năng liên quan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm lựa chọn tình huống" })).toBeInTheDocument();
    expect(screen.getByText("Bản xem trước câu hỏi")).toBeInTheDocument();
    expect(screen.getByText("Bản xem trước ngưỡng điểm")).toBeInTheDocument();
    expect(screen.getByText("Bản xem trước lựa chọn")).toBeInTheDocument();
    expect(screen.getByText("Bài học và phản hồi gợi ý")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu bản nháp" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Xuất bản" })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Lưu trữ" })[0]).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xóa bản nháp chưa dùng" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xóa bản nháp tình huống chưa dùng" })).toBeInTheDocument();
  });

  it("adds and saves additional self-check questions, choices, thresholds, and preview content", async () => {
    const fetchMock = mockFetch({
      "/api/admin/content/self-checks": [selfCheckContent],
      "/api/admin/content/scenarios": [scenarioContent],
      "/api/admin/content/self-checks/self-check-1": selfCheckContent,
    });

    render(<AdminContentPage />);

    await screen.findByText("Quản lý bài tự kiểm tra");
    await userEvent.click(screen.getByRole("button", { name: "Thêm câu hỏi" }));
    await userEvent.type(screen.getByLabelText("Câu hỏi tự kiểm tra 2"), "Em có người lớn tin cậy không?");
    await userEvent.type(screen.getByLabelText("Lựa chọn trả lời 2.1"), "Có, em có thể nói chuyện.");
    await userEvent.type(screen.getByLabelText("Lựa chọn trả lời 2.2"), "Chưa chắc.");
    await userEvent.clear(screen.getByLabelText("Giá trị điểm 2.2"));
    await userEvent.type(screen.getByLabelText("Giá trị điểm 2.2"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Thêm ngưỡng điểm" }));
    await userEvent.clear(screen.getByLabelText("Điểm tối thiểu 2"));
    await userEvent.type(screen.getByLabelText("Điểm tối thiểu 2"), "2");
    await userEvent.clear(screen.getByLabelText("Điểm tối đa 2"));
    await userEvent.type(screen.getByLabelText("Điểm tối đa 2"), "3");
    await userEvent.selectOptions(screen.getByLabelText("Nhãn trạng thái 2"), "Can chu y");
    await userEvent.type(screen.getByLabelText("Nhận xét 2"), "Em nên được hỏi thăm thêm.");
    await userEvent.type(screen.getByLabelText("Tóm tắt gợi ý 2"), "Chọn một bước an toàn.");
    await userEvent.type(screen.getByLabelText("Hành động tiếp theo gợi ý 2"), "Nói với người lớn tin cậy.");

    expect(screen.getByText("Em có người lớn tin cậy không?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Lưu bản nháp" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8000/api/admin/content/self-checks/self-check-1",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    const updateCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        url === "http://localhost:8000/api/admin/content/self-checks/self-check-1" &&
        init?.method === "PATCH",
    );
    const payload = JSON.parse(String(updateCall?.[1]?.body));

    expect(payload.questions).toHaveLength(2);
    expect(payload.questions[1].text).toBe("Em có người lớn tin cậy không?");
    expect(payload.questions[1].choices).toHaveLength(2);
    expect(payload.questions[1].choices[1]).toMatchObject({ text: "Chưa chắc.", score_value: 2, sort_order: 2 });
    expect(payload.thresholds).toHaveLength(2);
    expect(payload.thresholds[1]).toMatchObject({
      state_label: "Can chu y",
      min_score: 2,
      max_score: 3,
      comment: "Em nên được hỏi thăm thêm.",
    });
  });

  it("saves edits to non-first scenario choices and shows them in preview", async () => {
    const fetchMock = mockFetch({
      "/api/admin/content/self-checks": [selfCheckContent],
      "/api/admin/content/scenarios": [scenarioContent],
      "/api/admin/content/scenarios/scenario-1": scenarioContent,
    });

    render(<AdminContentPage />);

    await screen.findByText("Quản lý tình huống");
    await userEvent.clear(screen.getByLabelText("Lựa chọn phản hồi 2"));
    await userEvent.type(screen.getByLabelText("Lựa chọn phản hồi 2"), "Em dừng lại và gọi người lớn.");
    await userEvent.clear(screen.getByLabelText("Phản hồi cho lựa chọn 2"));
    await userEvent.type(screen.getByLabelText("Phản hồi cho lựa chọn 2"), "Dừng lại giúp em an toàn hơn.");
    await userEvent.selectOptions(screen.getByLabelText("Tín hiệu constructive/risky 2"), "constructive");

    expect(screen.getByText(/Em dừng lại và gọi người lớn/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Lưu bản nháp tình huống" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8000/api/admin/content/scenarios/scenario-1",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    const updateCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        url === "http://localhost:8000/api/admin/content/scenarios/scenario-1" &&
        init?.method === "PATCH",
    );
    const payload = JSON.parse(String(updateCall?.[1]?.body));

    expect(payload.choices).toHaveLength(2);
    expect(payload.choices[1]).toMatchObject({
      text: "Em dừng lại và gọi người lớn.",
      signal: "constructive",
      feedback: "Dừng lại giúp em an toàn hơn.",
    });
  });

  it("surfaces backend publish validation detail instead of generic failure copy", async () => {
    mockFetch({
      "/api/admin/content/self-checks": [selfCheckContent],
      "/api/admin/content/scenarios": [scenarioContent],
      "/api/admin/content/self-checks/self-check-1/publish": new Response(
        JSON.stringify({ detail: "Chưa thể xuất bản vì nội dung còn thiếu câu hỏi, lựa chọn hoặc ngưỡng điểm." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ),
    });

    render(<AdminContentPage />);

    await screen.findByText("Quản lý bài tự kiểm tra");
    await userEvent.click(screen.getAllByRole("button", { name: "Xuất bản" })[0]);

    expect(
      await screen.findByText("Chưa thể xuất bản vì nội dung còn thiếu câu hỏi, lựa chọn hoặc ngưỡng điểm."),
    ).toBeInTheDocument();
  });

  it("preserves existing self-check questions, choices, and thresholds when saving a single edited field", async () => {
    const multiQuestionSelfCheck = {
      ...selfCheckContent,
      questions: [
        ...selfCheckContent.questions,
        {
          id: "question-2",
          text: "Em có người lớn tin cậy để trò chuyện không?",
          sort_order: 2,
          is_demo: true,
          choices: [{ id: "choice-3", text: "Có", score_value: 0, sort_order: 1, is_demo: true }],
        },
      ],
      thresholds: [
        ...selfCheckContent.thresholds,
        {
          id: "threshold-2",
          state_label: "Can chu y",
          min_score: 2,
          max_score: 3,
          comment: "Em nên chú ý thêm.",
          advice: "Chọn một người lớn tin cậy để chia sẻ.",
          positive_content: "Em đang lắng nghe cảm xúc của mình.",
          suggested_next_action: "Thử ghi lại điều em cần hỗ trợ.",
          is_demo: true,
        },
      ],
    };
    const fetchMock = mockFetch({
      "/api/admin/content/self-checks": [multiQuestionSelfCheck],
      "/api/admin/content/scenarios": [scenarioContent],
      "/api/admin/content/self-checks/self-check-1": multiQuestionSelfCheck,
    });

    render(<AdminContentPage />);

    const questionField = await screen.findByDisplayValue("Hôm nay em thấy thế nào?");
    await userEvent.clear(questionField);
    await userEvent.type(questionField, "Câu hỏi đã cập nhật");
    await userEvent.clear(screen.getByLabelText("Lựa chọn trả lời"));
    await userEvent.type(screen.getByLabelText("Lựa chọn trả lời"), "Câu trả lời đã cập nhật");
    await userEvent.clear(screen.getByLabelText("Điểm tối thiểu"));
    await userEvent.type(screen.getByLabelText("Điểm tối thiểu"), "1");
    await userEvent.click(screen.getByRole("button", { name: "Lưu bản nháp" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8000/api/admin/content/self-checks/self-check-1",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    const updateCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        url === "http://localhost:8000/api/admin/content/self-checks/self-check-1" &&
        init?.method === "PATCH",
    );
    const payload = JSON.parse(String(updateCall?.[1]?.body));

    expect(payload.questions).toHaveLength(2);
    expect(payload.questions[0].text).toBe("Câu hỏi đã cập nhật");
    expect(payload.questions[0].choices).toHaveLength(2);
    expect(payload.questions[0].choices[0].text).toBe("Câu trả lời đã cập nhật");
    expect(payload.questions[0].choices[1]).toMatchObject({ id: "choice-2", text: "Cần thêm hỗ trợ" });
    expect(payload.questions[1]).toMatchObject({ id: "question-2", text: "Em có người lớn tin cậy để trò chuyện không?" });
    expect(payload.thresholds).toHaveLength(2);
    expect(payload.thresholds[0].min_score).toBe(1);
    expect(payload.thresholds[1]).toMatchObject({ id: "threshold-2", state_label: "Can chu y" });
  });

  it("shows exact destructive confirmation copy before archive and delete draft", async () => {
    mockFetch({
      "/api/admin/content/self-checks": [selfCheckContent],
      "/api/admin/content/scenarios": [scenarioContent],
    });

    render(<AdminContentPage />);

    await screen.findByText("Quản lý bài tự kiểm tra");
    await userEvent.click(screen.getAllByRole("button", { name: "Lưu trữ" })[0]);
    expect(
      screen.getByText("Lưu trữ nội dung này? Học sinh sẽ không còn thấy nội dung này, nhưng lịch sử đã hoàn thành vẫn được giữ."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Giữ nội dung" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu trữ nội dung" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Giữ nội dung" }));
    await userEvent.click(screen.getByRole("button", { name: "Xóa bản nháp chưa dùng" }));
    expect(
      screen.getByText("Xóa bản nháp chưa dùng này? Chỉ dùng thao tác này khi nội dung chưa từng được học sinh hoàn thành."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xóa bản nháp" })).toBeInTheDocument();
  });

  it("confirms and deletes a scenario draft from the scenario lifecycle controls", async () => {
    const fetchMock = mockFetch({
      "/api/admin/content/self-checks": [selfCheckContent],
      "/api/admin/content/scenarios": [scenarioContent],
      "/api/admin/content/scenarios/scenario-1": scenarioContent,
    });

    render(<AdminContentPage />);

    await screen.findByText("Quản lý tình huống");
    await userEvent.click(screen.getByRole("button", { name: "Xóa bản nháp tình huống chưa dùng" }));
    expect(
      screen.getByText("Xóa bản nháp chưa dùng này? Chỉ dùng thao tác này khi nội dung chưa từng được học sinh hoàn thành."),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Xóa bản nháp" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8000/api/admin/content/scenarios/scenario-1",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
  });
});
