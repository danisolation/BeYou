import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  formatGuardrailResults,
  validateDeploymentConfig,
  validateFrontendApiTarget,
  validateRenderEnvExpectations,
} from "./deployment-guardrails.mjs";
import { evaluateReadinessForProfile, validateSmokeUrls } from "./smoke-utils.mjs";

const PHASE32_NODE_REQUIREMENT_IDS = ["QA-02", "QA-06"];
const LIVE_PILOT_CONSTRAINT =
  "smoke:pilot constrained without BEYOU_FRONTEND_URL, BEYOU_BACKEND_URL, NEXT_PUBLIC_API_BASE_URL, and readiness ready";

const PHASE73_NODE_REQUIREMENT_IDS = ["SECURE-01"];
const PHASE73_GATE_COMMANDS = [
  "cd backend && pytest",
  "cd backend && ruff check .",
  "npm --prefix frontend run lint",
  "npm --prefix frontend run build",
  "npm --prefix frontend test",
  "npm --prefix frontend run test:release-gates",
  "npm --prefix frontend run smoke:demo",
  "npm --prefix frontend run smoke:pilot",
  "npm --prefix frontend run guard:deploy",
];
const LIVE_PILOT_CONSTRAINT_V24 =
  "smoke:pilot constrained without safe BEYOU_FRONTEND_URL, BEYOU_BACKEND_URL, NEXT_PUBLIC_API_BASE_URL, and /health/ready=ready";

const safeRenderYaml = `
services:
  - type: web
    name: beyou-backend
    runtime: python
    rootDir: backend
    buildCommand: pip install -e .
    startCommand: alembic upgrade head && python -m app.seeds.demo_seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health/live
    envVars:
      - key: RUNTIME_MODE
        value: production_pilot
      - key: ALLOW_DEMO_SEED
        value: false
      - key: ALLOW_DEMO_LOGIN
        value: false
      - key: FRONTEND_ORIGIN
        value: https://pilot.example
      - key: FRONTEND_ORIGINS
        value: ""
      - key: SESSION_COOKIE_SECURE
        value: true
      - key: SESSION_COOKIE_SAMESITE
        value: none
      - key: WEB_PUSH_VAPID_PUBLIC_KEY
        sync: false
      - key: WEB_PUSH_VAPID_PRIVATE_KEY
        sync: false
      - key: WEB_PUSH_SUBJECT
        sync: false
`;

const unsafeRenderYaml = `
services:
  - type: web
    name: beyou-backend
    runtime: python
    rootDir: backend
    buildCommand: pip install -e .
    startCommand: alembic upgrade head && python -m app.seeds.demo_seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health/live
    envVars:
      - key: RUNTIME_MODE
        value: public_demo
      - key: ALLOW_DEMO_SEED
        value: true
      - key: ALLOW_DEMO_LOGIN
        value: true
      - key: FRONTEND_ORIGIN
        value: http://localhost:3000
      - key: FRONTEND_ORIGINS
        value: http://127.0.0.1:3000
      - key: SESSION_COOKIE_SECURE
        value: false
      - key: SESSION_COOKIE_SAMESITE
        value: lax
`;

const vercelJson = JSON.stringify({
  framework: "nextjs",
  buildCommand: "npm run build",
  installCommand: "npm install",
});

function statusFor(results, key) {
  return results.find((result) => result.key === key)?.status;
}

function resultFor(results, key) {
  return results.find((result) => result.key === key);
}

function scriptSource(name) {
  return readFileSync(new URL(`./${name}`, import.meta.url), "utf8");
}

test("QA-02/QA-06 Node requirement ids are explicit", () => {
  assert.deepEqual(PHASE32_NODE_REQUIREMENT_IDS, ["QA-02", "QA-06"]);
});

