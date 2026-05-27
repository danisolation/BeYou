import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dashboardRead, optionalDashboardRead } from "@/lib/dashboard-loading";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const redlineMarkers = [
  "localStorage.setItem",
  "sessionStorage.setItem",
  "indexedDB",
  "serviceWorker",
  "access_token",
  "refresh_token",
  "id_token",
  "QueryClientProvider",
  "new QueryClient",
];

describe("Phase 37 dashboard loading", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps dashboard reads credentialed and no-store", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await dashboardRead<unknown>("/api/teacher/students");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("enforces no-store even when callers request cached dashboard reads", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await dashboardRead<unknown>("/api/teacher/students", {
      cache: "force-cache",
      headers: { "X-Dashboard-Test": "phase37" },
    });

    const fetchInit = fetchMock.mock.calls[0]?.[1];
    expect(fetchInit).toEqual(
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
    expect(fetchInit?.headers).toBeInstanceOf(Headers);
    expect((fetchInit?.headers as Headers).get("X-Dashboard-Test")).toBe("phase37");
  });

  it("returns scoped unavailable results for optional dashboard reads", async () => {
    await expect(
      optionalDashboardRead(() => Promise.reject(new Error("boom")), "Mục này tạm thời chưa tải được."),
    ).resolves.toEqual({
      status: "unavailable",
      message: "Mục này tạm thời chưa tải được.",
    });
  });

  it("does not introduce browser storage, browser tokens, or broad server-state providers", () => {
    for (const file of [
      "lib/dashboard-loading.ts",
      "lib/api.ts",
      "lib/sos-api.ts",
      "lib/notification-preferences-api.ts",
      "lib/admin-api.ts",
      "app/(authenticated)/layout.tsx",
    ]) {
      const fileSource = source(file);
      for (const marker of redlineMarkers) {
        expect(fileSource).not.toContain(marker);
      }
    }
  });
});
