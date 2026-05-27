import { render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentDashboardPage from "@/app/(authenticated)/student/page";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

type MockResponse = {
  status?: number;
  body?: unknown;
};

function mockFetch(responses: Record<string, MockResponse>) {
  const fetchMock = vi.fn((url: string) => {
    const path = new URL(url).pathname;
    const response = responses[path] ?? { status: 404, body: { detail: "missing" } };
    return Promise.resolve(
      new Response(JSON.stringify(response.body ?? []), {
        status: response.status ?? 200,
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

const redlineMarkers = [
  "localStorage.setItem",
  "sessionStorage.setItem",
  "indexedDB",
  "serviceWorker",
  "access_token",
  "refresh_token",
  "id_token",
];

describe("Phase 37 Student dashboard loading", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a non-sensitive Student dashboard skeleton while loading", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    render(<StudentDashboardPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Đang tải thông tin học sinh...");
  });

  it("renders scoped unavailable copy for SOS and reminder failures", async () => {
    mockFetch({
      "/api/student/profile": { body: studentProfile },
      "/api/student/sos-alerts": { status: 500, body: { detail: "unavailable" } },
      "/api/student/reminders/mood-check-in": { status: 500, body: { detail: "unavailable" } },
    });

    render(<StudentDashboardPage />);

    expect(await screen.findByText(/Tiến trình SOS tạm thời chưa tải được/)).toBeInTheDocument();
    expect(screen.getByText(/Nhắc nhở check-in tạm thời chưa tải được/)).toBeInTheDocument();
  });

  it("keeps the Student profile read as the primary error gate", async () => {
    mockFetch({
      "/api/student/profile": { status: 500, body: { detail: "unavailable" } },
      "/api/student/sos-alerts": { body: [] },
      "/api/student/reminders/mood-check-in": { body: null },
    });

    render(<StudentDashboardPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể tải thông tin");
  });

  it("uses credentialed no-store options for Student dashboard reads", async () => {
    const fetchMock = mockFetch({
      "/api/student/profile": { body: studentProfile },
      "/api/student/sos-alerts": { body: [] },
      "/api/student/reminders/mood-check-in": { body: null },
    });

    render(<StudentDashboardPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    for (const path of ["/api/student/profile", "/api/student/sos-alerts", "/api/student/reminders/mood-check-in"]) {
      const call = fetchMock.mock.calls.find(([url]) => new URL(String(url)).pathname === path);
      expect(call?.[1]).toEqual(expect.objectContaining({ credentials: "include", cache: "no-store" }));
    }
  });

  it("does not add browser storage or browser token handling", () => {
    for (const file of ["app/(authenticated)/student/page.tsx", "lib/student-dashboard-loader.ts"]) {
      const fileSource = source(file);
      for (const marker of redlineMarkers) {
        expect(fileSource).not.toContain(marker);
      }
    }
  });
});
