import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentNotificationPreferencesPage from "@/app/(authenticated)/student/notification-preferences/page";
import StudentDashboardPage from "@/app/(authenticated)/student/page";

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
  body: "Nếu em muốn, hãy dành một phút lắng nghe bản thân. Nhắc nhở này chỉ hiện trong BeYou, không gửi cho người lớn và không tự tạo SOS.",
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

describe("Phase 22 notification preferences UI", () => {
  beforeEach(() => vi.restoreAllMocks());

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

    render(<StudentNotificationPreferencesPage />);

    expect(await screen.findByText("Nhắc nhở check-in")).toBeInTheDocument();
    expect(screen.getByText("SMS")).toBeInTheDocument();
    expect(screen.getAllByText(/Đang hoãn/).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByLabelText(/Bật nhắc nhở check-in/));
    await userEvent.selectOptions(screen.getByLabelText("Tần suất"), "daily");
    await userEvent.clear(screen.getByLabelText("Yên lặng từ"));
    await userEvent.type(screen.getByLabelText("Yên lặng từ"), "22:00");
    await userEvent.clear(screen.getByLabelText("Đến"));
    await userEvent.type(screen.getByLabelText("Đến"), "06:00");
    await userEvent.click(screen.getByRole("button", { name: "Lưu cài đặt" }));

    expect(await screen.findByText("Đã lưu cài đặt nhắc nhở của em.")).toBeInTheDocument();
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

  it("shows a non-clinical dashboard reminder that can be dismissed without SOS", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      if (path === "/api/student/profile") {
        return jsonResponse(studentProfile);
      }
      if (path === "/api/student/sos-alerts") {
        return jsonResponse([]);
      }
      if (path === "/api/student/reminders/mood-check-in" && init?.method !== "POST") {
        return jsonResponse(dueReminder);
      }
      if (path === "/api/student/reminders/mood-check-in/dismiss") {
        return jsonResponse({ status: "dismissed", reminder: { ...dueReminder, due: false } });
      }
      return jsonResponse({ detail: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<StudentDashboardPage />);

    expect(await screen.findByText("Nhắc nhẹ: em muốn check-in cảm xúc không?")).toBeInTheDocument();
    expect(screen.getAllByText(/không tự tạo SOS/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Cài đặt nhắc nhở" })[0]).toHaveAttribute(
      "href",
      "/student/notification-preferences",
    );

    await userEvent.click(screen.getByRole("button", { name: "Bỏ qua hôm nay" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            new URL(String(url)).pathname === "/api/student/reminders/mood-check-in/dismiss" &&
            init?.method === "POST",
        ),
      ).toBe(true);
    });
    expect(
      fetchMock.mock.calls.some(([url, init]) => {
        return new URL(String(url)).pathname === "/api/student/sos-alerts" && init?.method === "POST";
      }),
    ).toBe(false);
  });
});
