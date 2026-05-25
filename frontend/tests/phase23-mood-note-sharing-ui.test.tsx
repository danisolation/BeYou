import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentMoodCheckInHistoryPage from "@/app/(authenticated)/student/mood-check-ins/history/page";
import TeacherSupportSummaryPage from "@/app/(authenticated)/teacher/students/[studentId]/support-summary/page";
import ParentSupportSummaryPage from "@/app/(authenticated)/parent/students/[studentId]/support-summary/page";

const shareOptions = {
  available_adults: [
    {
      id: "teacher-1",
      full_name: "Cô Bình",
      relationship_type: "teacher",
      is_demo: true,
    },
    {
      id: "parent-1",
      full_name: "Mẹ An",
      relationship_type: "parent",
      is_demo: true,
    },
  ],
  privacy_notes: [
    "Em chỉ chia sẻ nội dung của check-in em chọn.",
    "Em có thể thu hồi quyền xem trong lịch sử check-in bất cứ lúc nào.",
  ],
};

const emptyShareHistory = {
  items: [
    {
      id: "mood-summary-only",
      mood_label: "steady",
      energy_level: 4,
      stress_level: 1,
      context_tags: ["school"],
      private_note: null,
      trend_label: "Ổn định",
      supportive_message: "Cảm ơn em đã dành một phút lắng nghe bản thân.",
      suggested_next_action: "Hãy ghi nhớ điều đang giúp em ổn hơn hôm nay.",
      suggest_support_plan: false,
      suggest_sos: false,
      created_at: "2026-05-22T01:00:00Z",
      is_demo: true,
      shareable: true,
      can_share_private_note: false,
      active_shares: [],
    },
    {
      id: "mood-private",
      mood_label: "overwhelmed",
      energy_level: 2,
      stress_level: 5,
      context_tags: ["sleep"],
      private_note: "RAW_PRIVATE_STUDENT_NOTE",
      trend_label: "Cần hỗ trợ sớm",
      supportive_message: "Điều em đang cảm thấy đáng được lắng nghe.",
      suggested_next_action: "Chọn một bước hỗ trợ nhỏ.",
      suggest_support_plan: true,
      suggest_sos: false,
      created_at: "2026-05-22T00:00:00Z",
      is_demo: true,
      shareable: true,
      can_share_private_note: true,
      active_shares: [],
    },
  ],
};

const activeShare = {
  id: "share-1",
  mood_checkin_id: "mood-private",
  adult_id: "teacher-1",
  adult_full_name: "Cô Bình",
  relationship_type: "teacher",
  share_scope: "private_note",
  has_private_note: true,
  has_student_summary: false,
  created_at: "2026-05-22T02:00:00Z",
  is_demo: true,
};

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
  shared_mood_notes: [
    {
      id: "share-1",
      mood_checkin_id: "mood-private",
      shared_at: "2026-05-22T02:00:00Z",
      mood_created_at: "2026-05-22T00:00:00Z",
      share_scope: "private_note",
      content: "RAW_PRIVATE_STUDENT_NOTE",
      relationship_type: "teacher",
      is_demo: true,
    },
    {
      id: "share-2",
      mood_checkin_id: "mood-summary-only",
      shared_at: "2026-05-22T03:00:00Z",
      mood_created_at: "2026-05-22T01:00:00Z",
      share_scope: "student_summary",
      content: "Em muốn cô biết hôm nay em hơi mệt.",
      relationship_type: "teacher",
      is_demo: true,
    },
  ],
  privacy_notes: [
    "Phần này chỉ hiển thị nội dung học sinh đã chủ động đồng ý chia sẻ.",
    "Xu hướng check-in bên dưới là tóm tắt tổng hợp; không thay thế việc lắng nghe học sinh.",
  ],
  is_demo: true,
};

