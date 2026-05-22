import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentDashboardPage from "@/app/(authenticated)/student/page";
import StudentMoodCheckInHistoryPage from "@/app/(authenticated)/student/mood-check-ins/history/page";
import StudentMoodCheckInPage from "@/app/(authenticated)/student/mood-check-ins/page";

const optionsResponse = {
  student_prompt: "Dành một phút gọi tên cảm xúc hiện tại của em.",
  adult_guidance: "Bắt đầu bằng lắng nghe.",
  mood_options: [
    { key: "steady", label: "Khá ổn", helper: "Em thấy tương đối cân bằng." },
    { key: "overwhelmed", label: "Quá tải", helper: "Em thấy mọi thứ hơi nhiều với mình." },
  ],
  context_tags: [
    { key: "school", label: "Trường/lớp" },
    { key: "sleep", label: "Giấc ngủ" },
  ],
  privacy_notes: [
    "Check-in giúp em tự nhìn lại cảm xúc, không phải chẩn đoán.",
    "Ghi chú riêng tư chỉ hiển thị cho em trong Phase 13.",
    "BeYou không tự động gửi SOS hoặc thông báo người lớn từ check-in này.",
  ],
  energy_scale_label: "1 là rất ít năng lượng, 5 là nhiều năng lượng",
  stress_scale_label: "1 là rất nhẹ, 5 là rất căng",
};

const highConcernResult = {
  id: "mood-1",
  mood_label: "overwhelmed",
  energy_level: 2,
  stress_level: 5,
  context_tags: ["school", "sleep"],
  private_note: "Em thấy nhiều việc quá.",
  trend_label: "Cần hỗ trợ sớm",
  supportive_message: "Điều em đang cảm thấy đáng được người lớn tin cậy lắng nghe sớm.",
  suggested_next_action:
    "Nếu em thấy không an toàn hoặc không thể tự xử lý, hãy dùng SOS như một hành động riêng em chủ động xác nhận.",
  suggest_support_plan: true,
  suggest_sos: true,
  created_at: "2026-05-22T00:00:00Z",
  is_demo: true,
};

const historyResponse = {
  items: [
    {
      ...highConcernResult,
      id: "mood-2",
      private_note: "RAW_PRIVATE_STUDENT_NOTE",
      created_at: "2026-05-22T01:00:00Z",
    },
  ],
};

function mockMoodFetch() {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    if (path === "/api/student/sos-alerts") {
      return Promise.resolve(new Response(JSON.stringify({ detail: "SOS should not be called" }), { status: 500 }));
    }
    if (path === "/api/student/mood-check-ins/options") {
      return Promise.resolve(
        new Response(JSON.stringify(optionsResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (path === "/api/student/mood-check-ins" && init?.method === "POST") {
      return Promise.resolve(
        new Response(JSON.stringify(highConcernResult), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (path === "/api/student/mood-check-ins/history") {
      return Promise.resolve(
        new Response(JSON.stringify(historyResponse), {
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

describe("Phase 13 mood check-in UI", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("submits a private mood check-in and suggests explicit support actions without auto SOS", async () => {
    const fetchMock = mockMoodFetch();

    render(<StudentMoodCheckInPage />);

    expect(await screen.findByText("Check-in cảm xúc")).toBeInTheDocument();
    expect(screen.getByText("Ghi chú riêng tư chỉ hiển thị cho em trong Phase 13.")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/Quá tải/));
    await userEvent.selectOptions(screen.getByLabelText(/Năng lượng của em/), "2");
    await userEvent.selectOptions(screen.getByLabelText(/Mức căng thẳng/), "5");
    await userEvent.click(screen.getByLabelText("Trường/lớp"));
    await userEvent.click(screen.getByLabelText("Giấc ngủ"));
    await userEvent.type(screen.getByLabelText("Ghi chú riêng tư cho chính em (không bắt buộc)"), "Em thấy nhiều việc quá.");
    await userEvent.click(screen.getByRole("button", { name: "Lưu check-in" }));

    expect(await screen.findByText("Đã lưu check-in")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem kế hoạch người lớn tin cậy" })).toHaveAttribute(
      "href",
      "/student/support-plan",
    );
    expect(screen.getByRole("link", { name: /Tới bảng điều khiển để gửi SOS/ })).toHaveAttribute("href", "/student");

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(postCall?.[0]).toBe("http://localhost:8000/api/student/mood-check-ins");
    expect(postCall?.[1]).toEqual(expect.objectContaining({ credentials: "include" }));
    expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({
      mood_label: "overwhelmed",
      energy_level: 2,
      stress_level: 5,
      context_tags: ["school", "sleep"],
      private_note: "Em thấy nhiều việc quá.",
    });
    expect(fetchMock.mock.calls.some(([url]) => new URL(String(url)).pathname === "/api/student/sos-alerts")).toBe(
      false,
    );
  });

  it("renders student-only mood history with private note", async () => {
    mockMoodFetch();

    render(<StudentMoodCheckInHistoryPage />);

    expect(await screen.findByText("Lịch sử check-in cảm xúc")).toBeInTheDocument();
    expect(screen.getByText("RAW_PRIVATE_STUDENT_NOTE")).toBeInTheDocument();
    expect(screen.getByText("Quá tải")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Xuất|Export|Tải xuống/i })).not.toBeInTheDocument();
  });

  it("adds mood check-in entry to the student dashboard", async () => {
    mockDashboardFetch();

    render(<StudentDashboardPage />);

    expect(await screen.findByRole("link", { name: "Check-in cảm xúc" })).toHaveAttribute(
      "href",
      "/student/mood-check-ins",
    );
    expect(screen.getByRole("link", { name: "Xem lịch sử check-in" })).toHaveAttribute(
      "href",
      "/student/mood-check-ins/history",
    );
  });
});
