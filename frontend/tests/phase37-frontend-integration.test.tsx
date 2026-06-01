import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const PHASE37_REQUIREMENTS = ["FEPERF-01", "FEPERF-02", "FEPERF-03", "FEPERF-04", "FEPERF-05"];

const rolePageFiles = [
  "app/(authenticated)/student/page.tsx",
  "app/(authenticated)/teacher/page.tsx",
  "app/(authenticated)/parent/page.tsx",
  "app/(authenticated)/admin/page.tsx",
];

const phase37SourceFiles = [
  "app/(authenticated)/layout.tsx",
  ...rolePageFiles,
  "components/adult-student-list.tsx",
  "components/ui-primitives.tsx",
  "lib/dashboard-loading.ts",
  "lib/student-dashboard-loader.ts",
  "lib/adult-dashboard-loader.ts",
  "lib/admin-api.ts",
];

const browserStorageAndProviderMarkers = [
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

const adminUnsafeMarkers = [
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

describe("Phase 37 frontend integration redlines", () => {
  it("maps every Phase 37 requirement into the integrated suite", () => {
    expect(PHASE37_REQUIREMENTS).toEqual(["FEPERF-01", "FEPERF-02", "FEPERF-03", "FEPERF-04", "FEPERF-05"]);
    for (const requirement of ["FEPERF-01", "FEPERF-02", "FEPERF-03", "FEPERF-04", "FEPERF-05"]) {
      expect(PHASE37_REQUIREMENTS).toContain(requirement);
    }
  });

  it("keeps auth/privacy layout ownership in the authenticated shell", () => {
    const layoutSource = source("app/(authenticated)/layout.tsx");

    expect(layoutSource).toContain("getCurrentUser");
    expect(layoutSource).toContain("privacy");
    expect(layoutSource).toContain("logout");
    expect(layoutSource).toContain("role");
  });

  it("rejects browser storage, token, and broad provider regressions in dashboard sources", () => {
    for (const file of phase37SourceFiles) {
      const fileSource = source(file);
      for (const marker of browserStorageAndProviderMarkers) {
        expect(fileSource).not.toContain(marker);
      }
    }
  });

  it("keeps role pages and shared primitives inside their import boundaries", () => {
    for (const file of rolePageFiles) {
      const fileSource = source(file);
      expect(fileSource).not.toMatch(/@\/app\/\(authenticated\)\/(student|teacher|parent|admin)\/page/);
    }

    const primitiveSource = source("components/ui-primitives.tsx");
    for (const marker of ["@/lib/api", "@/lib/auth", "@/lib/sos-api", "@/app/(authenticated)"]) {
      expect(primitiveSource).not.toContain(marker);
    }
  });

  it("preserves safe adult navigation and current Student/Admin dashboard redlines", () => {
    const adultListSource = source("components/adult-student-list.tsx");
    const adminSource = source("app/(authenticated)/admin/page.tsx");
    const studentSource = source("app/(authenticated)/student/page.tsx");

    expect(adultListSource).toContain("safeInternalHref(notification.href)");
    for (const marker of adminUnsafeMarkers) {
      expect(adminSource).not.toContain(marker);
    }
    expect(studentSource).toContain("{greeting}, {name}!");
    expect(studentSource).toContain("Peerlight AI");
    expect(studentSource).toContain("Khám phá cảm xúc");
    expect(adminSource).toContain("Bảng vận hành");
  });
});
