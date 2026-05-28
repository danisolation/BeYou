import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "@/app/(authenticated)/admin/page";
import ParentDashboardPage from "@/app/(authenticated)/parent/page";
import StudentDashboardPage from "@/app/(authenticated)/student/page";
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

function mockFetchStatus(statusByPath: Record<string, number>, responses: Record<string, unknown> = {}) {
  const fetchMock = vi.fn((url: string) => {
    const path = new URL(url).pathname;
    const status = statusByPath[path] ?? 200;
    const body = responses[path] ?? (status >= 400 ? { detail: "unavailable" } : []);
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
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

const unsafeControlRegex = /Export|Xuất|Download|Tải xuống|reset|drilldown|risk leaderboard|xếp hạng nguy cơ/;

describe("Phase 34 final UI regression", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Student loading with the redesigned skeleton container", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    const { container } = render(<StudentDashboardPage />);

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("preserves the redesigned Student greeting, chat entry, and settings shortcut", async () => {
    mockFetch({
      "/api/student/profile": studentProfile,
    });

    render(<StudentDashboardPage />);

    expect(await screen.findByText("Chào Nguyễn An Demo! 👋")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute("href", "/student/chat");
    expect(screen.getByRole("link", { name: "Vào thiết lập" })).toHaveAttribute(
      "href",
      "/student/notification-preferences",
    );
    expect(screen.queryByText(/^Demo$/i)).not.toBeInTheDocument();
  });

  it("renders explicit error states when primary dashboard loads fail", async () => {
    mockFetchStatus({
      "/api/student/profile": 500,
      "/api/admin/users": 500,
      "/api/admin/links": 500,
      "/api/teacher/students": 500,
      "/api/parent/students": 500,
    });

    render(
      <>
        <StudentDashboardPage />
        <AdminDashboardPage />
        <TeacherDashboardPage />
        <ParentDashboardPage />
      </>,
    );

    expect(await screen.findAllByRole("alert")).toHaveLength(3);
    expect(screen.getAllByText("Không tải được")).toHaveLength(3);
    expect(screen.getByText("Quản trị hệ thống")).toBeInTheDocument();
  });

  it("keeps Admin dashboard entries free of unsafe control labels", async () => {
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
  });

  it("keeps touched Phase 34 sources aligned with the redesigned dashboard primitives and auth boundaries", () => {
    const studentSource = source("app/(authenticated)/student/page.tsx");
    const adminSource = [source("app/(authenticated)/admin/page.tsx"), source("lib/admin-api.ts")].join("\n");
    const layoutSource = source("app/(authenticated)/layout.tsx");
    const parentSource = source("app/(authenticated)/parent/page.tsx");
    const primitiveSource = source("components/ui-primitives.tsx");

    expect(studentSource).toContain("DashboardSkeleton");
    expect(studentSource).toContain("ErrorState");
    expect(studentSource).toContain("/api/student/profile");
    expect(adminSource).toContain("DashboardSkeleton");
    expect(adminSource).toContain("listUsers({ limit: 100 })");
    expect(adminSource).toContain("listLinks({ limit: 100 })");
    expect(parentSource).not.toContain("@/app/(authenticated)/teacher/page");

    for (const fileSource of [studentSource, adminSource, layoutSource, parentSource, primitiveSource]) {
      expect(fileSource).not.toContain("localStorage.setItem");
      expect(fileSource).not.toContain("sessionStorage.setItem");
      expect(fileSource).not.toContain("access_token");
      expect(fileSource).not.toContain("refresh_token");
      expect(fileSource).not.toContain("id_token");
    }
  });
});
