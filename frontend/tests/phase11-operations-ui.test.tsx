import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "@/app/(authenticated)/admin/page";
import AdminOperationsPage from "@/app/(authenticated)/admin/operations/page";
import { getAdminOperationsDashboard } from "@/lib/admin-operations-api";

const operationsDashboard = {
  generated_at: "2026-05-22T00:00:00Z",
  privacy_notes: [
    "Chỉ hiển thị metadata vận hành: trạng thái, loại hành động, loại mục tiêu, thời gian và mã lỗi an toàn.",
    "Không hiển thị ghi chú SOS, câu trả lời test tâm lý, nội dung chatbot, email người nhận, secret hoặc danh sách học sinh theo nguy cơ.",
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
        remediation: "Set production environment mode before using Peerlight AI with real student data.",
      },
    ],
  },
  runtime: {
    mode: "public_demo",
    is_demo_runtime: true,
    production_pilot: false,
    demo_seed_allowed: true,
    demo_login_allowed: true,
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
    frontend_origin_kind: "https",
    allowed_origin_count: 2,
    has_local_origin: false,
    all_origins_https: true,
    health_live_path: "/health/live",
    health_ready_path: "/health/ready",
    session_cookie_secure: true,
    session_cookie_samesite: "none",
    credentialed_cors_methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
  production_smoke: [
    {
      key: "backend_health",
      label: "Backend live and readiness endpoints",
      status: "covered",
      command: "npm --prefix frontend run smoke:production",
      evidence: "Smoke script checks /health/live and /health/ready without secrets.",
      remediation: null,
    },
    {
      key: "cors_preflight",
      label: "Credentialed CORS preflight",
      status: "covered",
      command: "npm --prefix frontend run smoke:production",
      evidence: "Smoke script checks allowed Origin and credentials headers for login preflight.",
      remediation: "Verify deployed origins.",
    },
  ],
  deployment_guardrails: [
    {
      key: "frontend_api_target",
      category: "vercel_frontend",
      status: "warn",
      evidence: "frontend_api_target_checked_by_guard=yes; backend_value_exposed=no",
      remediation: "Run guard:deploy with NEXT_PUBLIC_API_BASE_URL and BEYOU_EXPECTED_BACKEND_URL.",
      command: "npm --prefix frontend run guard:deploy",
    },
    {
      key: "cors_cookie_contract",
      category: "render_backend",
      status: "pass",
      evidence:
        "exact_allowed_origin_match=yes; allowed_origin_count=1; all_origins_https=yes; credentialed_cors=yes",
      remediation: null,
      command: "npm --prefix frontend run guard:deploy",
    },
  ],
  smoke_profiles: [
    {
      key: "demo_smoke",
      label: "Demo smoke",
      status: "pass",
      command: "npm --prefix frontend run smoke:demo",
      uses_demo_accounts: true,
      requires_readiness_ready: false,
      evidence: "uses_demo_accounts=yes; requires_readiness_ready=no; public_demo_seeded_flow=yes",
      remediation: null,
    },
    {
      key: "pilot_smoke",
      label: "Production pilot smoke",
      status: "warn",
      command: "npm --prefix frontend run smoke:pilot",
      uses_demo_accounts: false,
      requires_readiness_ready: true,
      evidence: "readiness_status=not_ready; production_pilot_runtime=no",
      remediation: "Switch to production_pilot runtime and require readiness ready before pilot smoke.",
    },
  ],
  sos_email: {
    total: 1,
    by_status: [{ key: "queued", label: "Đang chờ", count: 1 }],
    by_provider: [{ key: "local_outbox", label: "local_outbox", count: 1 }],
    by_error_code: [{ key: "smtp_error", label: "smtp_error", count: 1 }],
    recent: [
      {
        delivery_key: "delivery-1",
        alert_key: "alert-present",
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
  v1_2_audit: [
    { key: "support_plan", label: "Support plans", count: 1 },
    { key: "mood_check_in", label: "Mood check-ins", count: 2 },
  ],
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

  it("keeps Phase 30 identity operations fields optional in the admin operations API contract", () => {
    const apiSource = readFileSync(join(process.cwd(), "lib/admin-operations-api.ts"), "utf8");

    expect(apiSource).toContain("export type AuthProviderReadinessSummary");
    expect(apiSource).toContain("auth_provider?: AuthProviderReadinessSummary | null");
    expect(apiSource).toContain("identity_mappings?: IdentityMappingOperationsSummary | null");
    expect(apiSource).toContain("session_auth?: SessionAuthOperationsSummary | null");
    expect(apiSource).toContain("return apiFetch<AdminOperationsDashboard>");
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
    expect(screen.getByText("Demo seed readiness")).toBeInTheDocument();
    expect(screen.getByText("Connectivity & session contract")).toBeInTheDocument();
    expect(screen.getByText("Deployment guardrails")).toBeInTheDocument();
    expect(
      screen.getByText("Kiểm tra Render, Vercel, API target, CORS và cookie bằng metadata an toàn."),
    ).toBeInTheDocument();
    expect(screen.getByText("Smoke profiles")).toBeInTheDocument();
    expect(screen.getByText("Demo smoke")).toBeInTheDocument();
    expect(screen.getByText("Production pilot smoke")).toBeInTheDocument();
    expect(screen.getByText(/không phụ thuộc tài khoản demo/)).toBeInTheDocument();
    expect(screen.getAllByText("npm --prefix frontend run guard:deploy")).toHaveLength(2);
    expect(screen.getByText("npm --prefix frontend run smoke:demo")).toBeInTheDocument();
    expect(screen.getByText("npm --prefix frontend run smoke:pilot")).toBeInTheDocument();
    expect(screen.getByText(/Không hiển thị cookie value hoặc secret/)).toBeInTheDocument();
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
    expect(rendered).not.toMatch(
      /DATABASE_URL|SESSION_COOKIE_NAME|SMTP_PASSWORD|FREEMODEL_API_KEY|resource_id|student\.demo@beyou\.local/i,
    );
    expect(screen.queryByRole("button", { name: /Xuất|Tải xuống|Export/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Chi tiết học sinh|drilldown|xếp hạng/i })).not.toBeInTheDocument();
  });
});

