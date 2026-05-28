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
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
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

    const { container } = render(<StudentDashboardPage />);

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("keeps the redesigned dashboard visible even when old reminder/SOS endpoints fail", async () => {
    mockFetch({
      "/api/student/profile": { body: studentProfile },
      "/api/student/sos-alerts": { status: 500, body: { detail: "unavailable" } },
      "/api/student/reminders/mood-check-in": { status: 500, body: { detail: "unavailable" } },
    });

    render(<StudentDashboardPage />);

    expect(await screen.findByText("Chào Nguyễn An Demo! 👋")).toBeInTheDocument();
    expect(screen.getByText("Tình huống xử lý")).toBeInTheDocument();
    expect(screen.queryByText(/Tiến trình SOS tạm thời chưa tải được/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nhắc nhở check-in tạm thời chưa tải được/)).not.toBeInTheDocument();
  });

  it("keeps the Student profile read as the primary error gate", async () => {
    mockFetch({
      "/api/student/profile": { status: 500, body: { detail: "unavailable" } },
      "/api/student/sos-alerts": { body: [] },
      "/api/student/reminders/mood-check-in": { body: null },
    });

    render(<StudentDashboardPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
  });

  it("uses credentialed profile reads for the redesigned Student dashboard", async () => {
    const fetchMock = mockFetch({
      "/api/student/profile": { body: studentProfile },
    });

    render(<StudentDashboardPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const call = fetchMock.mock.calls.find(([url]) => new URL(String(url)).pathname === "/api/student/profile");
    expect(call?.[1]).toEqual(expect.objectContaining({ credentials: "include" }));
  });

  it("does not add browser storage or browser token handling", () => {
    for (const file of ["app/(authenticated)/student/page.tsx", "lib/api.ts"]) {
      const fileSource = source(file);
      for (const marker of redlineMarkers) {
        expect(fileSource).not.toContain(marker);
      }
    }
  });
});
