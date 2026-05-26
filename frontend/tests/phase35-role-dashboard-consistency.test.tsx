import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  linked_adults: [
    {
      id: "teacher-1",
      full_name: "Cô Bình Demo",
      email: "teacher.demo@beyou.local",
      relationship_type: "teacher",
      link_status: "active",
      is_demo: true,
    },
    {
      id: "parent-1",
      full_name: "Phụ huynh Chi Demo",
      email: "parent.demo@beyou.local",
      relationship_type: "parent",
      link_status: "active",
      is_demo: true,
    },
  ],
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

describe("Phase 35 role dashboard consistency regression", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Student privacy and SOS confirmation redlines", async () => {
    mockFetch({
      "/api/student/profile": studentProfile,
      "/api/student/sos-alerts": [
        {
          id: "student-sos-1",
          student: { id: "student-1", full_name: "Nguyễn An Demo", school: "Trường THPT BeYou Demo", class_name: "10A1" },
          severity: "urgent",
          source: "student_dashboard",
          note: null,
          current_status: "sent",
          created_at: "2026-05-26T10:00:00Z",
          updated_at: "2026-05-26T10:00:00Z",
          completed_at: null,
          status_events: [],
          is_demo: true,
        },
      ],
      "/api/notifications/mood-check-in/reminder": null,
    });

    render(<StudentDashboardPage />);

    expect(await screen.findByText("Vai trò học sinh")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Xin chào, Nguyễn" })).toBeInTheDocument();
    expect(screen.getByText("Thông tin của em là riêng tư theo mặc định")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Người lớn chỉ thấy thông tin trong phạm vi em cho phép hoặc khi có SOS cần hỗ trợ; câu trả lời tự kiểm tra, mood note và trò chuyện riêng tư không tự động được mở.",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Ai có thể xem thông tin của em?" })).toBeInTheDocument();
    expect(screen.getByText("Em đang không an toàn ngay lúc này").className).toMatch(/bg-red-600/);
    const sosButton = screen.getByRole("button", { name: "Gửi SOS hỗ trợ" });
    expect(sosButton.className).toMatch(/bg-red-600/);

    await userEvent.click(sosButton);

    expect(screen.getByText("Xác nhận gửi tín hiệu hỗ trợ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận gửi SOS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ở lại trang này" })).toBeInTheDocument();
  });

  it("renders Teacher SOS handling posture without raw private-content labels", async () => {
    mockFetch({
      "/api/teacher/students": linkedStudents,
      "/api/teacher/support-overview": teacherSupportOverview,
      "/api/notifications": [],
    });

    render(<TeacherDashboardPage />);

    expect(await screen.findByText("Vai trò giáo viên")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Giáo viên chỉ xem học sinh được liên kết và thông tin SOS/tóm tắt được phép xem để phối hợp hỗ trợ, không giám sát.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem và cập nhật SOS" })).toHaveAttribute("href", "/teacher/sos-alerts/sos-1");
    expect(document.body.textContent ?? "").not.toMatch(rawAdultAdminLabelRegex);
  });

  it("renders Parent read-only SOS posture without Teacher update wording as parent copy", async () => {
    mockFetch({
      "/api/parent/students": linkedStudents,
      "/api/parent/support-overview": parentSupportOverview,
      "/api/notifications": [],
    });

    render(<ParentDashboardPage />);

    expect(await screen.findByText("Vai trò phụ huynh")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Phụ huynh chỉ xem thông tin hỗ trợ và trạng thái SOS được phép xem; vai trò này là đồng hành/read-only, không cập nhật trạng thái thay học sinh hoặc giáo viên.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem trạng thái SOS" })).toHaveAttribute("href", "/parent/sos-alerts/sos-1");
    expect(screen.queryByRole("link", { name: "Xem và cập nhật SOS" })).not.toBeInTheDocument();
  });

  it("renders Admin metadata-only dashboard and rejects unsafe controls", async () => {
    mockFetch({
      "/api/admin/users": [{ id: "u1" }, { id: "u2" }],
      "/api/admin/links": [{ id: "l1" }],
    });

    render(<AdminDashboardPage />);

    expect(await screen.findByText("Vai trò quản trị")).toBeInTheDocument();
    expect(screen.getByText("Vận hành metadata-only")).toBeInTheDocument();
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
      source("components/adult-student-list.tsx"),
    ].join("\n");

    expect(dashboardSources).toContain("/api/student/profile");
    expect(dashboardSources).toContain("/api/teacher/students");
    expect(dashboardSources).toContain("/api/parent/students");
    expect(dashboardSources).toContain("/api/admin/users");
    expect(dashboardSources).toContain("/api/admin/links");

    const adultListSource = source("components/adult-student-list.tsx");
    expect(adultListSource).toContain("space-y-6");
    expect(adultListSource).toContain("PrivacyBoundaryCard");
    expect(adultListSource).toContain("Chưa có học sinh được liên kết");

    for (const forbidden of ["localStorage.setItem", "sessionStorage.setItem", "access_token", "refresh_token", "id_token"]) {
      expect(dashboardSources).not.toContain(forbidden);
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
      expect(sharedSource, path).not.toMatch(/localStorage.setItem|sessionStorage.setItem|access_token|refresh_token|id_token/);
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

  it("preserves accessible loading and error primitives for Phase 35 dashboards", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    render(<StudentDashboardPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải thông tin...");

    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const path = new URL(url).pathname;
        return Promise.resolve(
          new Response(JSON.stringify(path.includes("sos") || path.includes("notifications") ? [] : { detail: "unavailable" }), {
            status: path.includes("sos") || path.includes("notifications") ? 200 : 500,
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
    expect(alerts).toHaveLength(3);
    for (const alert of alerts) {
      expect(within(alert).getByText("Không thể tải thông tin")).toBeInTheDocument();
    }
  });
});