test("QA-02 production pilot deploy guard fails unsafe Render env values", () => {
  const results = validateRenderEnvExpectations({
    profile: "production_pilot",
    renderYaml: unsafeRenderYaml,
    expectedFrontendUrl: "https://pilot.example",
  });

  assert.equal(statusFor(results, "render_runtime_mode"), "fail");
  assert.equal(statusFor(results, "render_demo_flags"), "fail");
  assert.equal(statusFor(results, "render_frontend_origin"), "fail");
  assert.equal(statusFor(results, "render_session_cookie"), "fail");
  assert.match(resultFor(results, "render_demo_flags").remediation, /ALLOW_DEMO_SEED=false/);
});

test("QA-02 production pilot deploy guard passes safe Render and Vercel metadata", () => {
  const renderResults = validateRenderEnvExpectations({
    profile: "production_pilot",
    renderYaml: safeRenderYaml,
    expectedFrontendUrl: "https://pilot.example",
  });
  const deploymentResults = validateDeploymentConfig({
    renderYaml: safeRenderYaml,
    vercelJson,
    vercelRoot: "frontend",
  });

  assert.equal(statusFor(renderResults, "render_runtime_mode"), "pass");
  assert.equal(statusFor(renderResults, "render_demo_flags"), "pass");
  assert.equal(statusFor(renderResults, "render_frontend_origin"), "pass");
  assert.equal(statusFor(renderResults, "render_session_cookie"), "pass");
  assert.equal(statusFor(deploymentResults, "render_root"), "pass");
  assert.equal(statusFor(deploymentResults, "render_web_push_env"), "pass");
  assert.equal(statusFor(deploymentResults, "vercel_root"), "pass");
});

test("QA-02 production pilot smoke URL validation rejects missing, local, non-HTTPS, and mismatched API targets", () => {
  const missing = validateSmokeUrls({
    profile: "production_pilot",
    frontendUrl: "",
    backendUrl: "",
    apiBaseUrl: "",
  });
  assert.equal(statusFor(missing, "frontend_url"), "fail");
  assert.equal(statusFor(missing, "backend_url"), "fail");

  const local = validateSmokeUrls({
    profile: "production_pilot",
    frontendUrl: "http://localhost:3000",
    backendUrl: "https://api.pilot.example",
    apiBaseUrl: "https://api.pilot.example",
  });
  assert.equal(statusFor(local, "frontend_url"), "fail");

  const nonHttps = validateSmokeUrls({
    profile: "production_pilot",
    frontendUrl: "https://pilot.example",
    backendUrl: "http://api.pilot.example",
    apiBaseUrl: "http://api.pilot.example",
  });
  assert.equal(statusFor(nonHttps, "backend_url"), "fail");
  assert.equal(statusFor(nonHttps, "api_base_url"), "fail");

  const mismatchedApi = validateFrontendApiTarget({
    profile: "production_pilot",
    apiBaseUrl: "https://wrong-api.pilot.example",
    expectedBackendUrl: "https://api.pilot.example",
  });
  assert.equal(statusFor(mismatchedApi, "frontend_api_target"), "fail");

  const smokeMismatch = validateSmokeUrls({
    profile: "production_pilot",
    frontendUrl: "https://pilot.example",
    backendUrl: "https://api.pilot.example",
    apiBaseUrl: "https://wrong-api.pilot.example",
  });
  assert.equal(statusFor(smokeMismatch, "api_base_url"), "fail");
});

