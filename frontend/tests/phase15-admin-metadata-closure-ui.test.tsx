import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminMoodCheckInsPage from "@/app/(authenticated)/admin/mood-checkins/page";
import AdminOperationsPage from "@/app/(authenticated)/admin/operations/page";
import AdminDashboardPage from "@/app/(authenticated)/admin/page";
import { defaultMoodConfigPayload } from "@/lib/admin-mood-checkins-api";

const savedConfig = {
  id: "config-1",
  ...defaultMoodConfigPayload,
  status: "published",
  updated_by_id: "admin-1",
  is_demo: true,
  created_at: "2026-05-22T00:00:00Z",
  updated_at: "2026-05-22T00:00:00Z",
};

const operationsDashboard = {
  generated_at: "2026-05-22T00:00:00Z",
  privacy_notes: [
    "Chỉ hiển thị metadata vận hành.",
    "Support plan, mood check-in, adult summary và admin config chỉ hiển thị bằng count/status metadata an toàn.",
  ],
  readiness: {
    status: "ready",
    generated_at: "2026-05-22T00:00:00Z",
    checks_by_status: [
      { key: "pass", label: "Đạt", count: 8 },
      { key: "warn", label: "Cần chú ý", count: 0 },
      { key: "fail", label: "Không đạt", count: 0 },
    ],
    attention_checks: [],
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
  ],
  sos_email: {
    total: 0,
    by_status: [],
    by_provider: [],
    by_error_code: [],
    recent: [],
  },
  v1_2_audit: [
    { key: "support_plan", label: "Support plans", count: 2 },
    { key: "mood_check_in", label: "Mood check-ins", count: 3 },
    { key: "adult_support_summary", label: "Adult summaries", count: 1 },
    { key: "mood_checkin_config", label: "Mood config", count: 1 },
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
        action: "mood_checkin_config_created",
        resource_type: "mood_checkin_config",
        status: "success",
        timestamp: "2026-05-22T00:00:00Z",
        reason: "admin_content_safety",
        metadata_summary: { mood_option_count: 6 },
        is_demo: true,
      },
    ],
  },
};

function mockFetch() {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const parsed = new URL(url);
    if (parsed.pathname === "/api/admin/mood-checkins/configs" && init?.method === "POST") {
      return Promise.resolve(
        new Response(JSON.stringify(savedConfig), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (parsed.pathname === "/api/admin/mood-checkins/configs/config-1/preview") {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            student_prompt: savedConfig.student_prompt,
            adult_guidance: savedConfig.adult_guidance,
            mood_options: savedConfig.mood_options,
            context_tags: savedConfig.context_tags,
            privacy_notes: ["Không hiển thị dữ liệu học sinh thô."],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    }
    if (parsed.pathname === "/api/admin/mood-checkins/configs") {
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    if (parsed.pathname === "/api/admin/operations/dashboard") {
      return Promise.resolve(
        new Response(JSON.stringify(operationsDashboard), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (parsed.pathname === "/api/admin/users") {
      return Promise.resolve(new Response(JSON.stringify([{ id: "admin-1" }]), { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    if (parsed.pathname === "/api/admin/links") {
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    return Promise.resolve(new Response(JSON.stringify({ detail: "not found" }), { status: 404 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Phase 15 admin metadata closure UI", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("saves and previews mood check-in config with cookie auth", async () => {
    const fetchMock = mockFetch();

    render(<AdminMoodCheckInsPage />);

    expect(await screen.findByText("Mood check-in")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText(/Trạng thái/), "published");
    await userEvent.click(screen.getByRole("button", { name: "Lưu cấu hình" }));

    await waitFor(() => expect(screen.getByText("Đã lưu cấu hình mood check-in.")).toBeInTheDocument());
    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(postCall?.[0]).toBe("http://localhost:8000/api/admin/mood-checkins/configs");
    expect(postCall?.[1]).toEqual(expect.objectContaining({ credentials: "include" }));

    await userEvent.click(screen.getByRole("button", { name: "Xem preview" }));
    expect(await screen.findByText("Preview")).toBeInTheDocument();
    expect(screen.getAllByText(savedConfig.student_prompt).length).toBeGreaterThan(0);
    expect(document.body.textContent ?? "").not.toMatch(/RAW_PRIVATE|private_note/i);
  });

  it("adds mood config card to admin dashboard", async () => {
    mockFetch();

    render(<AdminDashboardPage />);

    expect(await screen.findByRole("link", { name: /Mood check-in/ })).toHaveAttribute(
      "href",
      "/admin/mood-checkins",
    );
  });

  it("renders v1.2 metadata buckets in operations without raw private data", async () => {
    mockFetch();

    render(<AdminOperationsPage />);

    expect(await screen.findByText("Rà soát v1.2")).toBeInTheDocument();
    expect(screen.getByText("Mood check-ins")).toBeInTheDocument();
    expect(screen.getByText("mood_option_count: 6")).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/RAW_PRIVATE|private_note|student_id|raw_answers/i);
  });
});
