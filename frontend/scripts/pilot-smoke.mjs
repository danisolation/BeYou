import { fileURLToPath } from "node:url";

import {
  checkBackendLive,
  checkCredentialedCorsPreflight,
  checkFrontendReachable,
  checkReadiness,
  normalizeUrl,
  record,
  validateSmokeUrls,
} from "./smoke-utils.mjs";

function printUrlValidation(results, validationResults) {
  for (const item of validationResults) {
    record(results, `pilot ${item.key}`, item.status !== "fail", item.evidence);
  }
}

function smokeUrl(value, label) {
  const normalized = normalizeUrl(value);
  if (!normalized) throw new Error(`${label} smoke URL is invalid`);
  return normalized.href;
}

export async function main({ env = process.env } = {}) {
  const results = [];
  const validationResults = validateSmokeUrls({
    profile: "production_pilot",
    frontendUrl: env.BEYOU_FRONTEND_URL,
    backendUrl: env.BEYOU_BACKEND_URL,
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
  });

  printUrlValidation(results, validationResults);
  if (validationResults.some((item) => item.status === "fail")) {
    throw new Error("pilot smoke URL validation failed");
  }

  const frontendUrl = smokeUrl(env.BEYOU_FRONTEND_URL, "frontend");
  const backendUrl = smokeUrl(env.BEYOU_BACKEND_URL, "backend");

  await checkFrontendReachable(results, frontendUrl);
  await checkBackendLive(results, backendUrl);
  const readiness = await checkReadiness(results, backendUrl, "production_pilot");
  if (readiness.status !== "ready") {
    throw new Error("production pilot readiness is not ready");
  }
  await checkCredentialedCorsPreflight(results, frontendUrl, backendUrl);

  console.log(`PILOT_SMOKE_PASS ${results.filter((result) => result.ok).length}/${results.length}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    const results = [];
    record(results, "pilot smoke", false, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
