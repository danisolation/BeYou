import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ParentSummaryPage from "@/app/(authenticated)/parent/students/[studentId]/self-check-summaries/page";
import ParentDashboardPage from "@/app/(authenticated)/parent/page";
import TeacherSummaryPage from "@/app/(authenticated)/teacher/students/[studentId]/self-check-summaries/page";
import TeacherDashboardPage from "@/app/(authenticated)/teacher/page";
import { getParentSelfCheckSummaries, getTeacherSelfCheckSummaries } from "@/lib/adult-summary-api";

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
