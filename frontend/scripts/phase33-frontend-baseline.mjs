import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, "..");

export const APPROVED_OUTPUT_KEYS = [
  "environment",
  "route",
  "sourceFile",
  "fetchCandidateCount",
  "waterfallCount",
  "waterfallCountSource",
  "buildEvidence",
  "coldWarmLabel",
  "commandSource",
];

export const SELECTED_ROUTES = [
  { route: "/student", sourceFile: "app/(authenticated)/student/page.tsx" },
  { route: "/student/chat", sourceFile: "app/(authenticated)/student/chat/page.tsx" },
  { route: "/student/mood-check-ins", sourceFile: "app/(authenticated)/student/mood-check-ins/page.tsx" },
  { route: "/student/mood-check-ins/history", sourceFile: "app/(authenticated)/student/mood-check-ins/history/page.tsx" },
  { route: "/student/self-checks", sourceFile: "app/(authenticated)/student/self-checks/page.tsx" },
  { route: "/student/self-checks/history", sourceFile: "app/(authenticated)/student/self-checks/history/page.tsx" },
  {
    route: "/student/self-checks/results/[attemptId]",
    sourceFile: "app/(authenticated)/student/self-checks/results/[attemptId]/page.tsx",
  },
  { route: "/student/support-plan", sourceFile: "app/(authenticated)/student/support-plan/page.tsx" },
  { route: "/teacher", sourceFile: "app/(authenticated)/teacher/page.tsx" },
  { route: "/teacher/sos-alerts/[alertId]", sourceFile: "app/(authenticated)/teacher/sos-alerts/[alertId]/page.tsx" },
  {
    route: "/teacher/students/[studentId]/self-check-summaries",
    sourceFile: "app/(authenticated)/teacher/students/[studentId]/self-check-summaries/page.tsx",
  },
  {
    route: "/teacher/students/[studentId]/support-summary",
    sourceFile: "app/(authenticated)/teacher/students/[studentId]/support-summary/page.tsx",
  },
  { route: "/parent", sourceFile: "app/(authenticated)/parent/page.tsx" },
  { route: "/parent/sos-alerts/[alertId]", sourceFile: "app/(authenticated)/parent/sos-alerts/[alertId]/page.tsx" },
  {
    route: "/parent/students/[studentId]/self-check-summaries",
    sourceFile: "app/(authenticated)/parent/students/[studentId]/self-check-summaries/page.tsx",
  },
  {
    route: "/parent/students/[studentId]/support-summary",
    sourceFile: "app/(authenticated)/parent/students/[studentId]/support-summary/page.tsx",
  },
  { route: "/admin", sourceFile: "app/(authenticated)/admin/page.tsx" },
  { route: "/admin/operations", sourceFile: "app/(authenticated)/admin/operations/page.tsx" },
  { route: "/admin/users", sourceFile: "app/(authenticated)/admin/users/page.tsx" },
  { route: "/admin/links", sourceFile: "app/(authenticated)/admin/links/page.tsx" },
  { route: "/admin/reports", sourceFile: "app/(authenticated)/admin/reports/page.tsx" },
];

const forbiddenRuntimeImports = [
  "@sentry/",
  "applicationinsights",
  "newrelic",
  "datadog",
  "dd-trace",
  "elastic-apm",
  "logrocket",
  "analytics-node",
];

function sourcePath(relativePath) {
  return path.join(frontendRoot, relativePath);
}

function readSource(relativePath) {
  const fullPath = sourcePath(relativePath);
  if (!existsSync(fullPath)) {
    return "";
  }
  return readFileSync(fullPath, "utf8");
}

function countMatches(source, pattern) {
  return Array.from(source.matchAll(pattern)).length;
}

function localImportCandidates(source) {
  const imports = [];
  const importPattern = /from\s+["']([^"']+)["']/g;
  for (const match of source.matchAll(importPattern)) {
    const importPath = match[1];
    if (!importPath.startsWith("@/") && !importPath.startsWith("./") && !importPath.startsWith("../")) {
      continue;
    }
    if (importPath.startsWith("@/")) {
      imports.push(`${importPath.slice(2)}.ts`, `${importPath.slice(2)}.tsx`);
    }
  }
  return imports.filter((candidate) => existsSync(sourcePath(candidate)));
}

export function assertNoRuntimeApmImports() {
  const scriptSource = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const importedPackagePattern = /from\s+["']([^"']+)["']|import\(["']([^"']+)["']\)/g;
  for (const match of scriptSource.matchAll(importedPackagePattern)) {
    const packageName = match[1] ?? match[2] ?? "";
    if (forbiddenRuntimeImports.some((forbidden) => packageName.includes(forbidden))) {
      throw new Error(`Phase 33 frontend baseline helper must not import runtime logging/APM package: ${packageName}`);
    }
  }
}

export function selectedRouteFilesExist() {
  return SELECTED_ROUTES.map((entry) => ({
    route: entry.route,
    sourceFile: entry.sourceFile,
    exists: existsSync(sourcePath(entry.sourceFile)),
  }));
}

function routeAssetEvidence(route) {
  const manifestPath = path.join(frontendRoot, ".next", "app-build-manifest.json");
  if (!existsSync(manifestPath)) {
    return {
      status: "unavailable",
      source: "npm --prefix frontend run build",
      routeAssetCount: 0,
      routeAssetBytes: 0,
    };
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const pages = manifest.pages ?? {};
  const assets = pages[route] ?? pages[`app${route === "/" ? "/page" : `${route}/page`}`] ?? [];
  const routeAssetBytes = assets.reduce((total, asset) => {
    const assetPath = path.join(frontendRoot, ".next", asset);
    return total + (existsSync(assetPath) ? statSync(assetPath).size : 0);
  }, 0);

  return {
    status: "available",
    source: ".next/app-build-manifest.json",
    routeAssetCount: assets.length,
    routeAssetBytes,
  };
}

function fetchCandidateCountFor(entry) {
  const primarySource = readSource(entry.sourceFile);
  const importedSources = localImportCandidates(primarySource).map(readSource);
  const combinedSource = [primarySource, ...importedSources].join("\n");
  return countMatches(combinedSource, /\bapiFetch\s*\(/g) + countMatches(combinedSource, /\bfetch\s*\(/g);
}

export function collectFrontendBaseline() {
  assertNoRuntimeApmImports();
  return SELECTED_ROUTES.filter((entry) => existsSync(sourcePath(entry.sourceFile))).map((entry) => {
    const fetchCandidateCount = fetchCandidateCountFor(entry);
    return {
      environment: "local deterministic",
      route: entry.route,
      sourceFile: entry.sourceFile,
      fetchCandidateCount,
      waterfallCount: fetchCandidateCount,
      waterfallCountSource: "static-fetch-proxy",
      buildEvidence: routeAssetEvidence(entry.route),
      coldWarmLabel: ".next build evidence if present; local static scan otherwise",
      commandSource: "node scripts/phase33-frontend-baseline.mjs",
    };
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const baseline = collectFrontendBaseline();
  process.stdout.write(`${JSON.stringify(baseline, null, 2)}\n`);
}
