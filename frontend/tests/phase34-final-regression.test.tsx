import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "@/app/(authenticated)/admin/page";
import StudentDashboardPage from "@/app/(authenticated)/student/page";

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

  it("renders Student loading through accessible status primitive", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    render(<StudentDashboardPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Đang tải thông tin...");
  });

  it("preserves Student privacy link and red SOS confirmation flow", async () => {
    mockFetch({
      "/api/student/profile": studentProfile,
      "/api/student/sos-alerts": [],
      "/api/notifications/mood-check-in/reminder": null,
    });

    render(<StudentDashboardPage />);

    expect(await screen.findByRole("link", { name: "Ai có thể xem thông tin của em?" })).toBeInTheDocument();
    const sosButton = screen.getByRole("button", { name: "Gửi SOS hỗ trợ" });
    expect(sosButton.className).toMatch(/bg-red-600/);

    await userEvent.click(sosButton);

    expect(screen.getByText("Xác nhận gửi tín hiệu hỗ trợ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ở lại trang này" })).toBeInTheDocument();
  });

  it("keeps Admin metadata-only entries free of unsafe control labels", async () => {
    mockFetch({
      "/api/admin/users": [{ id: "u1" }, { id: "u2" }],
      "/api/admin/links": [{ id: "l1" }],
    });

    render(<AdminDashboardPage />);

    expect(await screen.findByText("Cổng quản trị")).toBeInTheDocument();
    expect(screen.getByText("Vận hành metadata-only")).toBeInTheDocument();
    expect(screen.getByText("Báo cáo tổng hợp riêng tư")).toBeInTheDocument();

    const controls = [...screen.getAllByRole("link"), ...screen.queryAllByRole("button")];
    for (const control of controls) {
      expect(control.textContent ?? "").not.toMatch(unsafeControlRegex);
    }
  });

  it("keeps touched Phase 34 sources primitive-backed and free of token/cross-role regressions", () => {
    const studentSource = source("app/(authenticated)/student/page.tsx");
    const adminSource = source("app/(authenticated)/admin/page.tsx");
    const layoutSource = source("app/(authenticated)/layout.tsx");
    const parentSource = source("app/(authenticated)/parent/page.tsx");
    const primitiveSource = source("components/ui-primitives.tsx");

    expect(studentSource).toContain("@/components/ui-primitives");
    expect(studentSource).toContain("LoadingState");
    expect(studentSource).toContain("ResponsiveTable");
    expect(studentSource).toContain("/api/student/profile");
    expect(adminSource).toContain("@/components/ui-primitives");
    expect(adminSource).toContain("/api/admin/users");
    expect(adminSource).toContain("/api/admin/links");
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
