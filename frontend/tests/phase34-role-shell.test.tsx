import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthenticatedLayout from "@/app/(authenticated)/layout";

const push = vi.fn();
let pathname = "/student";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function mockFetch(responses: Record<string, unknown>) {
  const fetchMock = vi.fn((url: string) => {
    const path = new URL(url).pathname;
    if (path === "/api/auth/logout") {
      return Promise.resolve(new Response(JSON.stringify({ status: "ok" }), { status: 200 }));
    }
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

const authUser = {
  id: "user-1",
  email: "student.demo@beyou.local",
  role: "student",
  status: "active",
  full_name: "Nguyễn An Demo",
  is_demo: true,
  privacy_acknowledgement_required: false,
  dashboard_route: "/student",
  notice_version: "2026-05-20",
};

describe("Phase 34 role shell", () => {
  beforeEach(() => {
    pathname = "/student";
    push.mockReset();
    vi.restoreAllMocks();
  });

  it("renders loading through the redesigned layout skeleton", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    const { container } = render(
      <AuthenticatedLayout>
        <p>Nội dung học sinh</p>
      </AuthenticatedLayout>,
    );

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("keeps wrong-role recovery copy and backend dashboard route", async () => {
    pathname = "/teacher";
    mockFetch({ "/api/auth/me": authUser });

    render(
      <AuthenticatedLayout>
        <p>Nội dung giáo viên</p>
      </AuthenticatedLayout>,
    );

    expect(await screen.findByText("Không thể mở cổng này với vai trò hiện tại.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đi tới cổng phù hợp" })).toHaveAttribute("href", "/student");
    expect(screen.queryByText("Nội dung giáo viên")).not.toBeInTheDocument();
  });

  it("blocks privacy-gated student children before redirect completes", async () => {
    pathname = "/student/self-checks";
    mockFetch({
      "/api/auth/me": {
        ...authUser,
        privacy_acknowledgement_required: true,
      },
    });

    render(
      <AuthenticatedLayout>
        <p>Nội dung học sinh cần chặn</p>
      </AuthenticatedLayout>,
    );

    await waitFor(() => expect(push).toHaveBeenCalledWith("/privacy?next=%2Fstudent%2Fself-checks"));
    expect(screen.getByText("Cần xác nhận quyền riêng tư trước khi vào cổng học sinh.")).toBeInTheDocument();
    expect(screen.queryByText("Nội dung học sinh cần chặn")).not.toBeInTheDocument();
  });

  it("preserves student navigation accessibility, active state, and SOS red tone", async () => {
    pathname = "/student/self-checks";
    mockFetch({ "/api/auth/me": authUser });

    render(
      <AuthenticatedLayout>
        <p>Nội dung học sinh</p>
      </AuthenticatedLayout>,
    );

    expect(await screen.findByText("Nguyễn An Demo")).toBeInTheDocument();
    expect(screen.getByText("Bỏ qua điều hướng")).toHaveAttribute("href", "#main-content");
    const nav = screen.getAllByRole("navigation", { name: "Điều hướng học sinh" })[0];
    expect(within(nav).getByRole("link", { name: "Test tâm lý" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link", { name: "SOS" })[0].className).toMatch(/red/);
  });

  it("keeps non-student role nav scoped to the active role and logout", async () => {
    pathname = "/teacher";
    mockFetch({
      "/api/auth/me": {
        ...authUser,
        role: "teacher",
        dashboard_route: "/teacher",
      },
    });

    render(
      <AuthenticatedLayout>
        <p>Nội dung giáo viên</p>
      </AuthenticatedLayout>,
    );

    await screen.findAllByRole("navigation", { name: "Điều hướng giáo viên" });
    const nav = screen.getAllByRole("navigation", { name: "Điều hướng giáo viên" })[0];
    expect(within(nav).getByRole("link", { name: "Bảng điều khiển" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).queryByRole("link", { name: "Test tâm lý" })).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button", { name: "Đăng xuất" })[0]);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });

  it("keeps auth ownership, privacy ordering, navigation strings, and no browser token writes", () => {
    const layoutSource = source("app/(authenticated)/layout.tsx");
    const navSources = [
      source("components/navigation/student-sidebar.tsx"),
      source("components/navigation/teacher-sidebar.tsx"),
      source("components/navigation/parent-sidebar.tsx"),
      source("components/navigation/admin-sidebar.tsx"),
    ].join("\n");

    expect(layoutSource).toContain("getCurrentUser()");
    expect(layoutSource).toContain('apiFetch("/api/auth/logout"');
    expect(layoutSource).toContain("privacy_acknowledgement_required");
    expect(layoutSource).toContain("router.push(`/privacy?next=");
    expect(layoutSource).toContain("Bỏ qua điều hướng");
    expect(navSources).toContain("aria-current");
    expect(layoutSource).not.toContain("localStorage.setItem");
    expect(layoutSource).not.toContain("sessionStorage.setItem");
    expect(layoutSource).not.toContain("access_token");
    expect(layoutSource).not.toContain("refresh_token");
    expect(layoutSource).not.toContain("id_token");
  });
});
