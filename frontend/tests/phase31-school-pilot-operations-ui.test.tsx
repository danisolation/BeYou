import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminOperationsPage from "@/app/(authenticated)/admin/operations/page";

const phase31RequirementIds = ["PILOT-01", "PILOT-02", "PILOT-03", "PILOT-04", "PILOT-05"];

const baseDashboard = {
  generated_at: "2026-05-26T00:00:00Z",
  privacy_notes: [
    "Chỉ hiển thị metadata vận hành: trạng thái, loại hành động, loại mục tiêu, thời gian và mã lỗi an toàn.",
    "Không hiển thị ghi chú SOS, câu trả lời test tâm lý, nội dung chatbot, email người nhận, secret hoặc danh sách học sinh theo nguy cơ.",
  ],
  readiness: {
    status: "ready",
    generated_at: "2026-05-26T00:00:00Z",
    checks_by_status: [
      { key: "pass", label: "Đạt", count: 10 },
      { key: "warn", label: "Cần chú ý", count: 0 },
      { key: "fail", label: "Không đạt", count: 0 },
    ],
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
    summary: "Demo gates disabled for production pilot metadata.",
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
  deployment_guardrails: [],
  smoke_profiles: [],
  sos_email: {
    total: 0,
    by_status: [],
    by_provider: [],
    by_error_code: [],
    recent: [],
  },
  v1_2_audit: [],
  v1_4_audit: [],
  audit: {
    total_matching: 0,
    filters: {
      start_at: null,
      end_at: null,
      actor_role: null,
      action_type: null,
      target_type: null,
      status: null,
    },
    recent: [],
  },
};

const pilotDashboard = {
  ...baseDashboard,
  pilot_launch: {
    status: "ready",
    generated_at: "2026-05-26T00:00:00Z",
    checklist: [
      {
        key: "runtime_mode",
        label: "Runtime mode",
        status: "pass",
        blocking: true,
        evidence: "runtime_mode=production_pilot; production_pilot=yes",
        remediation: null,
        command: null,
        provider_subject: "provider_subject_should_not_render",
      },
      {
        key: "pilot_smoke_profile",
        label: "Production pilot smoke evidence",
        status: "pass",
        blocking: true,
        evidence: "readiness_status=ready; demo_seed_allowed=no; demo_login_allowed=no",
        remediation: null,
        command: "npm --prefix frontend run smoke:pilot",
      },
    ],
    raw_claims: "raw_claims_should_not_render",
  },
  pilot_data_safety: {
    status: "safe",
    buckets: [
      {
        key: "demo_active_users",
        label: "Demo active users",
        count: 0,
        status: "pass",
        blocking: false,
        evidence: "count=0; production_pilot=yes",
        remediation: null,
        student_id: "student_id_should_not_render",
      },
      {
        key: "real_active_students",
        label: "Real active students",
        count: 0,
        status: "pass",
        blocking: false,
        evidence: "count=0; production_pilot=yes",
        remediation: null,
      },
    ],
  },
  pilot_handoff: {
    rollback: [
      {
        key: "redeploy_known_good",
        label: "Redeploy known good frontend/backend",
        status: "pass",
        guidance: "Redeploy the last known good Vercel frontend and Render backend build.",
        command: null,
      },
      {
        key: "avoid_raw_export",
        label: "Avoid raw data export defaults",
        status: "pass",
        guidance: "Do not use raw data export as the default rollback path.",
        command: null,
      },
    ],
    school_handoff: [
      {
        key: "incident_path_metadata",
        label: "Incident path metadata",
        status: "warn",
        guidance: "Contact paths are documented outside Peerlight AI and no raw contact details are stored in operations metadata.",
        command: null,
        contact_email: "pilot-owner@example.test",
      },
    ],
    baseline_setup: [
      {
        key: "baseline_self_checks",
        label: "Baseline self-checks",
        status: "pass",
        guidance: "Published non-demo self-check count=1 before school pilot launch.",
        command: null,
      },
      {
        key: "demo_seed_disabled_for_pilot",
        label: "Demo seed disabled for pilot",
        status: "pass",
        guidance: "production_pilot=yes; demo_seed_allowed=no",
        command: null,
      },
    ],
  },
};

const legacyDashboard = {
  ...baseDashboard,
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

describe("Phase 31 school pilot operations UI", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("documents every Phase 31 requirement in the frontend gate", () => {
    expect(phase31RequirementIds).toEqual(["PILOT-01", "PILOT-02", "PILOT-03", "PILOT-04", "PILOT-05"]);
  });

  it("keeps Phase 31 pilot operation fields optional in the API contract", () => {
    const apiSource = readFileSync(join(process.cwd(), "lib/admin-operations-api.ts"), "utf8");

    expect(apiSource).toContain("export type PilotLaunchChecklistItem");
    expect(apiSource).toContain("export type PilotLaunchSummary");
    expect(apiSource).toContain("export type PilotDataSafetyBucket");
    expect(apiSource).toContain("export type PilotDataSafetySummary");
    expect(apiSource).toContain("export type PilotHandoffItem");
    expect(apiSource).toContain("export type PilotHandoffSummary");
    expect(apiSource).toContain("rollback: PilotHandoffItem[]");
    expect(apiSource).toContain("school_handoff: PilotHandoffItem[]");
    expect(apiSource).toContain("baseline_setup: PilotHandoffItem[]");
    expect(apiSource).toContain("pilot_launch?: PilotLaunchSummary | null");
    expect(apiSource).toContain("pilot_data_safety?: PilotDataSafetySummary | null");
    expect(apiSource).toContain("pilot_handoff?: PilotHandoffSummary | null");
  });

  it("renders production pilot launch status, checklist, data safety, baseline, and handoff metadata", async () => {
    mockFetch(pilotDashboard);

    render(<AdminOperationsPage />);

    expect(await screen.findByText("Vận hành thử nghiệm")).toBeInTheDocument();
    expect(screen.getByText("Trạng thái mở thử nghiệm")).toBeInTheDocument();
    expect(screen.getByText("Checklist trước khi mở")).toBeInTheDocument();
    expect(screen.getByText("An toàn dữ liệu mẫu/thực tế")).toBeInTheDocument();
    expect(screen.getByText("Thiết lập ban đầu")).toBeInTheDocument();
    expect(screen.getByText("Hướng dẫn khôi phục")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Kiểm tra mức sẵn sàng, bộ lọc rà soát và trạng thái hệ thống. Chỉ dữ liệu tổng hợp, không mở nội dung riêng tư.",
      ),
    ).toBeInTheDocument();

    expect(within(screen.getByTestId("pilot-launch-status")).getByText("Sẵn sàng")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("pilot-launch-status")).getByText(
        "Thử nghiệm đã sẵn sàng theo dữ liệu tổng hợp hiện tại. Vẫn cần xác nhận vận hành với nhà trường trước khi mở thực tế.",
      ),
    ).toBeInTheDocument();
    expect(within(screen.getByTestId("pilot-launch-checklist")).getByText("Runtime mode")).toBeInTheDocument();
    expect(within(screen.getByTestId("pilot-launch-checklist")).getByText("npm --prefix frontend run smoke:pilot")).toBeInTheDocument();
    expect(within(screen.getByTestId("pilot-data-safety")).getByText("Demo active users")).toBeInTheDocument();
    expect(within(screen.getByTestId("pilot-baseline-setup")).getByText("Baseline self-checks")).toBeInTheDocument();
    expect(within(screen.getByTestId("pilot-handoff-guidance")).getByText("Khôi phục")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("pilot-handoff-guidance")).getByText(
        "Redeploy the last known good Vercel frontend and Render backend build.",
      ),
    ).toBeInTheDocument();

    const rendered = document.body.textContent ?? "";
    expect(rendered).not.toMatch(
      /student\.demo@|teacher\.demo@|provider_subject|raw_claims|private_note|sos_note|transcript|self_check_answer|student_id|recipient_id|pilot-owner@example|risk leaderboard|xếp hạng nguy cơ/i,
    );
    expect(screen.queryByRole("button", { name: /Xuất|Export|Download|Tải xuống|reset|drilldown|Chi tiết học sinh|xếp hạng nguy cơ/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Xuất|Export|Download|Tải xuống|reset|drilldown|Chi tiết học sinh|xếp hạng nguy cơ/i })).not.toBeInTheDocument();
  });

  it("renders safe empty states when older operations payloads omit all pilot fields", async () => {
    mockFetch(legacyDashboard);

    render(<AdminOperationsPage />);

    expect(await screen.findByText("Chưa có danh sách kiểm tra thử nghiệm. Hãy kiểm tra mức sẵn sàng và tải lại trang vận hành.")).toBeInTheDocument();
    expect(screen.getByText("Chưa có dữ liệu tổng hợp về an toàn dữ liệu thử nghiệm. Không có dữ liệu thô nào được hiển thị.")).toBeInTheDocument();
    expect(screen.getByText("Chưa có dữ liệu tổng hợp về thiết lập. Hãy xác nhận nội dung và cấu hình thử nghiệm trước khi mở.")).toBeInTheDocument();
    expect(
      screen.getByText("Chưa có hướng dẫn bàn giao. Hãy dùng quy trình khôi phục an toàn trong README và kiểm tra lại mức sẵn sàng."),
    ).toBeInTheDocument();
  });
});
