import { render, screen } from "@testing-library/react";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "@/app/(authenticated)/admin/page";
import ParentDashboardPage from "@/app/(authenticated)/parent/page";
import StudentDashboardPage from "@/app/(authenticated)/student/page";
import TeacherDashboardPage from "@/app/(authenticated)/teacher/page";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function componentSourceFiles(dir = "components"): string[] {
  const absoluteDir = join(process.cwd(), dir);
  return readdirSync(absoluteDir).flatMap((entry) => {
    const relativePath = `${dir}/${entry}`;
    const absolutePath = join(process.cwd(), relativePath);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      return componentSourceFiles(relativePath);
    }
    return /\.(ts|tsx)$/.test(entry) ? [relativePath] : [];
  });
}

function sharedPresentationComponentFiles() {
  const intentionallyRouteOwnedComponents = new Set([
    "components/demo-role-entry.tsx",
    "components/theme-provider.tsx",
  ]);
  return componentSourceFiles().filter((path) => !intentionallyRouteOwnedComponents.has(path));
}

function mockFetch(responses: Record<string, unknown>) {
  const fetchMock = vi.fn((url: string) => {
    const path = new URL(url).pathname;
    const body = responses[path] ?? [];
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const studentProfile = {
  id: "student-1",
  full_name: "Nguyễn An Demo",
  email: "student.demo@beyou.local",
  school: "Trường THPT BeYou Demo",
  class_name: "10A1",
  is_demo: true,
  linked_adults: [],
};

const linkedStudents = [
  {
    id: "student-1",
    full_name: "Nguyễn An Demo",
    email: "student.demo@beyou.local",
    school: "Trường THPT BeYou Demo",
    class_name: "10A1",
    relationship_type: "teacher",
    link_status: "active",
    is_demo: true,
  },
];

const teacherSupportOverview = [
  {
    student: linkedStudents[0],
    latest_self_check_summary: {
      support_suggestion: "Khuyến khích học sinh chọn một người lớn tin tưởng để trao đổi.",
    },
    latest_sos_alert: {
      id: "sos-1",
      current_status: "sent",
    },
    open_sos_count: 1,
    warning_group: "can_quan_tam",
    warning_group_label: "Cần quan tâm",
  },
];

const parentSupportOverview = [
  {
    student: linkedStudents[0],
    latest_self_check_summary: null,
    latest_sos_alert: {
      id: "sos-1",
      current_status: "received",
    },
    open_sos_count: 1,
    warning_group: "nguy_co_cao",
    warning_group_label: "Nguy cơ cao",
  },
];

const unsafeControlRegex = /Export|Xuất|Download|Tải xuống|reset|drilldown|risk leaderboard|xếp hạng nguy cơ|Chi tiết học sinh|raw audit/;
const rawAdultAdminLabelRegex = /raw self-check|private notes|chat transcripts|provider claims|request bodies|free-text access reasons/i;
const PHASE35_REQUIREMENTS = ["ROLE-01", "ROLE-02", "ROLE-03", "ROLE-04"];

describe("Phase 35 role dashboard consistency regression", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the redesigned Student dashboard greeting and StitchCard shortcuts", async () => {
    mockFetch({
      "/api/student/profile": studentProfile,
    });

    render(<StudentDashboardPage />);

    expect(await screen.findByText(/Nguyễn An Demo/)).toBeInTheDocument();
    expect(screen.getByText("Test tâm lý")).toBeInTheDocument();
    expect(screen.getByText("Check-in cảm xúc")).toBeInTheDocument();
    expect(screen.getByText("Tình huống xử lý")).toBeInTheDocument();
    expect(screen.getByText("Cài đặt")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vào thiết lập" })).toHaveAttribute(
      "href",
      "/student/notification-preferences",
    );
    expect(screen.queryByText(/^Demo$/i)).not.toBeInTheDocument();
  });

  it("renders the redesigned Teacher dashboard without raw private-content labels", async () => {
    mockFetch({
      "/api/teacher/students": linkedStudents,
      "/api/teacher/support-overview": teacherSupportOverview,
      "/api/notifications": [],
    });

    render(<TeacherDashboardPage />);

    expect(await screen.findByText("Xin chào, thầy/cô! 👋")).toBeInTheDocument();
    expect(screen.getByText("Học sinh liên kết")).toBeInTheDocument();
    expect(screen.getByText("1 học sinh đang được đồng hành")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem danh sách" })).toHaveAttribute("href", "/teacher/students");
    expect(document.body.textContent ?? "").not.toMatch(rawAdultAdminLabelRegex);
  });

  it("keeps dashboard links app-owned and route-safe across student and teacher dashboards", async () => {
    mockFetch({
      "/api/student/profile": studentProfile,
    });

    const { unmount } = render(<StudentDashboardPage />);
    await screen.findByText(/Nguyễn An Demo/);
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href") ?? "").toMatch(/^\//);
      expect(link.getAttribute("href") ?? "").not.toMatch(/^https?:|^javascript:/i);
    }

    unmount();
    mockFetch({
      "/api/teacher/students": linkedStudents,
      "/api/teacher/support-overview": teacherSupportOverview,
      "/api/notifications": [
        {
          id: "notification-unsafe",
          resource_type: "sos_alert",
          resource_id: "sos-unsafe",
          title: "Tín hiệu SOS mới",
          body: "Có tín hiệu hỗ trợ mới từ học sinh được liên kết.",
          href: "javascript:alert(1)",
          read_at: null,
          created_at: "2026-05-26T10:00:00Z",
          is_demo: true,
        },
      ],
    });

    render(<TeacherDashboardPage />);
    await screen.findByText("Xin chào, thầy/cô! 👋");
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href") ?? "").toMatch(/^\//);
      expect(link.getAttribute("href") ?? "").not.toMatch(/^https?:|^javascript:/i);
    }
  });

  it("renders the redesigned Parent dashboard without Teacher update wording", async () => {
    mockFetch({
      "/api/parent/students": linkedStudents,
      "/api/parent/support-overview": parentSupportOverview,
      "/api/notifications": [],
    });

    render(<ParentDashboardPage />);

    expect(await screen.findByText("Xin chào, phụ huynh! 👋")).toBeInTheDocument();
    expect(screen.getByText("Con của bạn")).toBeInTheDocument();
    expect(screen.getByText("1 con đang được đồng hành")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem thông tin" })).toHaveAttribute("href", "/parent/students");
    expect(screen.queryByRole("link", { name: "Xem danh sách" })).not.toBeInTheDocument();
  });

  it("renders the redesigned Admin dashboard and rejects unsafe controls", async () => {
    mockFetch({
      "/api/admin/users": [{ id: "u1" }, { id: "u2" }],
      "/api/admin/links": [{ id: "l1" }],
    });

    render(<AdminDashboardPage />);

    expect(await screen.findByText("Quản trị hệ thống")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bảng vận hành/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Báo cáo tổng hợp/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Chatbot AI/ })).toBeInTheDocument();
    const controls = [...screen.getAllByRole("link"), ...screen.queryAllByRole("button")];
    for (const control of controls) {
      expect(control.textContent ?? "").not.toMatch(unsafeControlRegex);
    }
    expect(document.body.textContent ?? "").not.toMatch(rawAdultAdminLabelRegex);
  });

  it("keeps route-owned API paths and browser-token storage redlines static", () => {
    const dashboardSources = [
      source("app/(authenticated)/student/page.tsx"),
      source("app/(authenticated)/teacher/page.tsx"),
      source("app/(authenticated)/parent/page.tsx"),
      source("app/(authenticated)/admin/page.tsx"),
      source("lib/adult-dashboard-loader.ts"),
      source("lib/admin-api.ts"),
    ].join("\n");

    expect(dashboardSources).toContain("/api/student/profile");
    expect(dashboardSources).toContain("loadTeacherDashboard");
    expect(dashboardSources).toContain("getTeacherSupportOverview");
    expect(dashboardSources).toContain("loadParentDashboard");
    expect(dashboardSources).toContain("getParentSupportOverview");
    expect(dashboardSources).toContain("listUsers({ limit: 100 })");
    expect(dashboardSources).toContain("listLinks({ limit: 100 })");
    expect(source("app/(authenticated)/parent/page.tsx")).not.toContain("@/app/(authenticated)/teacher/page");

    for (const forbidden of ["localStorage.setItem", "sessionStorage.setItem", "access_token", "refresh_token", "id_token"]) {
      expect(dashboardSources).not.toContain(forbidden);
    }
  });

  it("maps final Phase 35 requirements to the current dashboard strings and quick actions", () => {
    expect(PHASE35_REQUIREMENTS).toEqual(["ROLE-01", "ROLE-02", "ROLE-03", "ROLE-04"]);

    const studentSource = source("app/(authenticated)/student/page.tsx");
    for (const required of [
      "{greeting}, {name}!",
      "Peerlight AI",
      "Test tâm lý",
      "Check-in cảm xúc",
      "Vào thiết lập",
    ]) {
      expect(studentSource).toContain(required);
    }

    const adultSource = [
      source("app/(authenticated)/teacher/page.tsx"),
      source("app/(authenticated)/parent/page.tsx"),
    ].join("\n");
    for (const required of [
      "Xin chào, thầy/cô! 👋",
      "Xin chào, phụ huynh! 👋",
      "Peerlight AI",
      "Xem danh sách",
      "Xem thông tin",
      "Xem cảnh báo",
    ]) {
      expect(adultSource).toContain(required);
    }

    const adminSource = source("app/(authenticated)/admin/page.tsx");
    for (const required of [
      "Quản trị hệ thống",
      "Bảng vận hành",
      "Báo cáo tổng hợp",
      "Chatbot AI",
      "Chính sách riêng tư",
    ]) {
      expect(adminSource).toContain(required);
    }
  });

  it("keeps shared presentation components free of route/auth imports and raw labels", () => {
    const sharedSources = sharedPresentationComponentFiles().map((path) => [path, source(path)] as const);
    const forbiddenSharedImports = [
      "@/app/(authenticated)/student/page",
      "@/app/(authenticated)/teacher/page",
      "@/app/(authenticated)/parent/page",
      "@/app/(authenticated)/admin/page",
      "@/lib/auth",
    ];

    for (const [path, sharedSource] of sharedSources) {
      for (const forbidden of forbiddenSharedImports) {
        expect(sharedSource, path).not.toContain(forbidden);
      }
      expect(sharedSource, path).not.toMatch(rawAdultAdminLabelRegex);
      expect(sharedSource, path).not.toMatch(/access_token|refresh_token|id_token/);
    }
    expect(source("app/(authenticated)/parent/page.tsx")).not.toContain("@/app/(authenticated)/teacher/page");
  });

  it("keeps adult and admin presentation free of raw support-data labels", () => {
    const adultAdminSources = [
      source("components/adult-student-list.tsx"),
      source("app/(authenticated)/teacher/page.tsx"),
      source("app/(authenticated)/parent/page.tsx"),
      source("app/(authenticated)/admin/page.tsx"),
    ];
    const forbiddenRawLabels = [
      "raw self-check",
      "private notes",
      "chat transcripts",
      "provider claims",
      "request bodies",
      "free-text access reasons",
    ];

    for (const fileSource of adultAdminSources) {
      for (const forbidden of forbiddenRawLabels) {
        expect(fileSource).not.toContain(forbidden);
      }
    }
  });

  it("preserves the redesigned loading and error behavior for Phase 35 dashboards", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    const { container } = render(<StudentDashboardPage />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();

    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const path = new URL(url).pathname;
        return Promise.resolve(
          new Response(JSON.stringify(path.includes("notifications") ? [] : { detail: "unavailable" }), {
            status: path.includes("notifications") ? 200 : 500,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }),
    );

    render(
      <div>
        <AdminDashboardPage />
        <TeacherDashboardPage />
        <ParentDashboardPage />
      </div>,
    );

    const alerts = await screen.findAllByRole("alert");
    expect(alerts).toHaveLength(2);
    for (const alert of alerts) {
      expect(alert).toHaveTextContent("Không tải được");
    }
    expect(screen.getByText("Quản trị hệ thống")).toBeInTheDocument();
  });
});
