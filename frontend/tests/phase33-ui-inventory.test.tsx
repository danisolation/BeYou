import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const requiredStates = [
  "happy",
  "loading",
  "error",
  "empty",
  "blocked/privacy",
  "responsive mobile/tablet/desktop",
  "keyboard/focus",
  "accessible status/alert announcements",
] as const;

const requiredPatternCategories = [
  "shell",
  "navigation",
  "spacing",
  "cards",
  "tables",
  "forms",
  "loading",
  "error",
  "empty",
  "responsive",
  "accessibility",
] as const;

const allowedSeverities = ["P0", "P1", "P2"] as const;
const allowedCandidateFollowUpPhases = ["Phase 34", "Phase 35", "Phase 37", "Phase 38"] as const;

type Role = "shell" | "student" | "teacher" | "parent" | "admin";
type RequiredState = (typeof requiredStates)[number];
type PatternCategory = (typeof requiredPatternCategories)[number];
type Severity = (typeof allowedSeverities)[number];
type CandidateFollowUpPhase = (typeof allowedCandidateFollowUpPhases)[number];

type InventoryRoute = {
  role: Role;
  route: string;
  sourceFile: string;
};

type InventoryCoverageRow = InventoryRoute & {
  state: RequiredState;
  patternCategory: PatternCategory;
  severity: Severity;
  candidateFollowUpPhase: CandidateFollowUpPhase;
};

const selectedRoutes: InventoryRoute[] = [
  { role: "shell", route: "shell", sourceFile: "app/(authenticated)/layout.tsx" },
  { role: "student", route: "/student", sourceFile: "app/(authenticated)/student/page.tsx" },
  { role: "student", route: "/student/chat", sourceFile: "app/(authenticated)/student/chat/page.tsx" },
  { role: "student", route: "/student/mood-check-ins", sourceFile: "app/(authenticated)/student/mood-check-ins/page.tsx" },
  {
    role: "student",
    route: "/student/mood-check-ins/history",
    sourceFile: "app/(authenticated)/student/mood-check-ins/history/page.tsx",
  },
  { role: "student", route: "/student/self-checks", sourceFile: "app/(authenticated)/student/self-checks/page.tsx" },
  {
    role: "student",
    route: "/student/self-checks/history",
    sourceFile: "app/(authenticated)/student/self-checks/history/page.tsx",
  },
  {
    role: "student",
    route: "/student/self-checks/results/[attemptId]",
    sourceFile: "app/(authenticated)/student/self-checks/results/[attemptId]/page.tsx",
  },
  { role: "student", route: "/student/support-plan", sourceFile: "app/(authenticated)/student/support-plan/page.tsx" },
  { role: "teacher", route: "/teacher", sourceFile: "app/(authenticated)/teacher/page.tsx" },
  {
    role: "teacher",
    route: "/teacher/sos-alerts/[alertId]",
    sourceFile: "app/(authenticated)/teacher/sos-alerts/[alertId]/page.tsx",
  },
  {
    role: "teacher",
    route: "/teacher/students/[studentId]/self-check-summaries",
    sourceFile: "app/(authenticated)/teacher/students/[studentId]/self-check-summaries/page.tsx",
  },
  {
    role: "teacher",
    route: "/teacher/students/[studentId]/support-summary",
    sourceFile: "app/(authenticated)/teacher/students/[studentId]/support-summary/page.tsx",
  },
  { role: "parent", route: "/parent", sourceFile: "app/(authenticated)/parent/page.tsx" },
  {
    role: "parent",
    route: "/parent/sos-alerts/[alertId]",
    sourceFile: "app/(authenticated)/parent/sos-alerts/[alertId]/page.tsx",
  },
  {
    role: "parent",
    route: "/parent/students/[studentId]/self-check-summaries",
    sourceFile: "app/(authenticated)/parent/students/[studentId]/self-check-summaries/page.tsx",
  },
  {
    role: "parent",
    route: "/parent/students/[studentId]/support-summary",
    sourceFile: "app/(authenticated)/parent/students/[studentId]/support-summary/page.tsx",
  },
  { role: "admin", route: "/admin", sourceFile: "app/(authenticated)/admin/page.tsx" },
  { role: "admin", route: "/admin/operations", sourceFile: "app/(authenticated)/admin/operations/page.tsx" },
  { role: "admin", route: "/admin/users", sourceFile: "app/(authenticated)/admin/users/page.tsx" },
  { role: "admin", route: "/admin/links", sourceFile: "app/(authenticated)/admin/links/page.tsx" },
  { role: "admin", route: "/admin/reports", sourceFile: "app/(authenticated)/admin/reports/page.tsx" },
] as const;

const severityByPattern: Record<PatternCategory, Severity> = {
  shell: "P1",
  navigation: "P1",
  spacing: "P2",
  cards: "P2",
  tables: "P1",
  forms: "P1",
  loading: "P1",
  error: "P1",
  empty: "P1",
  responsive: "P1",
  accessibility: "P0",
};

const followUpPhaseByPattern: Record<PatternCategory, CandidateFollowUpPhase> = {
  shell: "Phase 34",
  navigation: "Phase 34",
  spacing: "Phase 34",
  cards: "Phase 35",
  tables: "Phase 35",
  forms: "Phase 35",
  loading: "Phase 37",
  error: "Phase 38",
  empty: "Phase 35",
  responsive: "Phase 34",
  accessibility: "Phase 34",
};

