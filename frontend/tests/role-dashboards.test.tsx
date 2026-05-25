import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "@/app/(authenticated)/admin/page";
import AuthenticatedLayout from "@/app/(authenticated)/layout";
import ParentDashboardPage from "@/app/(authenticated)/parent/page";
import StudentDashboardPage from "@/app/(authenticated)/student/page";
import TeacherDashboardPage from "@/app/(authenticated)/teacher/page";

const push = vi.fn();
let pathname = "/student";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

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

describe("role dashboards", () => {
  beforeEach(() => {
    pathname = "/student";
    push.mockReset();
    vi.restoreAllMocks();
  });

  it("shows loading copy, demo banner, and logout without storage token writes", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchMock = mockFetch({ "/api/auth/me": authUser });

    render(
      <AuthenticatedLayout>
        <p>Nội dung</p>
      </AuthenticatedLayout>,
    );

    expect(screen.getByText("Đang tải thông tin...")).toBeInTheDocument();
    expect(await screen.findByText("Đang xem dữ liệu demo - không phải hồ sơ học sinh thật.")).toBeInTheDocument();
    const nav = screen.getAllByRole("navigation", { name: "Điều hướng học sinh" })[0];
    expect(within(nav).getByRole("link", { name: "Bảng điều khiển" })).toHaveAttribute("href", "/student");
    expect(within(nav).queryByRole("link", { name: "Giáo viên" })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Phụ huynh" })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Quản trị" })).not.toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Đăng xuất" })[0]);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/auth/logout",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(localStorageSpy).not.toHaveBeenCalled();
  });

  it("shows supportive wrong-role copy and backend correct-dashboard link", async () => {
    pathname = "/teacher";
    mockFetch({ "/api/auth/me": authUser });

    render(
      <AuthenticatedLayout>
        <p>Nội dung giáo viên</p>
      </AuthenticatedLayout>,
    );

    expect(await screen.findByText("Không thể mở cổng này với vai trò hiện tại.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Peerlight AI chỉ hiển thị dữ liệu trong phạm vi vai trò và liên kết được phân quyền. Hãy quay về đúng cổng của bạn để tiếp tục hỗ trợ an toàn.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đi tới cổng phù hợp" })).toHaveAttribute("href", "/student");
  });

  it("redirects unacknowledged students to privacy before rendering student content", async () => {
    pathname = "/student/self-checks";
    mockFetch({
      "/api/auth/me": {
        ...authUser,
        privacy_acknowledgement_required: true,
      },
    });

    render(
      <AuthenticatedLayout>
        <p>Nội dung học sinh nhạy cảm</p>
      </AuthenticatedLayout>,
    );

    await waitFor(() => expect(push).toHaveBeenCalledWith("/privacy?next=%2Fstudent%2Fself-checks"));
    expect(screen.getByText("Cần xác nhận quyền riêng tư trước khi vào cổng học sinh.")).toBeInTheDocument();
    expect(screen.queryByText("Nội dung học sinh nhạy cảm")).not.toBeInTheDocument();
  });

  it("renders student profile school, class, support adults, Demo badge, and privacy link", async () => {
    mockFetch({
      "/api/student/profile": {
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
      },
    });

    render(<StudentDashboardPage />);

    expect(await screen.findByText("Xin chào, Nguyễn")).toBeInTheDocument();
    expect(screen.getByText(/Trường THPT BeYou Demo/)).toBeInTheDocument();
    expect(screen.getByText(/10A1/)).toBeInTheDocument();
    expect(screen.getByText("Cô Bình Demo")).toBeInTheDocument();
    expect(screen.getByText("Phụ huynh Chi Demo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ai có thể xem thông tin của em?" })).toBeInTheDocument();
  });

  it("renders teacher and parent linked-student dashboard copy", async () => {
    const students = [
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
    mockFetch({ "/api/teacher/students": students, "/api/parent/students": students });

    render(
      <>
        <TeacherDashboardPage />
        <ParentDashboardPage />
      </>,
    );

    expect(await screen.findByText("Cổng giáo viên")).toBeInTheDocument();
    expect(screen.getByText("Cổng phụ huynh")).toBeInTheDocument();
    expect(screen.getByText("Ranh giới hỗ trợ của giáo viên")).toBeInTheDocument();
    expect(screen.getByText("Ranh giới hỗ trợ của phụ huynh")).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Peerlight AI không hiển thị câu trả lời test tâm lý chi tiết hoặc nội dung trò chuyện riêng tư tại cổng người lớn.",
      ),
    ).toHaveLength(2);
    expect(screen.getAllByText("Nguyễn An Demo")).toHaveLength(2);
  });

  it("renders admin safe entry cards and counts", async () => {
    mockFetch({
      "/api/admin/users": [{ id: "u1" }, { id: "u2" }],
      "/api/admin/links": [{ id: "l1" }],
    });

    render(<AdminDashboardPage />);

    expect(await screen.findByText("Cổng quản trị")).toBeInTheDocument();
    expect(screen.getByText("Quản lý tài khoản")).toBeInTheDocument();
    expect(screen.getByText("Liên kết học sinh và người lớn hỗ trợ")).toBeInTheDocument();
    expect(screen.getByText("2 tài khoản")).toBeInTheDocument();
    expect(screen.getByText("1 liên kết")).toBeInTheDocument();
  });
});
