import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  const fetchMock = vi.fn((url: string) => {
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
    support_suggestion: "Hỏi em cần hỗ trợ gì và nhắc em chọn người lớn tin tưởng.",
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

const supportOverview = [
  {
    student: {
      id: "student-1",
      full_name: "Nguyễn An Demo",
      school: "Trường THPT BeYou Demo",
      class_name: "10A1",
    },
    latest_self_check_summary: {
      support_suggestion: "Hỏi em cần hỗ trợ gì và nhắc em chọn người lớn tin tưởng.",
    },
    latest_sos_alert: null,
    open_sos_count: 0,
    warning_group: "can_quan_tam",
    warning_group_label: "Cần quan tâm",
    is_demo: true,
  },
];

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

  it("renders current teacher and parent dashboards", async () => {
    mockFetch({
      "/api/teacher/students": [linkedStudent],
      "/api/parent/students": [linkedStudent],
      "/api/teacher/support-overview": supportOverview,
      "/api/parent/support-overview": supportOverview,
      "/api/notifications": [],
    });

    const { rerender } = render(<TeacherDashboardPage />);
    expect(await screen.findByText("Xin chào, thầy/cô! 👋")).toBeInTheDocument();
    expect(screen.getByText("Học sinh liên kết")).toBeInTheDocument();
    expect(screen.getByText("1 học sinh đang được đồng hành")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem danh sách" })).toHaveAttribute("href", "/teacher/students");
    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute("href", "/teacher/chat");

    rerender(<ParentDashboardPage />);
    expect(await screen.findByText("Xin chào, phụ huynh! 👋")).toBeInTheDocument();
    expect(screen.getByText("Con của bạn")).toBeInTheDocument();
    expect(screen.getByText("1 con đang được đồng hành")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem thông tin" })).toHaveAttribute("href", "/parent/students");
    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute("href", "/parent/chat");
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
      screen.getByText("Peerlight AI không hiển thị câu trả lời riêng tư của học sinh tại đây. Nội dung này chỉ nhằm hỗ trợ em đúng lúc."),
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
    expect(screen.getByText("Tóm tắt này dùng để mở lời hỗ trợ, không phải theo dõi hay xếp hạng học sinh.")).toBeInTheDocument();

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

    expect(await screen.findByRole("link", { name: /Nội dung test & tình huống/ })).toHaveAttribute(
      "href",
      "/admin/content",
    );
    expect(screen.getByText("Quản lý bài tự kiểm tra và tình huống luyện tập")).toBeInTheDocument();
    expect(screen.getByText("Cấu hình nội dung")).toBeInTheDocument();
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

  it("renders master-detail content editors with lifecycle controls", async () => {
    mockFetch({
      "/api/admin/content/self-checks": [selfCheckContent],
      "/api/admin/content/scenarios": [scenarioContent],
    });

    render(<AdminContentPage />);

    expect(await screen.findByText("Quản lý nội dung")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bài tự kiểm tra/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tình huống/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tạo mới/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Sức khỏe cảm xúc/ }));

    expect(screen.getByRole("button", { name: /Quay lại danh sách/ })).toBeInTheDocument();
    expect(screen.getByText("Chỉnh sửa bài tự kiểm tra")).toBeInTheDocument();
    expect(screen.getByLabelText("Tên bài")).toBeInTheDocument();
    expect(screen.getByLabelText("Mô tả ngắn")).toBeInTheDocument();
    expect(screen.getByLabelText("Trạng thái nội dung")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    expect(screen.getByLabelText("Nội dung câu hỏi")).toBeInTheDocument();
    expect(screen.getByLabelText("Lựa chọn 1")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Điểm").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    expect(screen.getByLabelText("Mức")).toBeInTheDocument();
    expect(screen.getByLabelText("Min")).toBeInTheDocument();
    expect(screen.getByLabelText("Max")).toBeInTheDocument();
    expect(screen.getByLabelText("Nhận xét")).toBeInTheDocument();
    expect(screen.getByLabelText("Gợi ý")).toBeInTheDocument();
    expect(screen.getByLabelText("Nội dung tích cực")).toBeInTheDocument();
    expect(screen.getByLabelText("Hành động tiếp theo")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xuất bản" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Xóa" }).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: /Quay lại danh sách/ }));
    await userEvent.click(screen.getByRole("button", { name: /Tình huống/ }));
    expect(screen.getByRole("button", { name: /Tạo mới/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Rủ rê sau giờ học/ }));

    expect(screen.getByText("Chỉnh sửa tình huống")).toBeInTheDocument();
    expect(screen.getByLabelText("Tiêu đề")).toBeInTheDocument();
    expect(screen.getByLabelText("Mô tả tình huống")).toBeInTheDocument();
    expect(screen.getByLabelText("Kỹ năng liên quan")).toBeInTheDocument();
    expect(screen.getByLabelText("Trạng thái")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    expect(screen.getAllByLabelText("Nội dung").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Tín hiệu").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Phản hồi").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    expect(screen.getByLabelText("Cách phản hồi nên thử")).toBeInTheDocument();
    expect(screen.getByLabelText("Điều em có thể rút ra")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu trữ" })).toBeInTheDocument();
  });

  it("adds and saves additional self-check questions, choices, and thresholds", async () => {
    const fetchMock = mockFetch({
      "/api/admin/content/self-checks": [selfCheckContent],
      "/api/admin/content/scenarios": [scenarioContent],
      "/api/admin/content/self-checks/self-check-1": selfCheckContent,
    });

    render(<AdminContentPage />);

    await screen.findByText("Quản lý nội dung");
    await userEvent.click(screen.getByRole("button", { name: /Sức khỏe cảm xúc/ }));
    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));

    await userEvent.click(screen.getByRole("button", { name: /Thêm câu hỏi/ }));
    fireEvent.change(screen.getAllByLabelText("Nội dung câu hỏi")[1], {
      target: { value: "Em có người lớn tin cậy không?" },
    });
    fireEvent.change(screen.getAllByLabelText("Lựa chọn 1")[1], {
      target: { value: "Có, em có thể nói chuyện." },
    });
    fireEvent.change(screen.getAllByLabelText("Lựa chọn 2")[1], { target: { value: "Chưa chắc." } });
    fireEvent.change(screen.getAllByLabelText("Điểm")[3], { target: { value: "2" } });

    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    await userEvent.click(screen.getByRole("button", { name: /Thêm ngưỡng/ }));
    fireEvent.change(screen.getAllByLabelText("Min")[1], { target: { value: "2" } });
    fireEvent.change(screen.getAllByLabelText("Max")[1], { target: { value: "3" } });
    await userEvent.selectOptions(screen.getAllByLabelText("Mức")[1], "Can chu y");
    fireEvent.change(screen.getAllByLabelText("Nhận xét")[1], { target: { value: "Em nên được hỏi thăm thêm." } });
    fireEvent.change(screen.getAllByLabelText("Gợi ý")[1], { target: { value: "Chọn một bước an toàn." } });

    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

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
      advice: "Chọn một bước an toàn.",
    });
  });

  it("saves edits to non-first scenario choices", async () => {
    const fetchMock = mockFetch({
      "/api/admin/content/self-checks": [selfCheckContent],
      "/api/admin/content/scenarios": [scenarioContent],
      "/api/admin/content/scenarios/scenario-1": scenarioContent,
    });

    render(<AdminContentPage />);

    await screen.findByText("Quản lý nội dung");
    await userEvent.click(screen.getByRole("button", { name: /Tình huống/ }));
    await userEvent.click(screen.getByRole("button", { name: /Rủ rê sau giờ học/ }));
    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    fireEvent.change(screen.getAllByLabelText("Nội dung")[1], {
      target: { value: "Em dừng lại và gọi người lớn." },
    });
    fireEvent.change(screen.getAllByLabelText("Phản hồi")[1], {
      target: { value: "Dừng lại giúp em an toàn hơn." },
    });
    await userEvent.selectOptions(screen.getAllByLabelText("Tín hiệu")[1], "constructive");

    expect(screen.getByDisplayValue("Em dừng lại và gọi người lớn.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

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

    await screen.findByText("Quản lý nội dung");
    await userEvent.click(screen.getByRole("button", { name: /Sức khỏe cảm xúc/ }));
    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    await userEvent.click(screen.getByRole("button", { name: "Xuất bản" }));

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

    await screen.findByText("Quản lý nội dung");
    await userEvent.click(screen.getByRole("button", { name: /Sức khỏe cảm xúc/ }));
    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    const questionField = await screen.findByDisplayValue("Hôm nay em thấy thế nào?");
    await userEvent.clear(questionField);
    await userEvent.type(questionField, "Câu hỏi đã cập nhật");
    await userEvent.clear(screen.getAllByLabelText("Lựa chọn 1")[0]);
    await userEvent.type(screen.getAllByLabelText("Lựa chọn 1")[0], "Câu trả lời đã cập nhật");
    await userEvent.click(screen.getByRole("button", { name: "Tiếp theo" }));
    await userEvent.clear(screen.getAllByLabelText("Min")[0]);
    await userEvent.type(screen.getAllByLabelText("Min")[0], "1");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

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

    await screen.findByText("Quản lý nội dung");
    await userEvent.click(screen.getByRole("button", { name: /Tình huống/ }));
    await userEvent.click(screen.getByRole("button", { name: /Rủ rê sau giờ học/ }));
    await userEvent.click(screen.getByRole("button", { name: "Lưu trữ" }));
    expect(
      screen.getByText("Lưu trữ nội dung này? Học sinh sẽ không còn thấy nội dung này, nhưng lịch sử đã hoàn thành vẫn được giữ."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Giữ nội dung" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu trữ nội dung" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Giữ nội dung" }));
    await userEvent.click(screen.getByRole("button", { name: /Quay lại danh sách/ }));
    await userEvent.click(screen.getByRole("button", { name: /Bài tự kiểm tra/ }));
    await userEvent.click(screen.getByRole("button", { name: /Sức khỏe cảm xúc/ }));
    await userEvent.click(screen.getAllByRole("button", { name: "Xóa" }).at(-1)!);
    expect(
      screen.getByText("Xóa bản nháp chưa dùng này? Chỉ dùng thao tác này khi nội dung chưa từng được học sinh hoàn thành."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xóa bản nháp" })).toBeInTheDocument();
  });

  it("confirms and deletes a scenario draft from the scenario lifecycle controls", async () => {
    const draftScenarioContent = { ...scenarioContent, status: "draft" as const };
    const fetchMock = mockFetch({
      "/api/admin/content/self-checks": [selfCheckContent],
      "/api/admin/content/scenarios": [draftScenarioContent],
      "/api/admin/content/scenarios/scenario-1": draftScenarioContent,
    });

    render(<AdminContentPage />);

    await screen.findByText("Quản lý nội dung");
    await userEvent.click(screen.getByRole("button", { name: /Tình huống/ }));
    await userEvent.click(screen.getByRole("button", { name: /Rủ rê sau giờ học/ }));
    await userEvent.click(screen.getAllByRole("button", { name: "Xóa" }).at(-1)!);
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
