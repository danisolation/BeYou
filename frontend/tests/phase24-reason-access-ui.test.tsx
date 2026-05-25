import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ParentSupportSummaryPage from "@/app/(authenticated)/parent/students/[studentId]/support-summary/page";
import TeacherSupportSummaryPage from "@/app/(authenticated)/teacher/students/[studentId]/support-summary/page";

const reasonRequiredDetail = {
  detail: {
    code: "access_reason_required",
    message: "Vui lòng chọn lý do hỗ trợ trước khi xem tóm tắt này.",
    allowed_reasons: [
      {
        code: "support_plan_context",
        label: "Xem bối cảnh kế hoạch hỗ trợ",
      },
      {
        code: "follow_up_after_checkin",
        label: "Theo dõi sau một check-in gần đây",
      },
    ],
    copy: [
      "Lý do này giúp minh bạch việc truy cập và chỉ được lưu trong audit metadata.",
      "Lý do không cấp thêm quyền; BeYou vẫn kiểm tra vai trò và liên kết đang hoạt động.",
    ],
  },
};

const supportSummary = {
  student: {
    id: "student-1",
    full_name: "Nguyễn An Demo",
    school: "Trường THPT BeYou Demo",
    class_name: "10A1",
  },
  support_plan: {
    status: "active",
    shared_with_viewer: true,
    selected_adult_count: 1,
    what_helps: "Em dễ bình tĩnh hơn khi người lớn nói chậm.",
    what_does_not_help: "Đừng hỏi dồn dập.",
    preferred_contact_method: "Nhắn tin trước khi gọi.",
    safe_contact_times: "Sau giờ học.",
    shareable_note: "Em đồng ý chia sẻ ghi chú này.",
    updated_at: "2026-05-22T00:00:00Z",
  },
  mood_summary: {
    latest_checkin_at: "2026-05-22T01:00:00Z",
    latest_trend_label: "Cần hỗ trợ sớm",
    recent_checkin_count: 1,
    high_concern_count: 1,
    recent_trend_labels: ["Cần hỗ trợ sớm"],
    suggested_supportive_action: "Hỏi em cần được hỗ trợ thế nào hôm nay.",
  },
  shared_mood_notes: [
    {
      id: "share-1",
      mood_checkin_id: "mood-1",
      shared_at: "2026-05-22T02:00:00Z",
      mood_created_at: "2026-05-22T01:00:00Z",
      share_scope: "student_summary",
      content: "Em muốn cô biết hôm nay em hơi mệt.",
      relationship_type: "teacher",
      is_demo: true,
    },
  ],
  access_reason: {
    required: true,
    reason_code: "support_plan_context",
    reason_label: "Xem bối cảnh kế hoạch hỗ trợ",
    allowed_reasons: reasonRequiredDetail.detail.allowed_reasons,
  },
  privacy_notes: [
    "Bạn đang xem tóm tắt hỗ trợ được phép xem, không phải toàn bộ dữ liệu riêng tư của học sinh.",
    "Mục tiêu là lắng nghe và hỗ trợ trong đúng phạm vi học sinh đã chọn.",
  ],
  is_demo: true,
};

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function mockReasonGatedFetch() {
  const fetchMock = vi.fn((url: string) => {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const reasonCode = parsed.searchParams.get("reason_code");
    if (
      path === "/api/teacher/students/student-1/support-summary" ||
      path === "/api/parent/students/student-1/support-summary"
    ) {
      if (reasonCode === null) {
        return jsonResponse(reasonRequiredDetail, 428);
      }
      return jsonResponse({
        ...supportSummary,
        access_reason: {
          ...supportSummary.access_reason,
          reason_code: reasonCode,
          reason_label:
            reasonCode === "follow_up_after_checkin"
              ? "Theo dõi sau một check-in gần đây"
              : "Xem bối cảnh kế hoạch hỗ trợ",
        },
      });
    }
    return jsonResponse({ detail: "not found" }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Phase 24 reason-for-access UI", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("blocks protected teacher support content until a controlled reason is submitted", async () => {
    const fetchMock = mockReasonGatedFetch();

    render(<TeacherSupportSummaryPage params={{ studentId: "student-1" }} />);

    const prompt = await screen.findByText("Cho biết lý do hỗ trợ trước khi xem").then((node) => {
      const section = node.closest("section");
      if (section === null) {
        throw new Error("missing reason prompt");
      }
      return section;
    });
    expect(within(prompt).getByText("Lý do này giúp minh bạch việc truy cập và chỉ được lưu trong audit metadata.")).toBeInTheDocument();
    expect(within(prompt).getByText("Lý do không cấp thêm quyền; BeYou vẫn kiểm tra vai trò và liên kết đang hoạt động.")).toBeInTheDocument();
    expect(screen.queryByText("Em dễ bình tĩnh hơn khi người lớn nói chậm.")).not.toBeInTheDocument();
    expect(screen.queryByText("Em muốn cô biết hôm nay em hơi mệt.")).not.toBeInTheDocument();
    expect(within(prompt).getByRole("button", { name: "Tiếp tục xem tóm tắt" })).toBeDisabled();

    await userEvent.click(within(prompt).getByLabelText("Xem bối cảnh kế hoạch hỗ trợ"));
    await userEvent.click(within(prompt).getByRole("button", { name: "Tiếp tục xem tóm tắt" }));

    expect(await screen.findByText("Tóm tắt hỗ trợ được phép xem")).toBeInTheDocument();
    expect(screen.getByText("Em dễ bình tĩnh hơn khi người lớn nói chậm.")).toBeInTheDocument();
    expect(screen.getByText("Em muốn cô biết hôm nay em hơi mệt.")).toBeInTheDocument();
    expect(screen.getByText("Lý do truy cập đã ghi nhận")).toBeInTheDocument();
    expect(screen.getByText(/Xem bối cảnh kế hoạch hỗ trợ/)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url]) => new URL(String(url)).searchParams.get("reason_code") === "support_plan_context",
        ),
      ).toBe(true);
    });
  });

  it("reuses the reason prompt on parent support summaries", async () => {
    const fetchMock = mockReasonGatedFetch();

    render(<ParentSupportSummaryPage params={{ studentId: "student-1" }} />);

    const prompt = await screen.findByText("Cho biết lý do hỗ trợ trước khi xem").then((node) => node.closest("section"));
    if (prompt === null) {
      throw new Error("missing reason prompt");
    }
    await userEvent.click(within(prompt).getByLabelText("Theo dõi sau một check-in gần đây"));
    await userEvent.click(within(prompt).getByRole("button", { name: "Tiếp tục xem tóm tắt" }));

    expect(await screen.findByText("Tóm tắt hỗ trợ được phép xem")).toBeInTheDocument();
    expect(screen.getByText(/Theo dõi sau một check-in gần đây/)).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([url]) =>
          new URL(String(url)).pathname === "/api/parent/students/student-1/support-summary" &&
          new URL(String(url)).searchParams.get("reason_code") === "follow_up_after_checkin",
      ),
    ).toBe(true);
  });

  it("keeps prompt copy support-oriented and without free-text reason fields", async () => {
    mockReasonGatedFetch();

    render(<TeacherSupportSummaryPage params={{ studentId: "student-1" }} />);

    await screen.findByText("Cho biết lý do hỗ trợ trước khi xem");
    const rendered = document.body.textContent ?? "";
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(rendered).not.toMatch(/giám sát|tuân thủ|kỷ luật|xếp hạng|chẩn đoán/i);
  });
});
