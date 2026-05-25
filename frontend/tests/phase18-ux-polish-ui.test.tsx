import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminLinksPage from "@/app/(authenticated)/admin/links/page";
import StudentDashboardPage from "@/app/(authenticated)/student/page";
import TeacherSosAlertPage from "@/app/(authenticated)/teacher/sos-alerts/[alertId]/page";
import TeacherSummaryPage from "@/app/(authenticated)/teacher/students/[studentId]/self-check-summaries/page";

const studentProfile = {
  id: "student-1",
  full_name: "Nguyễn An Demo",
  email: "student.demo@beyou.local",
  school: "Trường THPT BeYou Demo",
  class_name: "10A1",
  is_demo: true,
  linked_adults: [],
};

const sosAlert = {
  id: "alert-1",
  student: {
    id: "student-1",
    full_name: "Nguyễn An Demo",
    school: "Trường THPT BeYou Demo",
    class_name: "10A1",
  },
  severity: "support",
  source: "student_dashboard",
  note: null,
  current_status: "sent",
  created_at: "2026-05-22T00:00:00Z",
  updated_at: "2026-05-22T00:00:00Z",
  completed_at: null,
  status_events: [],
  is_demo: true,
};

const users = [
  {
    id: "student-1",
    email: "student.demo@beyou.local",
    role: "student",
    status: "active",
    full_name: "Nguyễn An Demo",
    school: "Trường THPT BeYou Demo",
    class_name: "10A1",
    is_demo: true,
    created_at: "2026-05-22T00:00:00Z",
    updated_at: "2026-05-22T00:00:00Z",
  },
  {
    id: "teacher-1",
    email: "teacher.demo@beyou.local",
    role: "teacher",
    status: "active",
    full_name: "Cô Bình Demo",
    school: null,
    class_name: null,
    is_demo: true,
    created_at: "2026-05-22T00:00:00Z",
    updated_at: "2026-05-22T00:00:00Z",
  },
];

const links = [
  {
    id: "link-1",
    student_id: "student-1",
    student_full_name: "Nguyễn An Demo",
    student_email: "student.demo@beyou.local",
    student_school: "Trường THPT BeYou Demo",
    student_class_name: "10A1",
    adult_id: "teacher-1",
    adult_full_name: "Cô Bình Demo",
    adult_email: "teacher.demo@beyou.local",
    adult_role: "teacher",
    relationship_type: "teacher",
    status: "active",
    created_at: "2026-05-22T00:00:00Z",
    updated_at: "2026-05-22T00:00:00Z",
    revoked_at: null,
    is_demo: true,
  },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(handler: (path: string, init?: RequestInit) => unknown) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const body = handler(path, init);
    return Promise.resolve(body instanceof Response ? body : jsonResponse(body, body === undefined ? 404 : 200));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Phase 18 supportive copy and critical interaction polish", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows SOS privacy copy and a clear outcome state after student confirmation", async () => {
    mockFetch((path, init) => {
      if (path === "/api/student/profile") {
        return studentProfile;
      }
      if (path === "/api/student/sos-alerts" && (init?.method ?? "GET") === "GET") {
        return [];
      }
      if (path === "/api/student/sos-alerts" && init?.method === "POST") {
        return sosAlert;
      }
      return undefined;
    });

    render(<StudentDashboardPage />);

    await screen.findByText("Gửi tín hiệu hỗ trợ");
    await userEvent.click(screen.getByRole("button", { name: "Gửi SOS hỗ trợ" }));
    expect(
      screen.getByText("Chỉ gửi phần ghi chú em nhập ở đây; câu trả lời tự kiểm tra, mood note và trò chuyện riêng tư không tự động được mở."),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Xác nhận gửi SOS" }));

    expect(await screen.findByText(/Đã gửi SOS hỗ trợ/)).toBeInTheDocument();
  });

  it("announces teacher SOS status updates without asking for extra private details", async () => {
    mockFetch((path, init) => {
      if (path === "/api/teacher/sos-alerts/alert-1") {
        return sosAlert;
      }
      if (path === "/api/teacher/sos-alerts/alert-1/status" && init?.method === "PATCH") {
        return { ...sosAlert, current_status: "received" };
      }
      return undefined;
    });

    render(<TeacherSosAlertPage params={{ alertId: "alert-1" }} />);

    expect(await screen.findByText("Cập nhật trạng thái SOS dành cho giáo viên")).toBeInTheDocument();
    expect(
      screen.getByText("Ghi chú này chỉ mô tả tiến trình hỗ trợ; không yêu cầu học sinh tiết lộ thêm nội dung riêng tư."),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Đánh dấu đã nhận" }));

    expect(await screen.findByText("Đã cập nhật trạng thái SOS thành Đã nhận.")).toBeInTheDocument();
  });

  it("shows admin revoke consequences and outcome state for support links", async () => {
    mockFetch((path, init) => {
      if (path === "/api/admin/users") {
        return users;
      }
      if (path === "/api/admin/links") {
        return links;
      }
      if (path === "/api/admin/links/link-1" && init?.method === "PATCH") {
        return { ...links[0], status: "revoked", revoked_at: "2026-05-22T00:00:00Z" };
      }
      return undefined;
    });

    render(<AdminLinksPage />);

    await screen.findByText("Liên kết học sinh và người lớn hỗ trợ");
    await userEvent.click(screen.getByRole("button", { name: "Thu hồi liên kết" }));
    expect(
      screen.getByText("Sau khi thu hồi, giáo viên/phụ huynh này không còn được xem tóm tắt hỗ trợ mới qua liên kết này."),
    ).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button", { name: "Thu hồi liên kết" }).at(-1)!);

    expect(
      await screen.findByText("Đã thu hồi liên kết. Người lớn này không còn thấy thông tin hỗ trợ mới của học sinh trong Peerlight AI."),
    ).toBeInTheDocument();
  });

  it("frames adult self-check summaries as support, not surveillance", async () => {
    mockFetch((path) => {
      if (path === "/api/teacher/students/student-1/self-check-summaries") {
        return {
          student: sosAlert.student,
          latest_summary: null,
          recent_summaries: [],
          is_demo: true,
        };
      }
      return undefined;
    });

    render(<TeacherSummaryPage params={{ studentId: "student-1" }} />);

    expect(await screen.findByText("Tóm tắt được phép xem")).toBeInTheDocument();
    expect(
      screen.getByText("Tóm tắt này dùng để mở lời hỗ trợ, không phải theo dõi hay xếp hạng học sinh."),
    ).toBeInTheDocument();
  });
});
