import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  APPROVED_OUTPUT_KEYS,
  assertNoRuntimeApmImports,
  collectFrontendBaseline,
  selectedRouteFilesExist,
} from "./phase33-frontend-baseline.mjs";

const forbiddenKeys = new Set([
  "body",
  "requestBody",
  "responseBody",
  "id",
  "email",
  "name",
  "token",
  "cookie",
  "transcript",
  "answer",
  "privateNote",
  "reason",
  "claim",
  "export",
  "leaderboard",
  "drilldown",
]);

function assertApprovedKeysOnly(value) {
  if (Array.isArray(value)) {
    value.forEach(assertApprovedKeysOnly);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      assert.equal(forbiddenKeys.has(key), false, `forbidden output key: ${key}`);
      if (APPROVED_OUTPUT_KEYS.includes(key)) {
        assertApprovedKeysOnly(nested);
        continue;
      }
      if (["status", "source", "routeAssetCount", "routeAssetBytes"].includes(key)) {
        continue;
      }
      assert.fail(`unapproved output key: ${key}`);
    }
  }
}

test("Phase 33 frontend helper returns aggregate-only route evidence", () => {
  const baseline = collectFrontendBaseline();

  assert.ok(baseline.length >= 4, "expected selected role route baseline rows");
  for (const row of baseline) {
    assert.deepEqual(Object.keys(row).sort(), APPROVED_OUTPUT_KEYS.toSorted());
    assert.equal(typeof row.fetchCandidateCount, "number");
    assert.equal(typeof row.waterfallCount, "number");
    assert.ok(["static-fetch-proxy", "jsdom-request-count", "unavailable"].includes(row.waterfallCountSource));
    assert.equal(row.commandSource, "node scripts/phase33-frontend-baseline.mjs");
  }
  assertApprovedKeysOnly(baseline);
});

test("selected route source files exist for the local static baseline", () => {
  const routeFileStatus = selectedRouteFilesExist();
  const requiredExistingRoutes = new Set(["/student", "/teacher", "/parent", "/admin", "/admin/operations", "/admin/users", "/admin/links", "/admin/reports"]);
  for (const row of routeFileStatus) {
    if (requiredExistingRoutes.has(row.route)) {
      assert.equal(row.exists, true, `${row.sourceFile} should exist`);
    }
  }
});

test("frontend helper does not import runtime logging or APM packages", () => {
  assertNoRuntimeApmImports();
});

test("frontend helper CLI prints aggregate JSON to stdout", () => {
  const result = spawnSync(process.execPath, ["scripts/phase33-frontend-baseline.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.ok(Array.isArray(parsed));
  assert.ok(parsed.length >= 4);
});
