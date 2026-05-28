import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminLinksPage from "@/app/(authenticated)/admin/links/page";
import StudentDashboardPage from "@/app/(authenticated)/student/page";
import TeacherSosAlertPage from "@/app/(authenticated)/teacher/sos-alerts/[alertId]/page";
import TeacherSummaryPage from "@/app/(authenticated)/teacher/students/[studentId]/self-check-summaries/page";
import { getAdminPrivacyPolicy, updateAdminPrivacyPolicy } from "@/lib/admin-privacy-policy-api";

const studentProfile = {
  id: "student-1",
  full_name: "Nguyễn An Demo",
  email: "student.demo@beyou.local",
  school: "Trường THPT BeYou Demo",
  class_name: "10A1",
  is_demo: true,
  linked_adults: [],
};

const policyResponse = {
  id: "policy-1",
  school_scope: "default",
  default_in_app_reminders_enabled: false,
  default_quiet_hours_start: "21:30",
  default_quiet_hours_end: "06:30",
  default_timezone: "Asia/Ho_Chi_Minh",
  allowed_channels: ["in_app"],
  external_channels_enabled: false,
  note_sharing_enabled: true,
  reason_required_for_adult_summaries: true,
  reason_required_for_shared_mood_notes: true,
  allowed_reason_codes: [
    "student_requested_support",
    "follow_up_after_checkin",
    "support_plan_context",
    "routine_care_conversation",
  ],
  channel_boundaries: [
    { key: "in_app", label: "Trong ứng dụng", enabled: true, available: true, status: "active" },
    { key: "email", label: "Email", enabled: false, available: false, status: "deferred" },
    { key: "sms", label: "SMS", enabled: false, available: false, status: "deferred" },
    { key: "zalo", label: "Zalo", enabled: false, available: false, status: "deferred" },
    { key: "push", label: "Thông báo thiết bị", enabled: false, available: false, status: "deferred" },
  ],
  updated_at: "2026-05-25T00:00:00Z",
  is_demo: true,
};

const sosAlert = {
  id: "alert-1",
  student: {
    id: "student-1",
    full_name: "Nguyễn An Demo",
    school: "Trường THPT BeYou Demo",
    class_name: "10A1",
  },
  severity: "support",
  source: "student_dashboard",
  note: null,
  current_status: "sent",
  created_at: "2026-05-22T00:00:00Z",
  updated_at: "2026-05-22T00:00:00Z",
  completed_at: null,
  status_events: [],
  is_demo: true,
};

const users = [
  {
    id: "student-1",
    email: "student.demo@beyou.local",
    role: "student",
    status: "active",
    full_name: "Nguyễn An Demo",
    school: "Trường THPT BeYou Demo",
    class_name: "10A1",
    is_demo: true,
    created_at: "2026-05-22T00:00:00Z",
    updated_at: "2026-05-22T00:00:00Z",
  },
  {
    id: "teacher-1",
    email: "teacher.demo@beyou.local",
    role: "teacher",
    status: "active",
    full_name: "Cô Bình Demo",
    school: null,
    class_name: null,
    is_demo: true,
    created_at: "2026-05-22T00:00:00Z",
    updated_at: "2026-05-22T00:00:00Z",
  },
];