test("QA-02 pilot smoke source has no demo-account dependency and requires readiness ready", () => {
  const pilotSource = scriptSource("pilot-smoke.mjs");
  const demoSource = scriptSource("demo-smoke.mjs");
  const productionSource = scriptSource("production-smoke.mjs");

  for (const forbidden of [
    "student.demo@beyou.local",
    "teacher.demo@beyou.local",
    "parent.demo@beyou.local",
    "admin.demo@beyou.local",
    "BEYOU_DEMO_PASSWORD",
  ]) {
    assert.doesNotMatch(pilotSource, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(pilotSource, /production pilot readiness is not ready/);
  assert.match(pilotSource, /checkReadiness\(results, backendUrl, "production_pilot"\)/);
  assert.match(demoSource, /student\.demo@beyou\.local/);
  assert.match(demoSource, /BEYOU_DEMO_PASSWORD/);
  assert.match(productionSource, /smoke:production delegates to smoke:demo/);
  assert.match(productionSource, /use smoke:pilot for production_pilot readiness/);
});

test("QA-02 production pilot readiness passes only for ready status", () => {
  const ready = evaluateReadinessForProfile("production_pilot", {
    status: 200,
    body: { status: "ready" },
  });
  const notReady = evaluateReadinessForProfile("production_pilot", {
    status: 503,
    body: { status: "not_ready" },
  });

  assert.equal(ready.status, "pass");
  assert.equal(notReady.status, "fail");
  assert.match(notReady.evidence, /readiness status ready/);
});

test("QA-06 metadata-only guardrail output redacts secret labels, URLs, emails, and token-like values", () => {
  const output = formatGuardrailResults([
    {
      key: "phase32_metadata_only",
      category: "release_gate",
      status: "fail",
      evidence:
        "DATABASE_URL=postgres://user:pass@db.example/app SESSION_COOKIE_NAME=__Secure-beyou_session SMTP_PASSWORD=hunter2 FREEMODEL_API_KEY=secret client_secret access_token refresh_token id_token eyJhbGciOiJIUzI1NiJ9.payload",
      remediation:
        "Email student.demo@beyou.local, open https://api.pilot.example/path, and paste access_token if this sanitizer is broken.",
      command: "npm --prefix frontend run guard:deploy",
      envKeys: [
        "DATABASE_URL",
        "SESSION_COOKIE_NAME",
        "SMTP_PASSWORD",
        "FREEMODEL_API_KEY",
        "client_secret",
        "access_token",
        "refresh_token",
        "id_token",
      ],
    },
  ]);

  assert.match(output, /metadata-only|metadata_only/);
  assert.match(output, /guard:deploy/);
  for (const forbidden of [
    "DATABASE_URL",
    "SESSION_COOKIE_NAME",
    "SMTP_PASSWORD",
    "FREEMODEL_API_KEY",
    "client_secret",
    "access_token",
    "refresh_token",
    "id_token",
    "student.demo@beyou.local",
    "https://api.pilot.example",
    "eyJ",
    "hunter2",
  ]) {
    assert.doesNotMatch(output, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("QA-06 live pilot smoke is documented as constrained without safe deployment env", () => {
  const thisSource = scriptSource("release-gates.test.mjs");

  assert.match(thisSource, new RegExp(LIVE_PILOT_CONSTRAINT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(
    LIVE_PILOT_CONSTRAINT,
    "smoke:pilot constrained without BEYOU_FRONTEND_URL, BEYOU_BACKEND_URL, NEXT_PUBLIC_API_BASE_URL, and readiness ready",
  );
});

test("Phase 73 v2.4 requirement ids are explicit", () => {
  assert.deepEqual(PHASE73_NODE_REQUIREMENT_IDS, ["SECURE-01"]);
});

test("Phase 73 v2.4 release-gate command matrix is documented", () => {
  assert.deepEqual(PHASE73_GATE_COMMANDS, [
    "cd backend && pytest",
    "cd backend && ruff check .",
    "npm --prefix frontend run lint",
    "npm --prefix frontend run build",
    "npm --prefix frontend test",
    "npm --prefix frontend run test:release-gates",
    "npm --prefix frontend run smoke:demo",
    "npm --prefix frontend run smoke:pilot",
    "npm --prefix frontend run guard:deploy",
  ]);
});

test("Phase 73 smoke:pilot constraint policy documented", () => {
  assert.match(
    LIVE_PILOT_CONSTRAINT_V24,
    /smoke:pilot constrained without safe BEYOU_FRONTEND_URL, BEYOU_BACKEND_URL, NEXT_PUBLIC_API_BASE_URL, and \/health\/ready=ready/,
  );
});
