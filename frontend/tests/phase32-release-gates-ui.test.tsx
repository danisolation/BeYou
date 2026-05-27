import { render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminOperationsPage from "@/app/(authenticated)/admin/operations/page";
import LoginPage from "@/app/login/page";
import { apiFetch } from "@/lib/api";

const push = vi.fn();
const PHASE32_FRONTEND_REQUIREMENT_IDS = ["QA-03", "QA-04", "QA-05"];
const PHASE32_QA04_COMPANION_TESTS = [
  "phase23-mood-note-sharing-ui.test.tsx",
  "phase24-reason-access-ui.test.tsx",
];

vi.mock("next/navigation", () => ({
  usePathname: () => "/student",
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("next=/student"),
}));

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const operationsDashboard = {
  generated_at: "2026-05-26T00:00:00Z",
  privacy_notes: [
    "Chỉ hiển thị metadata vận hành: trạng thái, loại hành động, loại mục tiêu, thời gian và mã lỗi an toàn.",
    "Không hiển thị ghi chú SOS, câu trả lời test tâm lý, nội dung chatbot, email người nhận, secret hoặc danh sách học sinh theo nguy cơ.",
  ],
  readiness: {
    status: "ready",
    generated_at: "2026-05-26T00:00:00Z",
    checks_by_status: [{ key: "pass", label: "Đạt", count: 12 }],
    attention_checks: [],
  },
  runtime: {
    mode: "production_pilot",
    is_demo_runtime: false,
    production_pilot: true,
    demo_seed_allowed: false,
    demo_login_allowed: false,
  },
  demo_seed: {
    status: "pass",
    summary: "Demo seed disabled for production pilot.",
    remediation: null,
    allow_demo_seed: false,
    roles: [],
    active_link_count: 0,
    published_self_check_count: 0,
    published_scenario_count: 0,
    published_mood_config_count: 0,
    v1_4_policy_count: 0,
    v1_4_preference_count: 0,
    v1_4_reminder_state_count: 0,
    v1_4_share_count: 0,
  },
  connectivity: {
    frontend_origin_kind: "https",
    allowed_origin_count: 1,
    has_local_origin: false,
    all_origins_https: true,
    health_live_path: "/health/live",
    health_ready_path: "/health/ready",
    session_cookie_secure: true,
    session_cookie_samesite: "none",
    credentialed_cors_methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
  production_smoke: [],
  deployment_guardrails: [
    {
      key: "frontend_api_target",
      category: "vercel_frontend",
      status: "pass",
      evidence: "frontend_api_target_checked=yes; backend_value_exposed=no",
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
      evidence: "uses_demo_accounts=yes; requires_readiness_ready=no",
      remediation: null,
    },
    {
      key: "pilot_smoke",
      label: "Production pilot smoke",
      status: "pass",
      command: "npm --prefix frontend run smoke:pilot",
      uses_demo_accounts: false,
      requires_readiness_ready: true,
      evidence: "uses_demo_accounts=no; requires_readiness_ready=yes",
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
  v1_2_audit: [],
  v1_4_audit: [],
  auth_provider: {
    enabled: true,
    provider_key: "pilot_sso",
    provider_label: "Pilot SSO",
    mode: "production_pilot",
    status: "pass",
    last_check_status: "ready",
    remediation: null,
    client_secret: "client_secret_should_not_render",
  },
  identity_mappings: {
    by_status: [{ key: "linked", label: "Linked", count: 1 }],
    pending_review_count: 0,
    disabled_count: 0,
    deprovisioned_count: 0,
    provider_subject: "provider_subject_should_not_render",
    raw_claims: "raw_claims_should_not_render",
  },
  session_auth: {
    by_auth_method: [{ key: "sso", label: "SSO", count: 1 }],
    by_provider: [{ key: "pilot_sso", label: "Pilot SSO", count: 1 }],
  },
  pilot_launch: {
    status: "ready",
    generated_at: "2026-05-26T00:00:00Z",
    checklist: [
      {
        key: "deployment_guardrails",
        label: "Deployment guardrails",
        status: "pass",
        blocking: true,
        evidence: "guardrails=pass",
        remediation: null,
        command: "npm --prefix frontend run guard:deploy",
        student_email: "student.demo@beyou.local",
        provider_subject: "provider_subject_should_not_render",
      },
      {
        key: "pilot_smoke",
        label: "Pilot smoke",
        status: "pass",
        blocking: true,
        evidence: "readiness=ready",
        remediation: null,
        command: "npm --prefix frontend run smoke:pilot",
      },
    ],
  },
  pilot_data_safety: {
    status: "safe",
    buckets: [
      {
        key: "real_active_students",
        label: "Real active students",
        count: 0,
        status: "pass",
        blocking: false,
        evidence: "count=0",
        remediation: null,
        student_id: "student_id_should_not_render",
      },
    ],
  },
  pilot_handoff: {
    rollback: [
      {
        key: "redeploy_known_good",
        label: "Redeploy known good",
        status: "pass",
        guidance: "Redeploy known good builds; no raw export default.",
        command: null,
        export_url: "https://unsafe.example/export",
      },
    ],
    school_handoff: [
      {
        key: "school_contact_metadata",
        label: "School contact metadata",
        status: "pass",
        guidance: "Contact metadata is kept outside operations payload.",
        command: null,
        contact_email: "pilot-owner@example.test",
      },
    ],
    baseline_setup: [],
  },
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
        action: "phase32_release_gate_checked",
        resource_type: "operations_readiness",
        status: "success",
        timestamp: "2026-05-26T00:00:00Z",
        reason: "admin_operations",
        metadata_summary: {
          safe_status: "pass",
          student_email: "student.demo@beyou.local",
          student_id: "student_id_should_not_render",
          recipient_id: "recipient_id_should_not_render",
          provider_subject: "provider_subject_should_not_render",
          raw_claims: "raw_claims_should_not_render",
          private_note: "private_note",
          sos_note: "sos_note",
          transcript: "transcript",
          self_check_answer: "self_check_answer",
          scenario_answer: "scenario_answer",
          reason_text: "reason_text",
          access_reason_text: "access_reason_text",
          export_url: "https://unsafe.example/export",
          risk_leaderboard: "xếp hạng nguy cơ",
        },
        is_demo: false,
      },
    ],
  },
};

function mockFetch(body: unknown) {
  const fetchMock = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Phase 32 frontend release gates", () => {
  beforeEach(() => {
    push.mockReset();
    vi.restoreAllMocks();
  });

  it("documents QA-03, QA-04, and QA-05 frontend release-gate coverage", () => {
    expect(PHASE32_FRONTEND_REQUIREMENT_IDS).toEqual(["QA-03", "QA-04", "QA-05"]);
    expect(PHASE32_QA04_COMPANION_TESTS).toEqual([
      "phase23-mood-note-sharing-ui.test.tsx",
      "phase24-reason-access-ui.test.tsx",
    ]);
  });

  it('QA-03 apiFetch uses credentials: "include" and never writes browser token storage', async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const sessionStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/auth/me");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/auth/me",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(localStorageSpy).not.toHaveBeenCalledWith(expect.stringMatching(/access_token|refresh_token|id_token/i), expect.anything());
    expect(sessionStorageSpy).not.toHaveBeenCalledWith(expect.stringMatching(/access_token|refresh_token|id_token/i), expect.anything());
  });

  it("QA-03 auth sources contain no localStorage.setItem, sessionStorage.setItem, OAuth callback, or browser token fields", () => {
    const authSources = [
      source("lib/api.ts"),
      source("lib/auth.ts"),
      source("app/login/page.tsx"),
      source("app/(authenticated)/layout.tsx"),
    ].join("\n");

    expect(authSources).toContain('credentials: "include"');
    for (const forbidden of [
      "localStorage.setItem",
      "sessionStorage.setItem",
      "access_token",
      "refresh_token",
      "id_token",
      "oauth",
      "oidc",
      "callback",
      "authorize_redirect",
    ]) {
      expect(authSources.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  it("QA-03 production pilot capabilities hide demo shortcuts while preserving email/password submit", async () => {
    mockFetch({
      demo_login_enabled: false,
      public_demo_entry_enabled: false,
      email_password_enabled: true,
      provider_login_enabled: false,
      provider_label: null,
      provider_mode: null,
      production_pilot: true,
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Demo công khai đang tắt cho production pilot. Hãy dùng tài khoản được cấp bởi quản trị viên."),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Học sinh" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Giáo viên" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Phụ huynh" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quản trị" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeEnabled();
  });

  it("QA-04 authenticated layout keeps privacy acknowledgement gate before student content", () => {
    const layoutSource = source("app/(authenticated)/layout.tsx");

    expect(layoutSource).toContain("privacy_acknowledgement_required");
    expect(layoutSource).toContain("studentPathRequiresPrivacy");
    expect(layoutSource).toContain("router.push(`/privacy?next=");
    expect(layoutSource).toContain("privacyRedirectRequired");
    expect(layoutSource.indexOf("{privacyRedirectRequired ?")).toBeLessThan(layoutSource.lastIndexOf("children"));
  });

  it("QA-04 frontend sources do not add raw private data display markers", () => {
    const operationsSource = source("app/(authenticated)/admin/operations/page.tsx");
    const sourceWithoutSanitizer = operationsSource.replace(
      /const forbiddenMetadataKeyPattern[\s\S]*?const safeMetadataFallback = "metadata_an_toan";/,
      "",
    );
    const forbidden = /private_note|sos_note|transcript|self_check_answer|scenario_answer|provider_subject|raw_claims|student_id|recipient_id|access_reason_text/i;

    expect(operationsSource).toContain("forbiddenMetadataKeyPattern");
    expect(sourceWithoutSanitizer).not.toMatch(forbidden);
    expect(PHASE32_QA04_COMPANION_TESTS).toContain("phase23-mood-note-sharing-ui.test.tsx");
    expect(PHASE32_QA04_COMPANION_TESTS).toContain("phase24-reason-access-ui.test.tsx");
  });

  it("QA-05 operations UI excludes unsafe fields and keeps safe release commands visible", async () => {
    mockFetch(operationsDashboard);

    render(<AdminOperationsPage />);

    expect(await screen.findByText("Vận hành metadata-only")).toBeInTheDocument();
    expect(screen.getAllByText("npm --prefix frontend run guard:deploy").length).toBeGreaterThan(0);
    expect(screen.getByText("npm --prefix frontend run smoke:demo")).toBeInTheDocument();
    expect(screen.getAllByText("npm --prefix frontend run smoke:pilot").length).toBeGreaterThan(0);
    expect(screen.getByText("safe_status: pass")).toBeInTheDocument();

    const rendered = document.body.textContent ?? "";
    for (const forbidden of [
      "student.demo@beyou.local",
      "student_id_should_not_render",
      "recipient_id_should_not_render",
      "provider_subject_should_not_render",
      "raw_claims_should_not_render",
      "private_note",
      "sos_note",
      "transcript",
      "self_check_answer",
      "scenario_answer",
      "reason_text",
      "access_reason_text",
      "https://unsafe.example/export",
      "pilot-owner@example.test",
      "risk leaderboard",
      "xếp hạng nguy cơ",
    ]) {
      expect(rendered).not.toMatch(new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    }
    expect(
      screen.queryByRole("button", {
        name: /Xuất|Export|Download|Tải xuống|reset|drilldown|Chi tiết học sinh|xếp hạng nguy cơ|risk leaderboard/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: /Xuất|Export|Download|Tải xuống|reset|drilldown|Chi tiết học sinh|xếp hạng nguy cơ|risk leaderboard/i,
      }),
    ).not.toBeInTheDocument();
  });
});
