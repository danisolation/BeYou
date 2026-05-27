import { render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "@/app/(authenticated)/admin/page";

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

const unsafeAdminMarkers = [
  '/api/admin/users")',
  '/api/admin/links")',
  "${counts.users} tài khoản",
  "${counts.links} liên kết",
  "Export",
  "Xuất",
  "Download",
  "Tải xuống",
  "risk leaderboard",
  "xếp hạng nguy cơ",
  "drilldown",
  "Chi tiết học sinh",
  "raw audit",
  "reset",
];

describe("Phase 37 Admin dashboard loading", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders bounded Admin preview labels", async () => {
    mockFetch({
      "/api/admin/users": { body: [{ id: "u1" }, { id: "u2" }] },
      "/api/admin/links": { body: [{ id: "l1" }] },
    });

    render(<AdminDashboardPage />);

    expect(await screen.findByText("Preview 2 tài khoản demo")).toBeInTheDocument();
    expect(screen.getByText("Preview 1 liên kết được phân trang")).toBeInTheDocument();
  });

  it("uses bounded credentialed no-store preview reads", async () => {
    const fetchMock = mockFetch({
      "/api/admin/users": { body: [] },
      "/api/admin/links": { body: [] },
    });

    render(<AdminDashboardPage />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    for (const [url, init] of fetchMock.mock.calls) {
      expect(String(url)).toContain("limit=10");
      expect(init).toEqual(expect.objectContaining({ credentials: "include", cache: "no-store" }));
    }
  });

  it("keeps Admin metadata entries visible when preview reads fail", async () => {
    mockFetch({
      "/api/admin/users": { status: 500, body: { detail: "unavailable" } },
      "/api/admin/links": { status: 500, body: { detail: "unavailable" } },
    });

    render(<AdminDashboardPage />);

    expect(await screen.findByText("Cổng quản trị")).toBeInTheDocument();
    expect(screen.getAllByText("Vận hành metadata-only").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Preview metadata tạm thời chưa tải được.")).toHaveLength(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps Admin previews bounded and metadata-only in source", () => {
    const adminSource = source("app/(authenticated)/admin/page.tsx");
    const adminApiSource = source("lib/admin-api.ts");

    expect(adminSource).toContain("listUsers({ limit: 10 })");
    expect(adminSource).toContain("listLinks({ limit: 10 })");
    expect(adminApiSource).toContain("limit = options.limit ?? 10");
    expect(adminApiSource).toContain("/api/admin/users?limit=");
    expect(adminApiSource).toContain("/api/admin/links?limit=");
    expect(adminApiSource).toContain("dashboardRead<AdminUser");
    expect(adminApiSource).toContain("dashboardRead<AdminLink");
    for (const marker of unsafeAdminMarkers) {
      expect(`${adminSource}\n${adminApiSource}`).not.toContain(marker);
    }
  });
});