const parentSummary = {
  ...teacherSummary,
  shared_mood_notes: [],
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

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function mockFetch() {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    if (path === "/api/student/mood-check-ins/history") {
      return jsonResponse(emptyShareHistory);
    }
    if (path === "/api/student/mood-check-ins/share-options") {
      return jsonResponse(shareOptions);
    }
    if (path === "/api/student/mood-check-ins/mood-summary-only/shares" && init?.method === "POST") {
      return jsonResponse({
        mood_checkin_id: "mood-summary-only",
        shareable: true,
        can_share_private_note: false,
        active_shares: [
          {
            ...activeShare,
            id: "summary-share",
            mood_checkin_id: "mood-summary-only",
            share_scope: "student_summary",
            has_private_note: false,
            has_student_summary: true,
          },
        ],
        message: "Đã lưu quyền chia sẻ. Em có thể thu hồi trong thẻ check-in này bất cứ lúc nào.",
      });
    }
    if (path === "/api/student/mood-check-ins/mood-private/shares" && init?.method === "POST") {
      return jsonResponse({
        mood_checkin_id: "mood-private",
        shareable: true,
        can_share_private_note: true,
        active_shares: [activeShare],
        message: "Đã lưu quyền chia sẻ. Em có thể thu hồi trong thẻ check-in này bất cứ lúc nào.",
      });
    }
    if (path === "/api/student/mood-check-ins/mood-private/shares/teacher-1" && init?.method === "DELETE") {
      return jsonResponse({
        mood_checkin_id: "mood-private",
        revoked_count: 1,
        active_shares: [],
        message: "Đã thu hồi quyền xem.",
      });
    }
    if (path === "/api/teacher/students/student-1/support-summary") {
      return jsonResponse(teacherSummary);
    }
    if (path === "/api/parent/students/student-1/support-summary") {
      return jsonResponse(parentSummary);
    }
    return jsonResponse({ detail: "not found" }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function cardFor(text: string): HTMLElement {
  const node = screen.getByText(text);
  const card = node.closest("article");
  if (card === null) {
    throw new Error(`Missing mood card for ${text}`);
  }
  return card;
}

describe("Phase 23 mood note sharing UI", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("student_history_allows_summary_only_share_without_private_note", async () => {
    mockFetch();

    render(<StudentMoodCheckInHistoryPage />);

    const card = await screen.findByText("Ổn định").then(() => cardFor("Ổn định"));
    await userEvent.click(within(card).getByRole("button", { name: "Chia sẻ ghi chú" }));

    expect(
      within(card).getByText(
        "Check-in này không có ghi chú riêng tư; em vẫn có thể tự viết tóm tắt nếu muốn chia sẻ.",
      ),
    ).toBeInTheDocument();
    expect(within(card).getByLabelText("Chia sẻ phần tóm tắt em tự viết")).toBeChecked();
    expect(within(card).getByLabelText("Chia sẻ ghi chú riêng tư")).toBeDisabled();
    expect(within(card).getByLabelText(/Tóm tắt em muốn chia sẻ/)).toBeInTheDocument();
  });

  it("student_preview_names_adults_scope_private_boundary_and_revocation_path", async () => {
    mockFetch();

    render(<StudentMoodCheckInHistoryPage />);

    const card = await screen.findByText("Cần hỗ trợ sớm").then(() => cardFor("Cần hỗ trợ sớm"));
    await userEvent.click(within(card).getByRole("button", { name: "Chia sẻ ghi chú" }));
    await userEvent.click(within(card).getByLabelText("Cô Bình - teacher"));
    await userEvent.click(within(card).getByLabelText("Mẹ An - parent"));
    await userEvent.click(within(card).getByRole("button", { name: "Xem trước trước khi chia sẻ" }));

    expect(within(card).getByText("Em sắp chia sẻ ghi chú này với: Cô Bình, Mẹ An.")).toBeInTheDocument();
    expect(within(card).getByText("Nội dung được chia sẻ: private note.")).toBeInTheDocument();
    expect(
      within(card).getByText("Vẫn riêng tư: các check-in khác, ghi chú khác, điểm số chi tiết và những gì em không chọn chia sẻ."),
    ).toBeInTheDocument();
    expect(within(card).getByText("Em có thể thu hồi quyền xem trong lịch sử check-in bất cứ lúc nào.")).toBeInTheDocument();
    expect(
      within(card).getByText("Việc chia sẻ này không gửi thông báo ngoài ứng dụng, không tạo SOS và không tạo điểm rủi ro."),
    ).toBeInTheDocument();
  });

  it("share_success_and_active_share_state", async () => {
    const fetchMock = mockFetch();

    render(<StudentMoodCheckInHistoryPage />);

    const card = await screen.findByText("Cần hỗ trợ sớm").then(() => cardFor("Cần hỗ trợ sớm"));
    await userEvent.click(within(card).getByRole("button", { name: "Chia sẻ ghi chú" }));
    await userEvent.click(within(card).getByLabelText("Cô Bình - teacher"));
    await userEvent.click(within(card).getByRole("button", { name: "Xem trước trước khi chia sẻ" }));
    await userEvent.click(within(card).getByRole("button", { name: "Xác nhận chia sẻ" }));

    expect(
      await within(card).findByText("Đã lưu quyền chia sẻ. Em có thể thu hồi trong thẻ check-in này bất cứ lúc nào."),
    ).toBeInTheDocument();
    expect(within(card).getByText("Đang được chia sẻ")).toBeInTheDocument();
    const postCall = fetchMock.mock.calls.find(
      ([url, init]) => new URL(String(url)).pathname === "/api/student/mood-check-ins/mood-private/shares" && init?.method === "POST",
    );
    expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({
      adult_ids: ["teacher-1"],
      share_scope: "private_note",
      student_summary: null,
    });
  });

  it("student_summary_scope_uses_student_text", async () => {
    const fetchMock = mockFetch();

    render(<StudentMoodCheckInHistoryPage />);

    const card = await screen.findByText("Ổn định").then(() => cardFor("Ổn định"));
    await userEvent.click(within(card).getByRole("button", { name: "Chia sẻ ghi chú" }));
    await userEvent.click(within(card).getByLabelText("Cô Bình - teacher"));
    await userEvent.type(
      within(card).getByLabelText("Tóm tắt em muốn chia sẻ thay cho ghi chú đầy đủ"),
      "Em muốn cô biết hôm nay em hơi mệt.",
    );
    expect(within(card).getByText("Em tự viết phần này. Peerlight AI không tự tạo diễn giải hay chẩn đoán.")).toBeInTheDocument();
    await userEvent.click(within(card).getByRole("button", { name: "Xem trước trước khi chia sẻ" }));
    await userEvent.click(within(card).getByRole("button", { name: "Xác nhận chia sẻ" }));

    const postCall = fetchMock.mock.calls.find(
      ([url, init]) => new URL(String(url)).pathname === "/api/student/mood-check-ins/mood-summary-only/shares" && init?.method === "POST",
    );
    expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({
      adult_ids: ["teacher-1"],
      share_scope: "student_summary",
      student_summary: "Em muốn cô biết hôm nay em hơi mệt.",
    });
  });

  it("revocation_requires_second_confirmation", async () => {
    const fetchMock = mockFetch();
    const historyWithShare = {
      items: [
        {
          ...emptyShareHistory.items[1],
          active_shares: [activeShare],
        },
      ],
    };
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      if (path === "/api/student/mood-check-ins/history") {
        return jsonResponse(historyWithShare);
      }
      if (path === "/api/student/mood-check-ins/share-options") {
        return jsonResponse(shareOptions);
      }
      if (path === "/api/student/mood-check-ins/mood-private/shares/teacher-1" && init?.method === "DELETE") {
        return jsonResponse({
          mood_checkin_id: "mood-private",
          revoked_count: 1,
          active_shares: [],
          message: "Đã thu hồi quyền xem.",
        });
      }
      return jsonResponse({ detail: "not found" }, 404);
    });

    render(<StudentMoodCheckInHistoryPage />);

    const card = await screen.findByText("Cần hỗ trợ sớm").then(() => cardFor("Cần hỗ trợ sớm"));
    await userEvent.click(within(card).getByRole("button", { name: "Thu hồi quyền xem" }));
    expect(within(card).getByText("Áp dụng với: Cô Bình.")).toBeInTheDocument();
    expect(
      within(card).getByText(
        "Thu hồi quyền xem: Người lớn này sẽ không còn xem được nội dung đã chia sẻ. Lịch sử kiểm tra chỉ lưu thông tin thao tác, không lưu nội dung ghi chú.",
      ),
    ).toBeInTheDocument();
    await userEvent.click(within(card).getByRole("button", { name: "Xác nhận thu hồi quyền xem" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            new URL(String(url)).pathname === "/api/student/mood-check-ins/mood-private/shares/teacher-1" &&
            init?.method === "DELETE",
        ),
      ).toBe(true);
    });
  });

  it("adult_support_summary_renders_separate_shared_notes_before_aggregate_trend", async () => {
    mockFetch();

    render(<TeacherSupportSummaryPage params={{ studentId: "student-1" }} />);

    expect(await screen.findByText("Ghi chú được học sinh đồng ý chia sẻ")).toBeInTheDocument();
    expect(screen.getByText("Chỉ hiển thị những nội dung học sinh đã chủ động chọn chia sẻ với bạn.")).toBeInTheDocument();
    expect(screen.getByText("Ghi chú riêng tư được chia sẻ")).toBeInTheDocument();
    expect(screen.getByText("Tóm tắt học sinh tự viết")).toBeInTheDocument();
    expect(screen.getAllByText("Nội dung này có thể không còn hiển thị nếu học sinh thu hồi quyền xem.")).toHaveLength(2);
    expect(document.body.textContent?.indexOf("Ghi chú được học sinh đồng ý chia sẻ")).toBeLessThan(
      document.body.textContent?.indexOf("Xu hướng check-in cảm xúc") ?? -1,
    );

    vi.restoreAllMocks();
    mockFetch();
    render(<ParentSupportSummaryPage params={{ studentId: "student-1" }} />);
    expect(
      await screen.findByText("Học sinh chưa chia sẻ ghi chú cảm xúc nào với bạn, hoặc quyền chia sẻ đã được thu hồi."),
    ).toBeInTheDocument();
  });

  it("ui_copy_forbidden_terms_and_contact_identifiers_absent", async () => {
    mockFetch();

    render(<TeacherSupportSummaryPage params={{ studentId: "student-1" }} />);

    await screen.findByText("Ghi chú được học sinh đồng ý chia sẻ");
    const rendered = document.body.textContent ?? "";
    expect(rendered).not.toMatch(/@|số điện thoại|email|student\.demo|teacher\.demo/i);
    expect(rendered).not.toMatch(/cảnh báo người lớn|giám sát|tuân thủ/i);
  });
});
