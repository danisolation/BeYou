import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ParentSosAlertPage from "@/app/(authenticated)/parent/sos-alerts/[alertId]/page";
import ParentDashboardPage from "@/app/(authenticated)/parent/page";
import StudentDashboardPage from "@/app/(authenticated)/student/page";
import TeacherSosAlertPage from "@/app/(authenticated)/teacher/sos-alerts/[alertId]/page";
import TeacherDashboardPage from "@/app/(authenticated)/teacher/page";
import {
  createStudentSosAlert,
  getNotifications,
  getParentSupportOverview,
  getTeacherSosAlert,
  getTeacherSupportOverview,
  updateTeacherSosStatus,
} from "@/lib/sos-api";

const baseAlert = {
  id: "alert-1",
  student: {
    id: "student-1",
    full_name: "Nguyễn An Demo",
    school: "Trường THPT BeYou Demo",
    class_name: "10A1",
  },
  severity: "urgent",
  source: "student_dashboard",
  note: "Em đang cần người lớn biết em không ổn.",
  current_status: "sent",
  created_at: "2026-05-21T00:00:00Z",
  updated_at: "2026-05-21T00:00:00Z",
  completed_at: null,
  status_events: [],
  is_demo: true,
};

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
    student: baseAlert.student,
    warning_group: "nguy_co_cao",
    warning_group_label: "Nguy cơ cao",
    latest_self_check_summary: {
      completed_at: "2026-05-21T00:00:00Z",
      test_type: "Sức khỏe cảm xúc",
      state_label: "Can ho tro som",
      advice_summary: "Ưu tiên ở gần nơi an toàn.",
      support_suggestion: "Hỏi em cần hỗ trợ gì ngay lúc này.",
      is_demo: true,
    },
    latest_sos_alert: baseAlert,
    open_sos_count: 1,
    is_demo: true,
  },
];

const notifications = [
  {
    id: "notification-1",
    resource_type: "sos_alert",
    resource_id: "alert-1",
    title: "Tín hiệu SOS mới",
    body: "Có tín hiệu hỗ trợ mới từ học sinh được liên kết trong BeYou.",
    href: "/teacher/sos-alerts/alert-1",
    read_at: null,
    created_at: "2026-05-21T00:00:00Z",
    is_demo: true,
  },
];

function mockFetch(handler?: (path: string, init?: RequestInit) => unknown) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const method = init?.method ?? "GET";
    let body: unknown;
    if (handler) {
      body = handler(path, init);
    }
    if (body === undefined) {
      if (path === "/api/student/profile") {
        body = {
          id: "student-1",
          full_name: "Nguyễn An Demo",
          email: "student.demo@beyou.local",
          school: "Trường THPT BeYou Demo",
          class_name: "10A1",
          is_demo: true,
          linked_adults: [],
        };
      } else if (path === "/api/student/sos-alerts" && method === "GET") {
        body = [];
      } else if (path === "/api/student/sos-alerts" && method === "POST") {
        body = baseAlert;
      } else if (path === "/api/teacher/students") {
        body = [linkedStudent];
      } else if (path === "/api/parent/students") {
        body = [linkedStudent];
      } else if (path === "/api/teacher/support-overview" || path === "/api/parent/support-overview") {
        body = supportOverview;
      } else if (path === "/api/notifications") {
        body = notifications;
      } else if (path === "/api/teacher/sos-alerts/alert-1" || path === "/api/parent/sos-alerts/alert-1") {
        body = baseAlert;
      } else if (path === "/api/teacher/sos-alerts/alert-1/status" && method === "PATCH") {
        body = { ...baseAlert, current_status: "received" };
      }
    }
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

