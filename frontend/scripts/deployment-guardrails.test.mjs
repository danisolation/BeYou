import assert from "node:assert/strict";
import test from "node:test";

import {
  formatGuardrailResults,
  validateDeploymentConfig,
  validateFrontendApiTarget,
  validateRenderEnvExpectations,
} from "./deployment-guardrails.mjs";

const renderYaml = `
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
        value: https://beyou.vercel.app
      - key: FRONTEND_ORIGINS
        value: https://beyou-frontend.vercel.app
      - key: SESSION_COOKIE_SECURE
        value: true
      - key: SESSION_COOKIE_SAMESITE
        value: none
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

test("validateFrontendApiTarget fails missing API target", () => {
  const results = validateFrontendApiTarget({
    profile: "production_pilot",
    apiBaseUrl: "",
    expectedBackendUrl: "https://beyou-backend.onrender.com",
  });

  assert.equal(statusFor(results, "frontend_api_target"), "fail");
});

test("validateFrontendApiTarget fails localhost API target", () => {
  const results = validateFrontendApiTarget({
    profile: "production_pilot",
    apiBaseUrl: "http://localhost:8000",
    expectedBackendUrl: "https://beyou-backend.onrender.com",
  });

  assert.equal(statusFor(results, "frontend_api_target"), "fail");
});

test("validateFrontendApiTarget fails non-HTTPS production pilot target", () => {
  const results = validateFrontendApiTarget({
    profile: "production_pilot",
    apiBaseUrl: "http://beyou-backend.onrender.com",
    expectedBackendUrl: "https://beyou-backend.onrender.com",
  });

  assert.equal(statusFor(results, "frontend_api_target"), "fail");
});

test("validateFrontendApiTarget fails mismatched production pilot target", () => {
  const results = validateFrontendApiTarget({
    profile: "production_pilot",
    apiBaseUrl: "https://wrong-backend.onrender.com",
    expectedBackendUrl: "https://beyou-backend.onrender.com",
  });

  assert.equal(statusFor(results, "frontend_api_target"), "fail");
});

test("validateDeploymentConfig passes Render and Vercel deployment shape", () => {
  const results = validateDeploymentConfig({
    renderYaml,
    vercelJson,
    vercelRoot: "frontend",
  });

  assert.equal(statusFor(results, "render_root"), "pass");
  assert.equal(statusFor(results, "render_health"), "pass");
  assert.equal(statusFor(results, "vercel_framework"), "pass");
  assert.equal(statusFor(results, "vercel_root"), "pass");

  const missingRootResults = validateDeploymentConfig({
    renderYaml,
    vercelJson,
    vercelRoot: "",
  });
  assert.equal(statusFor(missingRootResults, "vercel_root"), "warn");
  assert.match(resultFor(missingRootResults, "vercel_root").evidence, /BEYOU_VERCEL_ROOT/);

  const wrongRootResults = validateDeploymentConfig({
    renderYaml,
    vercelJson,
    vercelRoot: "backend",
  });
  assert.equal(statusFor(wrongRootResults, "vercel_root"), "fail");
});

test("validateRenderEnvExpectations passes public demo env expectations", () => {
  const results = validateRenderEnvExpectations({
    profile: "public_demo",
    renderYaml,
    expectedFrontendUrl: "https://beyou-frontend.vercel.app",
  });

  assert.equal(statusFor(results, "render_runtime_mode"), "pass");
  assert.equal(statusFor(results, "render_demo_flags"), "pass");
  assert.equal(statusFor(results, "render_session_cookie"), "pass");
  assert.equal(statusFor(results, "render_frontend_origin"), "pass");
});

test("validateRenderEnvExpectations fails unsafe production pilot env expectations", () => {
  const unsafePilotYaml = renderYaml
    .replace("value: public_demo", "value: public_demo")
    .replace("value: true", "value: true")
    .replace("value: https://beyou-frontend.vercel.app", "value: *");

  const results = validateRenderEnvExpectations({
    profile: "production_pilot",
    renderYaml: unsafePilotYaml,
    expectedFrontendUrl: "https://beyou-frontend.vercel.app",
  });

  assert.equal(statusFor(results, "render_runtime_mode"), "fail");
  assert.equal(statusFor(results, "render_demo_flags"), "fail");
  assert.match(resultFor(results, "render_demo_flags").remediation, /ALLOW_DEMO_SEED=false/);
  assert.equal(statusFor(results, "render_frontend_origin"), "fail");
});

test("formatGuardrailResults never prints sensitive labels or env values", () => {
  const output = formatGuardrailResults([
    {
      key: "frontend_api_target",
      category: "vercel_frontend",
      status: "fail",
      evidence: "NEXT_PUBLIC_API_BASE_URL is missing or unsafe.",
      remediation: "Set NEXT_PUBLIC_API_BASE_URL to the deployed HTTPS backend origin.",
    },
    {
      key: "render_runtime_mode",
      category: "render_backend",
      status: "pass",
      evidence: "RUNTIME_MODE matched expected profile.",
      remediation: null,
    },
  ]);

  assert.match(output, /fail/);
  assert.match(output, /pass/);
  assert.doesNotMatch(output, /DATABASE_URL/);
  assert.doesNotMatch(output, /SESSION_COOKIE_NAME/);
  assert.doesNotMatch(output, /SMTP_PASSWORD/);
  assert.doesNotMatch(output, /FREEMODEL_API_KEY/);
  assert.doesNotMatch(output, /student\.demo@beyou\.local/);
  assert.doesNotMatch(output, /https:\/\/beyou-backend\.onrender\.com/);
});
