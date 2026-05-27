import { render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ParentDashboardPage from "@/app/(authenticated)/parent/page";
import TeacherDashboardPage from "@/app/(authenticated)/teacher/page";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

type MockResponse = {
  status?: number;
  body?: unknown;
};

function mockFetch(responses: Record<string, MockResponse>) {
  const fetchMock = vi.fn((url: string) => {
    const path = new URL(url).pathname;
    const response = responses[path] ?? { status: 404, body: { detail: "missing" } };
    return Promise.resolve(
      new Response(JSON.stringify(response.body ?? []), {
        status: response.status ?? 200,
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

const teacherSupportOverview = [
  {
    student: linkedStudent,
    latest_self_check_summary: null,
    latest_sos_alert: {
      id: "sos-1",
      current_status: "sent",
    },
    open_sos_count: 1,
    warning_group: "can_quan_tam",
    warning_group_label: "Cần quan tâm",
    is_demo: true,
  },
];

describe("Phase 37 adult dashboard loading", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders scoped adult skeletons while loading", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    render(<TeacherDashboardPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Đang tải tóm tắt hỗ trợ...");
  });

  it("keeps Teacher linked students visible when optional panels are unavailable", async () => {
    mockFetch({
      "/api/teacher/students": { body: [linkedStudent] },
      "/api/teacher/support-overview": { status: 500, body: { detail: "unavailable" } },
      "/api/notifications": { status: 500, body: { detail: "unavailable" } },
    });

    render(<TeacherDashboardPage />);

    expect(await screen.findByText("Nguyễn An Demo")).toBeInTheDocument();
    expect(screen.getByText("Tóm tắt hỗ trợ tạm thời chưa tải được")).toBeInTheDocument();
    expect(screen.getByText("Thông báo hỗ trợ tạm thời chưa tải được.")).toBeInTheDocument();
  });

  it("distinguishes Parent linked students from SOS-visible empty state", async () => {
    mockFetch({
      "/api/parent/students": { body: [linkedStudent] },
      "/api/parent/support-overview": { body: [] },
      "/api/notifications": { body: [] },
    });

    render(<ParentDashboardPage />);

    expect(await screen.findByText("Chưa có học sinh SOS được phép xem")).toBeInTheDocument();
  });

  it("keeps Parent linked-student failures as primary errors", async () => {
    mockFetch({
      "/api/parent/students": { status: 500, body: { detail: "unavailable" } },
      "/api/parent/support-overview": { body: [] },
      "/api/notifications": { body: [] },
    });

    render(<ParentDashboardPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể tải thông tin");
  });

  it("uses credentialed no-store options for adult dashboard reads", async () => {
    const fetchMock = mockFetch({
      "/api/teacher/students": { body: [linkedStudent] },
      "/api/teacher/support-overview": { body: teacherSupportOverview },
      "/api/parent/students": { body: [linkedStudent] },
      "/api/parent/support-overview": { body: [] },
      "/api/notifications": { body: [] },
    });

    render(
      <>
        <TeacherDashboardPage />
        <ParentDashboardPage />
      </>,
    );

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(6));

    for (const path of [
      "/api/teacher/students",
      "/api/teacher/support-overview",
      "/api/parent/students",
      "/api/parent/support-overview",
      "/api/notifications",
    ]) {
      const call = fetchMock.mock.calls.find(([url]) => new URL(String(url)).pathname === path);
      expect(call?.[1]).toEqual(expect.objectContaining({ credentials: "include", cache: "no-store" }));
    }
  });

  it("keeps adult role pages separated by route imports", () => {
    const parentSource = source("app/(authenticated)/parent/page.tsx");
    const teacherSource = source("app/(authenticated)/teacher/page.tsx");
    const studentSource = source("app/(authenticated)/student/page.tsx");
    const adminSource = source("app/(authenticated)/admin/page.tsx");

    expect(parentSource).not.toContain("@/app/(authenticated)/teacher/page");
    for (const fileSource of [parentSource, teacherSource, studentSource, adminSource]) {
      expect(fileSource).not.toMatch(/@\/app\/\(authenticated\)\/(student|teacher|parent|admin)\/page/);
    }
  });
});