describe("Phase 4 SOS API helpers", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uses cookie-authenticated SOS, notification, and support overview endpoints without token storage", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchMock = mockFetch();

    await createStudentSosAlert({ severity: "urgent", source: "student_dashboard", note: "cần hỗ trợ" });
    await getTeacherSosAlert("alert-1");
    await updateTeacherSosStatus("alert-1", { status: "received", note: "đã nhận" });
    await getTeacherSupportOverview();
    await getParentSupportOverview();
    await getNotifications();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/student/sos-alerts",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/teacher/sos-alerts/alert-1/status",
      expect.objectContaining({ credentials: "include", method: "PATCH" }),
    );
    expect(localStorageSpy).not.toHaveBeenCalled();
  });
});

describe("Phase 4 student SOS UI", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows visible SOS card, requires confirmation, posts optional note, and displays status", async () => {
    const fetchMock = mockFetch();

    render(<StudentDashboardPage />);

    expect(await screen.findByText("Gửi tín hiệu để người lớn tin cậy biết em cần hỗ trợ.")).toBeInTheDocument();
    expect(screen.queryByText("Xác nhận gửi tín hiệu hỗ trợ")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Gửi SOS hỗ trợ" }));
    expect(screen.getByText("Xác nhận gửi tín hiệu hỗ trợ")).toBeInTheDocument();
    expect(
      screen.getByText("Em có muốn gửi tín hiệu hỗ trợ ngay bây giờ không? Người lớn tin cậy được liên kết với em sẽ nhận thông báo trong BeYou."),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "Em đang không an toàn ngay lúc này" }));
    await userEvent.type(screen.getByLabelText("Điều em muốn người lớn biết lúc này (không bắt buộc)"), "Em đang cần người lớn biết em không ổn.");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận gửi SOS" }));

    await waitFor(() => expect(screen.getByText("Đã gửi")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/student/sos-alerts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          severity: "urgent",
          source: "student_dashboard",
          note: "Em đang cần người lớn biết em không ổn.",
        }),
      }),
    );
  });
});

describe("Phase 4 adult support portals", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders teacher notifications, warning group, support summary, and SOS update link without raw answers", async () => {
    mockFetch();

    render(<TeacherDashboardPage />);

    expect(await screen.findByText("Thông báo hỗ trợ")).toBeInTheDocument();
    expect(screen.getByText("Tín hiệu SOS mới")).toBeInTheDocument();
    expect(screen.getByText("Nguy cơ cao")).toBeInTheDocument();
    expect(screen.getByText("Hỏi em cần hỗ trợ gì ngay lúc này.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem và cập nhật SOS" })).toHaveAttribute("href", "/teacher/sos-alerts/alert-1");
    expect(screen.queryByText(/RAW|choice_text_snapshot|answers/i)).not.toBeInTheDocument();
  });

  it("lets teacher move SOS to received with supportive copy", async () => {
    const fetchMock = mockFetch();

    render(<TeacherSosAlertPage params={{ alertId: "alert-1" }} />);

    expect(await screen.findByText("Cập nhật trạng thái SOS")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Ghi chú hỗ trợ (không bắt buộc)"), "Cô đã nhận tín hiệu.");
    await userEvent.click(screen.getByRole("button", { name: "Đánh dấu đã nhận" }));

    await waitFor(() => expect(screen.getByText("Đã nhận")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/teacher/sos-alerts/alert-1/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "received", note: "Cô đã nhận tín hiệu." }),
      }),
    );
  });

  it("renders parent read-only SOS status and permitted support summary", async () => {
    mockFetch();

    const { rerender } = render(<ParentDashboardPage />);
    expect(await screen.findByText("Trạng thái SOS của con")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem trạng thái SOS" })).toHaveAttribute("href", "/parent/sos-alerts/alert-1");

    rerender(<ParentSosAlertPage params={{ alertId: "alert-1" }} />);
    expect(await screen.findByText("Trạng thái SOS")).toBeInTheDocument();
    expect(screen.getByText("Bạn đang xem trạng thái hỗ trợ và tóm tắt được phép xem, không phải câu trả lời riêng tư của học sinh.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đánh dấu đã nhận" })).not.toBeInTheDocument();
  });
});
