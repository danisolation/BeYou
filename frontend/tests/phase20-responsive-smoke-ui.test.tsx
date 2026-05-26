import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "@/app/(authenticated)/admin/page";
import ParentDashboardPage from "@/app/(authenticated)/parent/page";
import StudentDashboardPage from "@/app/(authenticated)/student/page";
import TeacherDashboardPage from "@/app/(authenticated)/teacher/page";
import HomePage from "@/app/page";
import LoginPage from "@/app/login/page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const viewports = [
  { label: "mobile", width: 375, height: 812 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "desktop", width: 1280, height: 800 },
];

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

const studentProfile = {
  id: "student-1",
  full_name: "Nguyễn An Demo",
  email: "student.demo@beyou.local",
  school: "Trường THPT BeYou Demo",
  class_name: "10A1",
  is_demo: true,
  linked_adults: [
    {
      id: "teacher-1",
      full_name: "Cô Bình Demo",
      email: "teacher.demo@beyou.local",
      relationship_type: "teacher",
      link_status: "active",
      is_demo: true,
    },
  ],
};

const demoCapabilities = {
  demo_login_enabled: true,
  public_demo_entry_enabled: true,
  email_password_enabled: true,
  provider_login_enabled: false,
  provider_label: null,
  provider_mode: null,
  production_pilot: false,
};

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
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

describe("Phase 20 responsive and demo-readiness smoke", () => {
  beforeEach(() => {
    push.mockReset();
    vi.restoreAllMocks();
    cleanup();
  });

  it.each(viewports)("keeps public role entry accessible at $label width", async ({ width, height }) => {
    setViewport(width, height);

    render(<HomePage />);

    expect(screen.getAllByRole("link", { name: "Bắt đầu" })[0]).toHaveAttribute("href", "/login");
    expect(screen.getByText("Vào demo trong một bước")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vào vai Học sinh/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Vào vai Giáo viên/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Vào vai Phụ huynh/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Vào vai Quản trị/ })).toBeEnabled();

    cleanup();
    mockFetch({ "/api/auth/capabilities": demoCapabilities });
    render(<LoginPage />);

    expect(screen.getByText("Chào mừng đến với Peerlight AI")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Học sinh" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Giáo viên" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Phụ huynh" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Quản trị" })).toBeEnabled();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Mật khẩu")).toBeRequired();
  });

  it.each(viewports)("renders critical role dashboards at $label width", async ({ width, height }) => {
    setViewport(width, height);
    mockFetch({
      "/api/student/profile": studentProfile,
      "/api/student/sos-alerts": [],
      "/api/teacher/students": [linkedStudent],
      "/api/parent/students": [{ ...linkedStudent, relationship_type: "parent" }],
      "/api/admin/users": [{ id: "admin-1" }],
      "/api/admin/links": [{ id: "link-1" }],
    });

    render(<StudentDashboardPage />);
    expect(await screen.findByText("Xin chào, Nguyễn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ai có thể xem thông tin của em?" })).toHaveAttribute(
      "href",
      "/privacy?review=true",
    );

    cleanup();
    render(<TeacherDashboardPage />);
    expect(await screen.findByText("Cổng giáo viên")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem tóm tắt hỗ trợ" })).toHaveAttribute(
      "href",
      "/teacher/students/student-1/self-check-summaries",
    );

    cleanup();
    render(<ParentDashboardPage />);
    expect(await screen.findByText("Cổng phụ huynh")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem tóm tắt hỗ trợ" })).toHaveAttribute(
      "href",
      "/parent/students/student-1/self-check-summaries",
    );

    cleanup();
    render(<AdminDashboardPage />);
    expect(await screen.findByText("Cổng quản trị")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Vận hành metadata-only/ })).toHaveAttribute("href", "/admin/operations");
    expect(screen.getByText("1 tài khoản")).toBeInTheDocument();
    expect(screen.getByText("1 liên kết")).toBeInTheDocument();
  });
});