const links = [
  {
    id: "link-1",
    student_id: "student-1",
    student_full_name: "Nguyễn An Demo",
    student_email: "student.demo@beyou.local",
    student_school: "Trường THPT BeYou Demo",
    student_class_name: "10A1",
    adult_id: "teacher-1",
    adult_full_name: "Cô Bình Demo",
    adult_email: "teacher.demo@beyou.local",
    adult_role: "teacher",
    relationship_type: "teacher",
    status: "active",
    created_at: "2026-05-22T00:00:00Z",
    updated_at: "2026-05-22T00:00:00Z",
    revoked_at: null,
    is_demo: true,
  },
];

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function mockFetch(responses: Record<string, unknown>) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const parsed = new URL(url);
    const key = `${init?.method ?? "GET"} ${parsed.pathname}${parsed.search}`;
    const pathKey = `${init?.method ?? "GET"} ${parsed.pathname}`;
    const body = responses[key] ?? responses[pathKey] ?? responses[parsed.pathname];
    return jsonResponse(body ?? { detail: "not found" }, body === undefined ? 404 : 200);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Phase 18 supportive copy and critical interaction polish", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uses cookie-authenticated admin privacy policy helper without token storage", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchMock = mockFetch({
      "GET /api/admin/privacy-policy": policyResponse,
      "PUT /api/admin/privacy-policy": policyResponse,
    });

    await getAdminPrivacyPolicy();
    await updateAdminPrivacyPolicy({ ...policyResponse, default_in_app_reminders_enabled: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/admin/privacy-policy",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/admin/privacy-policy",
      expect.objectContaining({ method: "PUT", credentials: "include" }),
    );
    expect(localStorageSpy).not.toHaveBeenCalled();
  });

  it("shows the redesigned student greeting and quick actions without demo chrome", async () => {
    mockFetch({
      "GET /api/student/profile": studentProfile,
    });

    render(<StudentDashboardPage />);

    expect(await screen.findByText(/Nguyễn An Demo/)).toBeInTheDocument();
    expect(screen.getByText("Hôm nay em muốn làm gì?")).toBeInTheDocument();
    expect(screen.getByText("Peerlight AI")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute("href", "/student/chat");
    expect(screen.getByRole("link", { name: "Vào thiết lập" })).toHaveAttribute(
      "href",
      "/student/notification-preferences",
    );
    expect(screen.queryByText(/^Demo$/i)).not.toBeInTheDocument();
  });

  it("announces teacher SOS status updates without exposing extra private detail sections", async () => {
    mockFetch({
      "GET /api/teacher/sos-alerts/alert-1": sosAlert,
      "PATCH /api/teacher/sos-alerts/alert-1/status": { ...sosAlert, current_status: "received" },
    });

    render(<TeacherSosAlertPage params={{ alertId: "alert-1" }} />);

    expect(await screen.findByText("Trạng thái SOS")).toBeInTheDocument();
    expect(screen.getByText("Cập nhật trạng thái")).toBeInTheDocument();
    expect(screen.getByLabelText("Ghi chú hỗ trợ (không bắt buộc)")).toBeInTheDocument();
    expect(screen.queryByText("Điều học sinh muốn người lớn biết")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Đánh dấu đã nhận" }));

    expect(await screen.findByText("Đã cập nhật trạng thái SOS thành Đã nhận.")).toBeInTheDocument();
  });

  it("shows admin revoke consequences and outcome state for support links", async () => {
    mockFetch({
      "GET /api/admin/users?limit=10": users,
      "GET /api/admin/links?limit=10": links,
      "PATCH /api/admin/links/link-1": { ...links[0], status: "revoked", revoked_at: "2026-05-22T00:00:00Z" },
    });

    render(<AdminLinksPage />);

    expect(await screen.findByText("Liên kết hỗ trợ")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Thu hồi/ }));
    expect(
      screen.getByText("Sau khi thu hồi, giáo viên/phụ huynh này không còn được xem tóm tắt hỗ trợ mới qua liên kết này."),
    ).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Thu hồi liên kết" }));

    expect(
      await screen.findByText(/Đã thu hồi liên kết/),
    ).toBeInTheDocument();
  });

  it("frames adult self-check summaries as support, not surveillance", async () => {
    mockFetch({
      "GET /api/teacher/students/student-1/self-check-summaries": {
        student: sosAlert.student,
        latest_summary: null,
        recent_summaries: [],
        is_demo: true,
      },
    });

    render(<TeacherSummaryPage params={{ studentId: "student-1" }} />);

    expect(await screen.findByText("Tóm tắt được phép xem")).toBeInTheDocument();
    expect(
      screen.getByText("Tóm tắt này dùng để mở lời hỗ trợ, không phải theo dõi hay xếp hạng học sinh."),
    ).toBeInTheDocument();
  });
});
