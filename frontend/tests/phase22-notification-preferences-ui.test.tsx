import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentNotificationPreferencesPage from "@/app/(authenticated)/student/notification-preferences/page";
import StudentDashboardPage from "@/app/(authenticated)/student/page";
import { ThemeProvider } from "@/components/theme-provider";

const preferenceResponse = {
  id: "pref-1",
  student_id: "student-1",
  in_app_reminders_enabled: false,
  mood_checkin_reminders_enabled: false,
  reminder_cadence: "weekly",
  allowed_channels: ["in_app"],
  consent_version: null,
  consented_at: null,
  quiet_hours_start: "21:30",
  quiet_hours_end: "06:30",
  timezone: "Asia/Ho_Chi_Minh",
  paused_until: null,
  pause_reason_code: null,
  updated_at: "2026-05-22T00:00:00Z",
  is_demo: true,
  channel_boundaries: [
    { key: "in_app", label: "Trong ứng dụng", enabled: true, available: true, status: "active" },
    { key: "sms", label: "SMS", enabled: false, available: false, status: "deferred" },
    { key: "zalo", label: "Zalo", enabled: false, available: false, status: "deferred" },
  ],
};

const dueReminder = {
  due: true,
  status_reason: "due",
  title: "Nhắc nhẹ: em muốn check-in cảm xúc không?",
  body: "Nếu em muốn, hãy dành một phút lắng nghe bản thân. Nhắc nhở này chỉ hiện trong Peerlight AI, không gửi cho người lớn và không tự tạo SOS.",
  href: "/student/mood-check-ins",
  generated_at: "2026-05-22T00:00:00Z",
  last_checkin_at: null,
  next_due_at: null,
  snoozed_until: null,
  preference: preferenceResponse,
};

const studentProfile = {
  id: "student-1",
  full_name: "Nguyễn An Demo",
  email: "student.demo@beyou.local",
  school: "Trường THPT BeYou Demo",
  class_name: "10A1",
  is_demo: true,
  linked_adults: [],
};

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function installMatchMediaMock() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("Phase 22 notification preferences UI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    installMatchMediaMock();
  });

  it("lets students enable in-app reminders with quiet hours and deferred external channels", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      if (path === "/api/student/notification-preferences" && init?.method === "PUT") {
        return jsonResponse({
          ...preferenceResponse,
          in_app_reminders_enabled: true,
          mood_checkin_reminders_enabled: true,
          reminder_cadence: "daily",
          quiet_hours_start: "22:00",
          quiet_hours_end: "06:00",
        });
      }
      if (path === "/api/student/notification-preferences") {
        return jsonResponse(preferenceResponse);
      }
      return jsonResponse({ detail: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ThemeProvider>
        <StudentNotificationPreferencesPage />
      </ThemeProvider>,
    );

    expect(await screen.findByText("Thông báo & Nhắc nhở")).toBeInTheDocument();
    expect(screen.getByText("Tạm dừng nhắc nhở")).toBeInTheDocument();
    expect(screen.getByText(/Việc bỏ qua nhắc nhở không bị xem là tín hiệu nguy cơ/)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/Bật nhắc nhở check-in trong Peerlight AI/));
    await userEvent.selectOptions(screen.getByLabelText("Tần suất"), "daily");
    await userEvent.clear(screen.getByLabelText("Yên lặng từ"));
    await userEvent.type(screen.getByLabelText("Yên lặng từ"), "22:00");
    await userEvent.clear(screen.getByLabelText("Đến"));
    await userEvent.type(screen.getByLabelText("Đến"), "06:00");
    await userEvent.click(screen.getByRole("button", { name: "Lưu cài đặt nhắc nhở" }));

    expect(await screen.findByText("Đã lưu cài đặt nhắc nhở.")).toBeInTheDocument();
    const putCall = fetchMock.mock.calls.find(([url, init]) => {
      return new URL(String(url)).pathname === "/api/student/notification-preferences" && init?.method === "PUT";
    });
    expect(JSON.parse(String(putCall?.[1]?.body))).toEqual(
      expect.objectContaining({
        in_app_reminders_enabled: true,
        mood_checkin_reminders_enabled: true,
        reminder_cadence: "daily",
        allowed_channels: ["in_app"],
        quiet_hours_start: "22:00",
        quiet_hours_end: "06:00",
      }),
    );
  });

  it("shows the redesigned dashboard settings shortcut instead of the old inline reminder banner", async () => {
    const fetchMock = vi.fn((url: string) => {
      const path = new URL(url).pathname;
      if (path === "/api/student/profile") {
        return jsonResponse(studentProfile);
      }
      if (path === "/api/student/reminders/mood-check-in") {
        return jsonResponse(dueReminder);
      }
      if (path === "/api/student/sos-alerts") {
        return jsonResponse([]);
      }
      return jsonResponse({ detail: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<StudentDashboardPage />);

    expect(await screen.findByText("Chào Nguyễn An Demo! 👋")).toBeInTheDocument();
    expect(screen.queryByText("Nhắc nhẹ: em muốn check-in cảm xúc không?")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vào thiết lập" })).toHaveAttribute(
      "href",
      "/student/notification-preferences",
    );
    expect(
      fetchMock.mock.calls.some(([url]) => new URL(String(url)).pathname === "/api/student/reminders/mood-check-in"),
    ).toBe(false);
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) => new URL(String(url)).pathname === "/api/student/sos-alerts" && init?.method === "POST",
      ),
    ).toBe(false);
  });
});
