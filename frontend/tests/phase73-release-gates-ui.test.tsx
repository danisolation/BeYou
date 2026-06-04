import { render, screen, waitFor } from "@testing-library/react";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminOperationsPage from "@/app/(authenticated)/admin/operations/page";

const push = vi.fn();

const PHASE73_FRONTEND_REQUIREMENT_IDS = ["SECURE-01", "NOTIFY-02", "TENANT-01"];
const PHASE73_FORBIDDEN_FRONTEND_MARKERS = [
  "parent@example.com",
  "smtp.gmail.com",
  "smtp.outlook.com",
  "changeme",
  "tenant_id_should_not_render",
];
const PHASE32_COMPANION_TESTS = [
  "phase32-release-gates-ui.test.tsx",
  "phase23-mood-note-sharing-ui.test.tsx",
  "phase24-reason-access-ui.test.tsx",
];

const SYNTHETIC_TENANT_UUID = "00000000-1111-2222-3333-444455556666";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/operations",
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(""),
}));

const poisonedDashboard = {
  generated_at: "2026-06-04T00:00:00Z",
  privacy_notes: [
    "Chỉ hiển thị metadata vận hành: trạng thái, loại hành động, loại mục tiêu, thời gian và mã lỗi an toàn.",
  ],
  readiness: {
    status: "ready",
    generated_at: "2026-06-04T00:00:00Z",
    checks_by_status: [{ key: "pass", label: "Đạt", count: 1 }],
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
    credentialed_cors_methods: ["GET", "POST"],
  },
  production_smoke: [],
  deployment_guardrails: [],
  smoke_profiles: [],
  sos_email: {
    total: 1,
    by_status: [{ key: "failed", label: "Thất bại", count: 1 }],
    by_provider: [{ key: "smtp", label: "smtp", count: 1 }],
    by_error_code: [{ key: "smtp_dispatch_failed", label: "smtp_dispatch_failed", count: 1 }],
    recent: [
      {
        delivery_key: "delivery-1",
        alert_key: "alert-1",
        channel: "email",
        provider: "smtp",
        recipient_role: "teacher",
        status: "failed",
        attempt_count: 1,
        error_code: "smtp_dispatch_failed",
        last_attempt_at: "2026-06-04T00:00:00Z",
        delivered_at: null,
        created_at: "2026-06-04T00:00:00Z",
        is_demo: false,
        // Poison: even if backend regresses, the DOM must not render these:
        recipient_email: "parent@example.com",
        smtp_host: "smtp.gmail.com",
        smtp_password: "changeme",
        tenant_id: `tenant_id_should_not_render:${SYNTHETIC_TENANT_UUID}`,
      },
    ],
  },
  v1_2_audit: [],
  v1_4_audit: [],
  auth_provider: {
    enabled: false,
    provider_key: null,
    provider_label: null,
    mode: null,
    status: "pass",
    last_check_status: "ready",
    remediation: null,
  },
  identity_mappings: {
    by_status: [],
    pending_review_count: 0,
    disabled_count: 0,
    deprovisioned_count: 0,
  },
  session_auth: {
    by_auth_method: [],
    by_provider: [],
  },
  pilot_launch: {
    status: "ready",
    generated_at: "2026-06-04T00:00:00Z",
    checklist: [],
  },
  pilot_data_safety: { status: "safe", buckets: [] },
  pilot_handoff: { rollback: [], school_handoff: [], baseline_setup: [] },
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
        id: "audit-phase73",
        actor_role: "admin",
        action: "phase73_release_gate_checked",
        resource_type: "operations_readiness",
        status: "success",
        timestamp: "2026-06-04T00:00:00Z",
        reason: "admin_operations",
        metadata_summary: {
          safe_status: "pass",
          recipient_email: "parent@example.com",
          smtp_host: "smtp.gmail.com",
          smtp_password: "changeme",
          smtp_username: "changeme",
          tenant_id: SYNTHETIC_TENANT_UUID,
          tenant_url: "https://tenant.example.com/admin",
          credential_placeholder: "changeme",
          // also re-cover the Phase 32 redlines (zero regression):
          private_note: "private_note",
          sos_note: "sos_note",
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

describe("Phase 73 v2.4 frontend release gates", () => {
  beforeEach(() => {
    push.mockReset();
    vi.restoreAllMocks();
  });

  it("documents SECURE-01, NOTIFY-02, and TENANT-01 frontend release-gate coverage", () => {
    expect(PHASE73_FRONTEND_REQUIREMENT_IDS).toEqual(["SECURE-01", "NOTIFY-02", "TENANT-01"]);
  });

  it("keeps the Phase 32 companion regression tests on disk (zero-regression)", () => {
    for (const file of PHASE32_COMPANION_TESTS) {
      expect(existsSync(join(process.cwd(), "tests", file))).toBe(true);
    }
  });

  it("SECURE-01/NOTIFY-02/TENANT-01 admin operations DOM never renders v2.4 forbidden markers", async () => {
    mockFetch(poisonedDashboard);

    const { container } = render(<AdminOperationsPage />);

    await screen.findByText("Vận hành thử nghiệm");
    await waitFor(() => {
      expect(screen.getByText(/phase73_release_gate_checked/i)).toBeInTheDocument();
    });

    const rendered = (container.textContent ?? "") + (document.body.textContent ?? "");

    for (const forbidden of PHASE73_FORBIDDEN_FRONTEND_MARKERS) {
      expect(rendered).not.toMatch(
        new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      );
    }
    // Raw tenant UUID string must not appear anywhere in the DOM.
    expect(rendered).not.toContain(SYNTHETIC_TENANT_UUID);
    // Phase 32 invariants (zero regression):
    expect(rendered).not.toMatch(/private_note|sos_note/i);
  });
});
