import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentDashboardPage from "@/app/(authenticated)/student/page";
import StudentSupportPlanPage from "@/app/(authenticated)/student/support-plan/page";

const supportPlanResponse = {
  plan: null,
  available_adults: [
    {
      id: "teacher-1",
      full_name: "Cô Bình Demo",
      email: "teacher.demo@beyou.local",
      relationship_type: "teacher",
      is_demo: true,
    },
    {
      id: "parent-1",
      full_name: "Phụ huynh Chi Demo",
      email: "parent.demo@beyou.local",
      relationship_type: "parent",
      is_demo: true,
    },
  ],
  privacy_notes: [
    "Kế hoạch này chỉ gồm phần em chọn để chia sẻ với người lớn tin cậy.",
    "Ghi chú mood, câu trả lời tự kiểm tra và nội dung trò chuyện riêng tư không tự động được chia sẻ.",
    "Em có thể tạm dừng hoặc ngừng chia sẻ kế hoạch bất cứ lúc nào.",
  ],
  is_demo: true,
};

const savedSupportPlanResponse = {
  ...supportPlanResponse,
  plan: {
    id: "plan-1",
    status: "active",
    what_helps: "Nhắc em thở chậm.",
    what_does_not_help: null,
    preferred_contact_method: "Nhắn tin trước khi gọi.",
    safe_contact_times: null,
    shareable_note: "Em muốn được hỏi nhẹ nhàng.",
    selected_adults: [
      {
        id: "teacher-1",
        full_name: "Cô Bình Demo",
        relationship_type: "teacher",
        is_demo: true,
      },
    ],
    created_at: "2026-05-22T00:00:00Z",
    updated_at: "2026-05-22T00:00:00Z",
    paused_at: null,
    deactivated_at: null,
    is_demo: true,
  },
};

function mockSupportPlanFetch() {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    if (path === "/api/student/support-plan" && init?.method === "PUT") {
      return Promise.resolve(
        new Response(JSON.stringify(savedSupportPlanResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (path === "/api/student/support-plan") {
      return Promise.resolve(
        new Response(JSON.stringify(supportPlanResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    return Promise.resolve(new Response(JSON.stringify({ detail: "not found" }), { status: 404 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function mockDashboardFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const path = new URL(url).pathname;
      if (path === "/api/student/profile") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "student-1",
              full_name: "Nguyễn An Demo",
              email: "student.demo@beyou.local",
              school: "Trường THPT BeYou Demo",
              class_name: "10A1",
              is_demo: true,
              linked_adults: [],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ detail: "not found" }), { status: 404 }));
    }),
  );
}

describe("Phase 12 support plan UI", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders privacy boundaries, selected linked adults, and saves with cookie auth", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchMock = mockSupportPlanFetch();

    render(<StudentSupportPlanPage />);

    expect(await screen.findByText("Kế hoạch người lớn tin cậy")).toBeInTheDocument();
    expect(
      screen.getByText("Ghi chú mood, câu trả lời tự kiểm tra và nội dung trò chuyện riêng tư không tự động được chia sẻ."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Cô Bình Demo/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu kế hoạch hỗ trợ" })).toBeDisabled();

    await userEvent.click(screen.getByLabelText(/Cô Bình Demo/));
    await userEvent.type(screen.getByLabelText("Điều thường giúp em bình tĩnh hơn"), "Nhắc em thở chậm.");
    await userEvent.type(screen.getByLabelText("Cách liên hệ em thấy dễ nhận nhất"), "Nhắn tin trước khi gọi.");
    await userEvent.type(
      screen.getByLabelText("Ghi chú em đồng ý chia sẻ thêm (không bắt buộc)"),
      "Em muốn được hỏi nhẹ nhàng.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Lưu kế hoạch hỗ trợ" }));

    await waitFor(() => expect(screen.getByText("Đã lưu kế hoạch hỗ trợ của em.")).toBeInTheDocument());
    const putCall = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
    expect(putCall).toBeDefined();
    expect(putCall?.[0]).toBe("http://localhost:8000/api/student/support-plan");
    expect(putCall?.[1]).toEqual(expect.objectContaining({ credentials: "include" }));
    expect(JSON.parse(String(putCall?.[1]?.body))).toEqual(
      expect.objectContaining({
        adult_ids: ["teacher-1"],
        status: "active",
        what_helps: "Nhắc em thở chậm.",
        preferred_contact_method: "Nhắn tin trước khi gọi.",
        shareable_note: "Em muốn được hỏi nhẹ nhàng.",
      }),
    );
    expect(localStorageSpy).not.toHaveBeenCalled();
  });

  it("adds support plan entry to the student dashboard", async () => {
    mockDashboardFetch();

    render(<StudentDashboardPage />);

    expect(await screen.findByRole("link", { name: "Kế hoạch người lớn tin cậy" })).toHaveAttribute(
      "href",
      "/student/support-plan",
    );
    expect(screen.getByRole("link", { name: "Mở kế hoạch hỗ trợ" })).toHaveAttribute(
      "href",
      "/student/support-plan",
    );
  });
});
