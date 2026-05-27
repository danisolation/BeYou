import { render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ParentDashboardPage from "@/app/(authenticated)/parent/page";
import TeacherDashboardPage from "@/app/(authenticated)/teacher/page";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function mockFetch(responses: Record<string, unknown>) {
  const fetchMock = vi.fn((url: string) => {
    const path = new URL(url).pathname;
    const body = responses[path];
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

const linkedStudent = {
  id: "student-1",
  full_name: "Nguyễn An Demo",
  email: "student.demo@beyou.local",
  school: "Trường THPT BeYou Demo",
  class_name: "10A1",
  relationship_type: "teacher",
  link_status: "active",
  is_demo: true,
};

const supportOverview = [
  {
    student: {
      id: "student-1",
      full_name: "Nguyễn An Demo",
      school: "Trường THPT BeYou Demo",
      class_name: "10A1",
    },
    warning_group: "nguy_co_cao",
    warning_group_label: "Cần hỗ trợ ngay",
    latest_self_check_summary: {
      completed_at: "2026-05-26T00:00:00Z",
      test_type: "wellbeing",
      state_label: "Cần quan tâm",
      advice_summary: "Tóm tắt đã được phép xem.",
      support_suggestion: "Ưu tiên mở lời hỗ trợ an toàn.",
      is_demo: true,
    },
    latest_sos_alert: {
      id: "sos-1",
      student: {
        id: "student-1",
        full_name: "Nguyễn An Demo",
        school: "Trường THPT BeYou Demo",
        class_name: "10A1",
      },
      severity: "urgent",
      source: "student_dashboard",
      note: null,
      current_status: "sent",
      created_at: "2026-05-26T00:00:00Z",
      updated_at: "2026-05-26T00:00:00Z",
      completed_at: null,
      status_events: [],
      is_demo: true,
    },
    open_sos_count: 1,
    is_demo: true,
  },
];

describe("Phase 34 adult shared presentation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps Parent from importing shared presentation through the Teacher route", () => {
    const parentSource = source("app/(authenticated)/parent/page.tsx");
    const teacherSource = source("app/(authenticated)/teacher/page.tsx");
    const loaderSource = source("lib/adult-dashboard-loader.ts");

    expect(parentSource).not.toContain("@/app/(authenticated)/teacher/page");
    // After Phase 37 refactoring, API paths live in adult-dashboard-loader.ts
    expect(loaderSource).toContain("/api/parent/students");
    expect(loaderSource).toContain("getParentSupportOverview");
    expect(loaderSource).toContain("/api/teacher/students");
    expect(loaderSource).toContain("getTeacherSupportOverview");
    // Pages use the typed loader
    expect(parentSource).toContain("loadParentDashboard");
    expect(teacherSource).toContain("loadTeacherDashboard");
  });

  it("renders distinct teacher and parent adult boundaries without raw private content markers", async () => {
    mockFetch({
      "/api/teacher/students": [linkedStudent],
      "/api/parent/students": [{ ...linkedStudent, relationship_type: "parent" }],
      "/api/teacher/support-overview": supportOverview,
      "/api/parent/support-overview": supportOverview,
      "/api/notifications": [],
    });

    const { container } = render(
      <>
        <TeacherDashboardPage />
        <ParentDashboardPage />
      </>,
    );

    // Wait for async loaders to complete and components to re-render
    await waitFor(() => {
      expect(container.textContent).toContain("Ranh giới hỗ trợ của giáo viên");
    }, { timeout: 3000 });

    expect(container.textContent).toContain("Ranh giới hỗ trợ của phụ huynh");
    expect(screen.getByRole("link", { name: "Xem và cập nhật SOS" })).toHaveAttribute(
      "href",
      "/teacher/sos-alerts/sos-1",
    );
    expect(screen.getByRole("link", { name: "Xem trạng thái SOS" })).toHaveAttribute(
      "href",
      "/parent/sos-alerts/sos-1",
    );
    expect(container.textContent).toContain("hỗ trợ/read-only");

    const renderedText = document.body.textContent ?? "";
    for (const forbidden of [
      "transcript",
      "self_check_answer",
      "scenario_answer",
      "raw_claims",
      "access_token",
      "risk leaderboard",
      "xếp hạng nguy cơ",
    ]) {
      expect(renderedText).not.toContain(forbidden);
    }
  });
});