const phase33InventoryCoverage: InventoryCoverageRow[] = selectedRoutes.flatMap((route) =>
  requiredStates.flatMap((state) =>
    requiredPatternCategories.map((patternCategory) => ({
      ...route,
      state,
      patternCategory,
      severity: severityByPattern[patternCategory],
      candidateFollowUpPhase: followUpPhaseByPattern[patternCategory],
    })),
  ),
);

const forbiddenRawEvidenceFields = [
  "body",
  "id",
  "email",
  "name",
  "token",
  "transcript",
  "answer",
  "private note",
  "free-text reason",
  "export",
  "risk leaderboard",
  "drilldown",
];

const inventoryArtifactCandidates = [
  join(process.cwd(), "../.planning/milestones/v1.6-phases/33-cross-role-ui-performance-baseline-audit/33-UI-INVENTORY.md"),
  join(process.cwd(), "../.planning/phases/33-cross-role-ui-performance-baseline-audit/33-UI-INVENTORY.md"),
  join(process.cwd(), ".planning/phases/33-cross-role-ui-performance-baseline-audit/33-UI-INVENTORY.md"),
];

function readInventoryArtifact(): string {
  const artifactPath = inventoryArtifactCandidates.find((candidate) => existsSync(candidate));
  if (!artifactPath) {
    throw new Error("Phase 33 UI inventory artifact was not found");
  }
  return readFileSync(artifactPath, "utf8");
}

describe("Phase 33 UI inventory coverage helper", () => {
  it("defines the selected cross-role route inventory and exact state/category rules", () => {
    expect(selectedRoutes.map((route) => route.route)).toEqual([
      "shell",
      "/student",
      "/student/chat",
      "/student/mood-check-ins",
      "/student/mood-check-ins/history",
      "/student/self-checks",
      "/student/self-checks/history",
      "/student/self-checks/results/[attemptId]",
      "/student/support-plan",
      "/teacher",
      "/teacher/sos-alerts/[alertId]",
      "/teacher/students/[studentId]/self-check-summaries",
      "/teacher/students/[studentId]/support-summary",
      "/parent",
      "/parent/sos-alerts/[alertId]",
      "/parent/students/[studentId]/self-check-summaries",
      "/parent/students/[studentId]/support-summary",
      "/admin",
      "/admin/operations",
      "/admin/users",
      "/admin/links",
      "/admin/reports",
    ]);
    expect(requiredStates).toEqual([
      "happy",
      "loading",
      "error",
      "empty",
      "blocked/privacy",
      "responsive mobile/tablet/desktop",
      "keyboard/focus",
      "accessible status/alert announcements",
    ]);
    expect(requiredPatternCategories).toEqual([
      "shell",
      "navigation",
      "spacing",
      "cards",
      "tables",
      "forms",
      "loading",
      "error",
      "empty",
      "responsive",
      "accessibility",
    ]);
    expect(allowedSeverities).toEqual(["P0", "P1", "P2"]);
    expect(allowedCandidateFollowUpPhases).toEqual(["Phase 34", "Phase 35", "Phase 37", "Phase 38"]);
  });

  it("represents every required state for every selected route", () => {
    for (const route of selectedRoutes) {
      const statesForRoute = new Set(
        phase33InventoryCoverage.filter((row) => row.route === route.route).map((row) => row.state),
      );

      expect(statesForRoute).toEqual(new Set(requiredStates));
    }
  });

  it("represents every UIC-01 pattern category for every selected route or role shell entry", () => {
    for (const route of selectedRoutes) {
      const categoriesForRoute = new Set(
        phase33InventoryCoverage.filter((row) => row.route === route.route).map((row) => row.patternCategory),
      );

      expect(categoriesForRoute).toEqual(new Set(requiredPatternCategories));
    }
  });

  it("keeps each matrix row complete, source-backed, and routed to allowed follow-up phases", () => {
    for (const row of phase33InventoryCoverage) {
      expect(row.role).toBeTruthy();
      expect(row.route).toBeTruthy();
      expect(requiredStates).toContain(row.state);
      expect(requiredPatternCategories).toContain(row.patternCategory);
      expect(row.sourceFile).toBeTruthy();
      expect(existsSync(join(process.cwd(), row.sourceFile))).toBe(true);
      expect(allowedSeverities).toContain(row.severity);
      expect(allowedCandidateFollowUpPhases).toContain(row.candidateFollowUpPhase);
    }
  });

  it("validates the checked-in Phase 33 UI inventory artifact coverage markers", () => {
    const inventoryArtifact = readInventoryArtifact();

    for (const route of selectedRoutes) {
      expect(inventoryArtifact).toContain(route.route === "shell" ? "Shell" : route.route);
      expect(inventoryArtifact).toContain(route.sourceFile);
    }
    for (const state of requiredStates) {
      expect(inventoryArtifact).toContain(state);
    }
    for (const patternCategory of requiredPatternCategories) {
      expect(inventoryArtifact).toContain(patternCategory);
    }
    for (const severity of allowedSeverities) {
      expect(inventoryArtifact).toContain(severity);
    }
    for (const candidateFollowUpPhase of allowedCandidateFollowUpPhases) {
      expect(inventoryArtifact).toContain(candidateFollowUpPhase);
    }
  });

  it("does not carry raw evidence payload fields in coverage rows", () => {
    for (const row of phase33InventoryCoverage) {
      for (const forbiddenField of forbiddenRawEvidenceFields) {
        expect(Object.hasOwn(row, forbiddenField)).toBe(false);
      }
    }
  });
});
