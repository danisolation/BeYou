import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ParentSupportSummaryPage from "@/app/(authenticated)/parent/students/[studentId]/support-summary/page";
import TeacherDashboardPage from "@/app/(authenticated)/teacher/page";
import TeacherSupportSummaryPage from "@/app/(authenticated)/teacher/students/[studentId]/support-summary/page";

const teacherSummary = {
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
  privacy_notes: [
    "Bạn đang xem tóm tắt hỗ trợ được phép xem, không phải toàn bộ dữ liệu riêng tư của học sinh.",
    "Ghi chú cảm xúc chỉ hiển thị khi học sinh đã chủ động đồng ý chia sẻ.",
    "Mục tiêu là lắng nghe và hỗ trợ trong đúng phạm vi học sinh đã chọn.",
  ],
  shared_mood_notes: [],
  is_demo: true,
};

const parentSummary = {
  ...teacherSummary,
  support_plan: {
    ...teacherSummary.support_plan,
    shared_with_viewer: false,
    what_helps: null,
    what_does_not_help: null,
    preferred_contact_method: null,
    safe_contact_times: null,
    shareable_note: null,
  },
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
      support_suggestion: "Hỏi em cần được hỗ trợ thế nào hôm nay.",
    },
    latest_sos_alert: null,
    open_sos_count: 0,
    warning_group: "can_quan_tam",
    warning_group_label: "Cần hỗ trợ sớm",
    is_demo: true,
  },
];

function mockFetch() {
  const fetchMock = vi.fn((url: string) => {
    const path = new URL(url).pathname;
    if (path === "/api/teacher/students/student-1/support-summary") {
      return Promise.resolve(
        new Response(JSON.stringify(teacherSummary), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (path === "/api/parent/students/student-1/support-summary") {
      return Promise.resolve(
        new Response(JSON.stringify(parentSummary), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (path === "/api/teacher/students") {
      return Promise.resolve(
        new Response(
          JSON.stringify([
            {
              id: "student-1",
              full_name: "Nguyễn An Demo",
              email: "student.demo@beyou.local",
              school: "Trường THPT BeYou Demo",
              class_name: "10A1",
              relationship_type: "teacher",
              link_status: "active",
              is_demo: true,
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    }
    if (path === "/api/teacher/support-overview") {
      return Promise.resolve(new Response(JSON.stringify(supportOverview), { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    if (path === "/api/notifications") {
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    return Promise.resolve(new Response(JSON.stringify({ detail: "not found" }), { status: 404 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Phase 14 adult support summary UI", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders selected teacher support plan and mood trend without raw private notes", async () => {
    mockFetch();

    render(<TeacherSupportSummaryPage params={{ studentId: "student-1" }} />);

    expect(await screen.findByRole("heading", { name: "Tóm tắt hỗ trợ" })).toBeInTheDocument();
    expect(screen.getByText("Em dễ bình tĩnh hơn khi người lớn nói chậm.")).toBeInTheDocument();
    expect(screen.getByText("Em đồng ý chia sẻ ghi chú này.")).toBeInTheDocument();
    expect(screen.getAllByText(/Cần hỗ trợ sớm/).length).toBeGreaterThan(0);
    const rendered = document.body.textContent ?? "";
    expect(rendered).not.toMatch(/RAW_PRIVATE|private_note|context_tags|chat transcript/i);
    expect(screen.queryByRole("button", { name: /Xuất|Export|Tải xuống|xếp hạng/i })).not.toBeInTheDocument();
  });

  it("renders not-shared support plan state for linked parent while showing mood summary", async () => {
    mockFetch();

    render(<ParentSupportSummaryPage params={{ studentId: "student-1" }} />);

    expect(await screen.findByText("Học sinh chưa chia sẻ kế hoạch này với bạn, hoặc kế hoạch đang tạm dừng/ngừng chia sẻ.")).toBeInTheDocument();
    expect(screen.getAllByText(/Cần hỗ trợ sớm/).length).toBeGreaterThan(0);
    expect(document.body.textContent ?? "").not.toContain("Em dễ bình tĩnh hơn khi người lớn nói chậm.");
  });

  it("adds the redesigned teacher dashboard entry point to linked students", async () => {
    mockFetch();

    render(<TeacherDashboardPage />);

    expect(await screen.findByRole("heading", { name: "Học sinh đang đồng hành" })).toBeInTheDocument();
    expect(screen.getByText("1 học sinh đang được đồng hành")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem danh sách" })).toHaveAttribute("href", "/teacher/students");
  });
});
