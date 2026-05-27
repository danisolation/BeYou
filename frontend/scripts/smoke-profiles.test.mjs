import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { evaluateReadinessForProfile, validateSmokeUrls } from "./smoke-utils.mjs";

function statusFor(results, key) {
  return results.find((result) => result.key === key)?.status;
}

test("validateSmokeUrls fails missing production pilot frontend and backend URLs", () => {
  const results = validateSmokeUrls({
    profile: "production_pilot",
    frontendUrl: "",
    backendUrl: "",
    apiBaseUrl: "",
  });

  assert.equal(statusFor(results, "frontend_url"), "fail");
  assert.equal(statusFor(results, "backend_url"), "fail");
});

test("validateSmokeUrls fails localhost or non-HTTPS pilot URLs", () => {
  const localResults = validateSmokeUrls({
    profile: "production_pilot",
    frontendUrl: "http://localhost:3000",
    backendUrl: "https://api.pilot.example",
    apiBaseUrl: "https://api.pilot.example",
  });
  assert.equal(statusFor(localResults, "frontend_url"), "fail");

  const insecureResults = validateSmokeUrls({
    profile: "production_pilot",
    frontendUrl: "https://pilot.example",
    backendUrl: "http://api.pilot.example",
    apiBaseUrl: "http://api.pilot.example",
  });
  assert.equal(statusFor(insecureResults, "backend_url"), "fail");
  assert.equal(statusFor(insecureResults, "api_base_url"), "fail");
});

test("production pilot readiness passes only when status is ready", () => {
  const ready = evaluateReadinessForProfile("production_pilot", {
    status: 200,
    body: { status: "ready" },
  });
  assert.equal(ready.status, "pass");

  const notReady = evaluateReadinessForProfile("production_pilot", {
    status: 503,
    body: { status: "not_ready" },
  });
  assert.equal(notReady.status, "fail");
});

test("public demo readiness tolerates not_ready with explicit demo evidence", () => {
  const result = evaluateReadinessForProfile("public_demo", {
    status: 503,
    body: { status: "not_ready" },
  });

  assert.match(result.evidence, /public demo/i);
  assert.ok(["pass", "warn"].includes(result.status));
});

test("pilot smoke source has no seeded demo-account dependency", () => {
  const pilotPath = path.join(process.cwd(), "scripts", "pilot-smoke.mjs");
  if (!existsSync(pilotPath)) return;

  const source = readFileSync(pilotPath, "utf8");
  for (const forbidden of [
    "student.demo@beyou.local",
    "teacher.demo@beyou.local",
    "parent.demo@beyou.local",
    "admin.demo@beyou.local",
    "BEYOU_DEMO_PASSWORD",
  ]) {
    assert.doesNotMatch(source, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
