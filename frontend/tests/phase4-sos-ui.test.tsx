import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ParentSosAlertPage from "@/app/(authenticated)/parent/sos-alerts/[alertId]/page";
import ParentDashboardPage from "@/app/(authenticated)/parent/page";
import StudentSosPage from "@/app/(authenticated)/student/sos/page";
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
    body: "Có tín hiệu hỗ trợ mới từ học sinh được liên kết trong Peerlight AI.",
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
      if (path === "/api/student/sos-alerts" && method === "POST") {
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

  it("shows the redesigned SOS page, sends an urgent alert, and displays the sent state", async () => {
    const fetchMock = mockFetch();

    render(<StudentSosPage />);

    expect(screen.getByText("Hỗ trợ khẩn cấp")).toBeInTheDocument();
    expect(screen.getByText("Nếu em đang gặp nguy hiểm hoặc cần giúp đỡ ngay lập tức, hãy nhấn nút bên dưới.")).toBeInTheDocument();
    expect(screen.queryByText("SOS đã được gửi")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Đúng, em cần giúp ngay" }));

    expect(await screen.findByText("SOS đã được gửi")).toBeInTheDocument();
    expect(screen.getByText("Người em tin đã được báo rồi. Họ sẽ liên hệ với em sớm nhất có thể.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/student/sos-alerts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          severity: "urgent",
          source: "student_dashboard",
          note: null,
        }),
      }),
    );
  });
});

describe("Phase 4 adult support portals", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders teacher quick-access cards and SOS link without raw answers", async () => {
    mockFetch();

    render(<TeacherDashboardPage />);

    expect(await screen.findByRole("heading", { name: "Học sinh đang đồng hành" })).toBeInTheDocument();
    expect(screen.getByText("1 học sinh đang được đồng hành")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem cảnh báo" })).toHaveAttribute("href", "/teacher/sos-alerts");
    expect(screen.queryByText(/RAW|choice_text_snapshot|answers/i)).not.toBeInTheDocument();
  });

  it("lets teacher move SOS to received from the alert detail page", async () => {
    const fetchMock = mockFetch();

    render(<TeacherSosAlertPage params={{ alertId: "alert-1" }} />);

    expect(await screen.findByText("Trạng thái SOS")).toBeInTheDocument();
    expect(screen.getByText("Điều học sinh muốn người lớn biết")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Ghi chú hỗ trợ (không bắt buộc)"), "Cô đã nhận tín hiệu.");
    await userEvent.click(screen.getByRole("button", { name: "Đánh dấu đã nhận" }));

    await waitFor(() => expect(screen.getByText("Đã cập nhật trạng thái SOS thành Đã nhận.")).toBeInTheDocument());
    expect(screen.getByText("Đã nhận")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/teacher/sos-alerts/alert-1/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "received", note: "Cô đã nhận tín hiệu." }),
      }),
    );
  });

  it("renders parent read-only SOS status from the dashboard entry", async () => {
    mockFetch();

    const { rerender } = render(<ParentDashboardPage />);
    expect(await screen.findByRole("link", { name: "Xem cảnh báo" })).toHaveAttribute("href", "/parent/sos-alerts");

    rerender(<ParentSosAlertPage params={{ alertId: "alert-1" }} />);
    expect(await screen.findByText("Trạng thái SOS")).toBeInTheDocument();
    expect(screen.getByText("Điều học sinh muốn người lớn biết")).toBeInTheDocument();
    expect(screen.getByText("Em đang cần người lớn biết em không ổn.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quay về trang chính" })).toHaveAttribute("href", "/parent");
    expect(screen.queryByRole("button", { name: /Đánh dấu đã nhận|Đang hỗ trợ|Hoàn tất hỗ trợ/ })).not.toBeInTheDocument();
  });
});
