import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "@/app/(authenticated)/admin/page";
import AdminOperationsPage from "@/app/(authenticated)/admin/operations/page";
import { getAdminOperationsDashboard } from "@/lib/admin-operations-api";

const operationsDashboard = {
  generated_at: "2026-05-22T00:00:00Z",
  privacy_notes: [
    "Chỉ hiển thị metadata vận hành: trạng thái, loại hành động, loại mục tiêu, thời gian và mã lỗi an toàn.",
    "Không hiển thị ghi chú SOS, câu trả lời tự kiểm tra, nội dung chatbot, email người nhận, secret hoặc danh sách học sinh theo nguy cơ.",
  ],
  readiness: {
    status: "degraded",
    generated_at: "2026-05-22T00:00:00Z",
    checks_by_status: [
      { key: "pass", label: "Đạt", count: 8 },
      { key: "warn", label: "Cần chú ý", count: 1 },
      { key: "fail", label: "Không đạt", count: 0 },
    ],
    attention_checks: [
      {
        key: "config_environment",
        category: "configuration",
        status: "warn",
        summary: "Environment is not production.",
        remediation: "Set production environment mode before using BeYou with real student data.",
      },
    ],
  },
  sos_email: {
    total: 1,
    by_status: [{ key: "queued", label: "Đang chờ", count: 1 }],
    by_provider: [{ key: "local_outbox", label: "local_outbox", count: 1 }],
    by_error_code: [{ key: "smtp_error", label: "smtp_error", count: 1 }],
    recent: [
      {
        id: "delivery-1",
        alert_id: "alert-1",
        channel: "email",
        provider: "local_outbox",
        recipient_role: "teacher",
        status: "queued",
        attempt_count: 0,
        error_code: null,
        last_attempt_at: null,
        delivered_at: null,
        created_at: "2026-05-22T00:00:00Z",
        is_demo: true,
      },
    ],
  },
  audit: {
    total_matching: 1,
    filters: {
      start_at: null,
      end_at: null,
      actor_role: "admin",
      action_type: "account_status_changed",
      target_type: "account_profile",
      status: "success",
    },
    recent: [
      {
        id: "audit-1",
        actor_role: "admin",
        action: "account_status_changed",
        resource_type: "account_profile",
        resource_id: "user-1",
        status: "success",
        timestamp: "2026-05-22T00:00:00Z",
        reason: "admin_operations",
        metadata_summary: { safe_count: 1 },
        is_demo: true,
      },
    ],
  },
};

function mockFetch(responses: Record<string, unknown>) {
  const fetchMock = vi.fn((url: string) => {
    const parsed = new URL(url);
    const key = `${parsed.pathname}${parsed.search}`;
    const body = responses[key] ?? responses[parsed.pathname];
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

describe("Phase 11 operations visibility UI", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uses cookie-authenticated operations helper with audit filters and no token storage", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchMock = mockFetch({
      "/api/admin/operations/dashboard?actor_role=admin&action_type=account_status_changed&target_type=account_profile&status=success&limit=10":
        operationsDashboard,
    });

    await getAdminOperationsDashboard({
      actorRole: "admin",
      actionType: "account_status_changed",
      targetType: "account_profile",
      status: "success",
      limit: 10,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/admin/operations/dashboard?actor_role=admin&action_type=account_status_changed&target_type=account_profile&status=success&limit=10",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(localStorageSpy).not.toHaveBeenCalled();
  });

  it("adds operations card to admin dashboard", async () => {
    mockFetch({
      "/api/admin/users": [{ id: "admin-1" }],
      "/api/admin/links": [],
    });

    render(<AdminDashboardPage />);

    expect(await screen.findByRole("link", { name: /Vận hành metadata-only/ })).toHaveAttribute(
      "href",
      "/admin/operations",
    );
    expect(
      screen.getByText("Kiểm tra readiness, email SOS và audit metadata mà không mở dữ liệu riêng tư của học sinh."),
    ).toBeInTheDocument();
  });

  it("renders operations metadata, filters audit events, and excludes raw sensitive fields", async () => {
    const fetchMock = mockFetch({
      "/api/admin/operations/dashboard?limit=25": operationsDashboard,
      "/api/admin/operations/dashboard?actor_role=admin&action_type=account_status_changed&target_type=account_profile&status=success&limit=25":
        operationsDashboard,
    });

    render(<AdminOperationsPage />);

    expect(await screen.findByText("Vận hành metadata-only")).toBeInTheDocument();
    expect(screen.getByText("Readiness")).toBeInTheDocument();
    expect(screen.getByText("SOS email attempts")).toBeInTheDocument();
    expect(screen.getByText("Audit events")).toBeInTheDocument();
    expect(screen.getByText("local_outbox · queued · teacher")).toBeInTheDocument();
    expect(screen.getByText("account_status_changed · success")).toBeInTheDocument();
    expect(screen.getByText("safe_count: 1")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Vai trò người thực hiện"), "admin");
    await userEvent.type(screen.getByLabelText("Loại hành động"), "account_status_changed");
    await userEvent.type(screen.getByLabelText("Loại mục tiêu"), "account_profile");
    await userEvent.type(screen.getByLabelText("Trạng thái audit"), "success");
    await userEvent.click(screen.getByRole("button", { name: "Áp dụng bộ lọc" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8000/api/admin/operations/dashboard?actor_role=admin&action_type=account_status_changed&target_type=account_profile&status=success&limit=25",
        expect.objectContaining({ credentials: "include" }),
      ),
    );

    const rendered = document.body.textContent ?? "";
    expect(rendered).not.toMatch(/RAW_|answer_text|transcript|message_content|student-ops@example|teacher-ops@example|recipient_id/i);
    expect(screen.queryByRole("button", { name: /Xuất|Tải xuống|Export/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Chi tiết học sinh|drilldown|xếp hạng/i })).not.toBeInTheDocument();
  });
});

