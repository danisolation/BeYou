import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "@/app/(authenticated)/admin/page";
import AdminOperationsPage from "@/app/(authenticated)/admin/operations/page";
import AdminPrivacyPolicyPage from "@/app/(authenticated)/admin/privacy-policy/page";
import { getAdminPrivacyPolicy, updateAdminPrivacyPolicy } from "@/lib/admin-privacy-policy-api";

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

const operationsDashboard = {
  generated_at: "2026-05-25T00:00:00Z",
  privacy_notes: [
    "Chỉ hiển thị metadata vận hành: trạng thái, loại hành động, loại mục tiêu, thời gian và mã lỗi an toàn.",
    "Không hiển thị ghi chú SOS, câu trả lời test tâm lý, nội dung chatbot, email người nhận, secret hoặc danh sách học sinh theo nguy cơ.",
  ],
  readiness: {
    status: "degraded",
    generated_at: "2026-05-25T00:00:00Z",
    checks_by_status: [
      { key: "pass", label: "Đạt", count: 8 },
      { key: "warn", label: "Cần chú ý", count: 1 },
      { key: "fail", label: "Không đạt", count: 0 },
    ],
    attention_checks: [],
  },
  demo_seed: {
    status: "pass",
    summary: "Seeded demo roles, links, and walkthrough content are present as safe metadata.",
    remediation: null,
    allow_demo_seed: true,
    roles: [
      { role: "student", account_key: "student_demo", present: true, active: true, is_demo: true },
      { role: "teacher", account_key: "teacher_demo", present: true, active: true, is_demo: true },
      { role: "parent", account_key: "parent_demo", present: true, active: true, is_demo: true },
      { role: "admin", account_key: "admin_demo", present: true, active: true, is_demo: true },
    ],
    active_link_count: 2,
    published_self_check_count: 2,
    published_scenario_count: 2,
    published_mood_config_count: 1,
    v1_4_policy_count: 1,
    v1_4_preference_count: 1,
    v1_4_reminder_state_count: 1,
    v1_4_share_count: 1,
  },
  connectivity: {
    frontend_origin: "https://beyou-frontend.vercel.app",
    allowed_origin_count: 2,
    health_live_path: "/health/live",
    health_ready_path: "/health/ready",
    session_cookie_name: "__Host-beyou_session",
    session_cookie_secure: true,
    session_cookie_samesite: "none",
    credentialed_cors_methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
  production_smoke: [],
  sos_email: {
    total: 0,
    by_status: [],
    by_provider: [],
    by_error_code: [],
    recent: [],
  },
  v1_2_audit: [],
  v1_4_audit: [
    { key: "notification_preferences", label: "Notification preferences", count: 1 },
    { key: "mood_checkin_reminder", label: "Mood reminders", count: 2 },
    { key: "mood_note_share", label: "Mood note sharing", count: 3 },
    { key: "shared_mood_note", label: "Shared mood note reads", count: 4 },
    { key: "adult_support_summary", label: "Reason-gated support summaries", count: 5 },
    { key: "privacy_policy", label: "Privacy policy controls", count: 1 },
  ],
  audit: {
    total_matching: 1,
    filters: {
      start_at: null,
      end_at: null,
      actor_role: null,
      action_type: null,
      target_type: null,
      status: null,
    },
    recent: [
      {
        id: "audit-1",
        actor_role: "admin",
        action: "privacy_policy_updated",
        resource_type: "privacy_policy",
        status: "success",
        timestamp: "2026-05-25T00:00:00Z",
        reason: null,
        metadata_summary: { allowed_channel_count: 1, allowed_reason_count: 4 },
        is_demo: true,
      },
    ],
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

describe("Phase 25 admin policy and operations UI", () => {
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

  it("adds admin policy entry and lets admins save safe v1.4 defaults", async () => {
    const fetchMock = mockFetch({
      "GET /api/admin/users": [{ id: "admin-1" }],
      "GET /api/admin/links": [],
      "GET /api/admin/privacy-policy": policyResponse,
      "PUT /api/admin/privacy-policy": {
        ...policyResponse,
        default_in_app_reminders_enabled: true,
        default_quiet_hours_start: "22:00",
        default_quiet_hours_end: "06:00",
      },
    });

    const dashboard = render(<AdminDashboardPage />);
    expect(await screen.findByRole("link", { name: /Chính sách riêng tư v1.4/ })).toHaveAttribute(
      "href",
      "/admin/privacy-policy",
    );
    dashboard.unmount();

    render(<AdminPrivacyPolicyPage />);
    expect(await screen.findByText("Chính sách riêng tư v1.4")).toBeInTheDocument();
    expect(screen.getByText("Zalo")).toBeInTheDocument();
    expect(screen.getAllByText(/Đang hoãn/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("textbox", { name: /lý do/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Zalo|SMS|Email|Thông báo thiết bị/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Bật mặc định nhắc nhở trong Peerlight AI"));
    await userEvent.clear(screen.getByLabelText("Yên lặng từ"));
    await userEvent.type(screen.getByLabelText("Yên lặng từ"), "22:00");
    await userEvent.clear(screen.getByLabelText("Đến"));
    await userEvent.type(screen.getByLabelText("Đến"), "06:00");
    await userEvent.click(screen.getByRole("button", { name: "Lưu chính sách" }));

    expect(await screen.findByText("Đã lưu chính sách riêng tư v1.4.")).toBeInTheDocument();
    const putCall = fetchMock.mock.calls.find(([url, init]) => {
      return new URL(String(url)).pathname === "/api/admin/privacy-policy" && init?.method === "PUT";
    });
    expect(JSON.parse(String(putCall?.[1]?.body))).toEqual(
      expect.objectContaining({
        allowed_channels: ["in_app"],
        external_channels_enabled: false,
        default_in_app_reminders_enabled: true,
        default_quiet_hours_start: "22:00",
        default_quiet_hours_end: "06:00",
      }),
    );
  });

  it("renders v1.4 operations metadata without raw content, exports, or drilldowns", async () => {
    mockFetch({
      "GET /api/admin/operations/dashboard?limit=25": operationsDashboard,
    });

    render(<AdminOperationsPage />);

    expect(await screen.findByText("v1.4 privacy controls")).toBeInTheDocument();
    const panel = screen.getByText("v1.4 privacy controls").closest("section");
    if (panel === null) {
      throw new Error("missing v1.4 panel");
    }
    expect(within(panel).getByText("Notification preferences")).toBeInTheDocument();
    expect(within(panel).getByText("Reason-gated support summaries")).toBeInTheDocument();
    expect(screen.getByText("v1.4 policy")).toBeInTheDocument();
    expect(screen.getByText("v1.4 shares")).toBeInTheDocument();

    const rendered = document.body.textContent ?? "";
    expect(rendered).not.toMatch(/RAW_|access_reason_text|private_note|student.demo@|teacher.demo@|recipient_id/i);
    expect(screen.queryByRole("button", { name: /Xuất|Tải xuống|Export/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Chi tiết học sinh|drilldown|xếp hạng/i })).not.toBeInTheDocument();
  });
});

