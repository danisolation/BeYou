export function normalizeUrl(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    parsed.hash = "";
    parsed.search = "";
    return {
      href: parsed.href.replace(/\/$/, ""),
      protocol: parsed.protocol,
      hostname: parsed.hostname.toLowerCase(),
    };
  } catch {
    return null;
  }
}

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "0.0.0.0" || hostname === "::1" || hostname.startsWith("127.");
}

function result(status, key, evidence, remediation = null) {
  return { status, key, evidence, remediation };
}

function validatePublicUrl(key, value, label, required) {
  const parsed = normalizeUrl(value);
  if (!parsed) {
    return required
      ? result("fail", key, `${label} URL is missing or invalid.`, `Set ${label} to the deployed HTTPS origin.`)
      : result("warn", key, `${label} URL is not set; skipping optional API target comparison.`);
  }

  if (isLocalHost(parsed.hostname)) {
    return result("fail", key, `${label} URL points at a local host.`, `Use the deployed HTTPS ${label.toLowerCase()} origin.`);
  }

  if (parsed.protocol !== "https:") {
    return result("fail", key, `${label} URL is not HTTPS.`, `Use an HTTPS ${label.toLowerCase()} origin.`);
  }

  return result("pass", key, `${label} URL is HTTPS and non-local.`);
}

export function validateSmokeUrls({ profile = "public_demo", frontendUrl, backendUrl, apiBaseUrl }) {
  const requireDeployedUrls = profile === "production_pilot";
  const results = [
    validatePublicUrl("frontend_url", frontendUrl, "Frontend", requireDeployedUrls),
    validatePublicUrl("backend_url", backendUrl, "Backend", requireDeployedUrls),
  ];

  if (profile === "production_pilot") {
    const apiResult = validatePublicUrl("api_base_url", apiBaseUrl, "API base", false);
    const api = normalizeUrl(apiBaseUrl);
    const backend = normalizeUrl(backendUrl);

    if (apiResult.status === "pass" && backend && api.href !== backend.href) {
      results.push(
        result(
          "fail",
          "api_base_url",
          "NEXT_PUBLIC_API_BASE_URL does not match the backend smoke URL.",
          "Set NEXT_PUBLIC_API_BASE_URL to the same deployed backend origin used by smoke:pilot.",
        ),
      );
    } else {
      results.push(apiResult);
    }
  }

  return results;
}

export function record(results, name, ok, detail) {
  results.push({ name, ok, detail });
  const marker = ok ? "PASS" : "FAIL";
  console.log(`${marker} ${name}${detail ? ` - ${detail}` : ""}`);
}

export async function assertFetch(results, name, url, init, check) {
  const response = await fetch(url, init);
  const detail = await check(response);
  record(results, name, true, detail);
  return response;
}

export async function checkFrontendReachable(results, frontendUrl) {
  return assertFetch(results, "frontend reachable", frontendUrl, {}, async (response) => {
    if (!response.ok) throw new Error(`frontend returned ${response.status}`);
    return `HTTP ${response.status}`;
  });
}

export async function checkBackendLive(results, backendUrl) {
  return assertFetch(results, "backend live health", `${backendUrl}/health/live`, {}, async (response) => {
    if (!response.ok) throw new Error(`/health/live returned ${response.status}`);
    return `HTTP ${response.status}`;
  });
}

export function evaluateReadinessForProfile(profile, { status, body }) {
  const readinessStatus = body?.status ?? "unknown";

  if (profile === "production_pilot") {
    if (status === 200 && readinessStatus === "ready") {
      return result("pass", "readiness", "Production pilot readiness is ready.");
    }

    return result(
      "fail",
      "readiness",
      "Production pilot smoke requires readiness status ready.",
      "Fix readiness blockers before running pilot smoke again.",
    );
  }

  if ([200, 503].includes(status) && ["ready", "degraded", "not_ready"].includes(readinessStatus)) {
    const statusLevel = readinessStatus === "ready" ? "pass" : "warn";
    return result(statusLevel, "readiness", `Public demo readiness reported ${readinessStatus}; seeded demo mode can be intentionally not_ready.`);
  }

  return result("fail", "readiness", "Readiness endpoint returned an unexpected status.", "Inspect /health/ready before rerunning smoke.");
}

export async function checkReadiness(results, backendUrl, profile) {
  const response = await fetch(`${backendUrl}/health/ready`);
  let body = {};
  try {
    body = await response.json();
  } catch {
    body = { status: "unknown" };
  }

  const evaluation = evaluateReadinessForProfile(profile, { status: response.status, body });
  record(results, "backend readiness health", evaluation.status !== "fail", evaluation.evidence);
  return { status: body.status ?? "unknown", httpStatus: response.status, body, evaluation };
}

export async function checkCredentialedCorsPreflight(results, frontendUrl, backendUrl) {
  return assertFetch(
    results,
    "credentialed CORS login preflight",
    `${backendUrl}/api/auth/login`,
    {
      method: "OPTIONS",
      headers: {
        Origin: frontendUrl,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    },
    async (response) => {
      if (!response.ok) throw new Error(`preflight returned ${response.status}`);
      const allowOrigin = response.headers.get("access-control-allow-origin");
      const allowCredentials = response.headers.get("access-control-allow-credentials");
      if (allowOrigin !== frontendUrl) throw new Error("unexpected allow-origin metadata");
      if (allowCredentials !== "true") throw new Error("credentials header missing");
      return "origin and credentials allowed";
    },
  );
}

export function cookieFrom(response) {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const [cookie] = setCookie.split(";");
  return cookie;
}
