import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const VALID_PROFILES = new Set(["public_demo", "production_pilot"]);
const SECRET_LABELS = [
  "DATABASE_URL",
  "SESSION_COOKIE_NAME",
  "SMTP_PASSWORD",
  "WEB_PUSH_VAPID_PRIVATE_KEY",
  "FREEMODEL_API_KEY",
  "client_secret",
  "access_token",
  "refresh_token",
  "id_token",
];
const OVERRIDE_ENV_KEYS = {
  BEYOU_RENDER_RUNTIME_MODE: "RUNTIME_MODE",
  BEYOU_RENDER_ALLOW_DEMO_SEED: "ALLOW_DEMO_SEED",
  BEYOU_RENDER_ALLOW_DEMO_LOGIN: "ALLOW_DEMO_LOGIN",
  BEYOU_RENDER_FRONTEND_ORIGIN: "FRONTEND_ORIGIN",
  BEYOU_RENDER_FRONTEND_ORIGINS: "FRONTEND_ORIGINS",
  BEYOU_RENDER_SESSION_COOKIE_SECURE: "SESSION_COOKIE_SECURE",
  BEYOU_RENDER_SESSION_COOKIE_SAMESITE: "SESSION_COOKIE_SAMESITE",
};
const WEB_PUSH_RENDER_ENV_KEYS = [
  "WEB_PUSH_VAPID_PUBLIC_KEY",
  "WEB_PUSH_VAPID_PRIVATE_KEY",
  "WEB_PUSH_SUBJECT",
];

function result({ status, category, key, evidence, remediation = null, command = null, envKeys = [] }) {
  return { status, category, key, evidence, remediation, command, envKeys };
}

function pass(category, key, evidence, extras = {}) {
  return result({ status: "pass", category, key, evidence, ...extras });
}

function warn(category, key, evidence, remediation, extras = {}) {
  return result({ status: "warn", category, key, evidence, remediation, ...extras });
}

function fail(category, key, evidence, remediation, extras = {}) {
  return result({ status: "fail", category, key, evidence, remediation, ...extras });
}

function normalizeUrl(value) {
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

function parseJsonConfig(json) {
  if (typeof json !== "string") return json;
  return JSON.parse(json);
}

function parseRenderConfig(renderYaml) {
  if (typeof renderYaml !== "string") return renderYaml;
  return parseYaml(renderYaml);
}

function backendServiceFrom(renderConfig) {
  const services = Array.isArray(renderConfig?.services) ? renderConfig.services : [];
  return (
    services.find((service) => service?.name === "beyou-backend") ??
    services.find((service) => service?.type === "web" && service?.rootDir === "backend") ??
    null
  );
}

function renderEnvVarFrom(backendService, key) {
  const envVars = Array.isArray(backendService?.envVars) ? backendService.envVars : [];
  return envVars.find((item) => item?.key === key) ?? null;
}

function envMapFromRender(renderYaml, operatorEnv = {}) {
  const renderConfig = parseRenderConfig(renderYaml);
  const backendService = backendServiceFrom(renderConfig);
  const envVars = Array.isArray(backendService?.envVars) ? backendService.envVars : [];
  const values = new Map();

  for (const item of envVars) {
    if (typeof item?.key === "string" && Object.hasOwn(item, "value")) {
      values.set(item.key, String(item.value));
    }
  }

  for (const [operatorKey, renderKey] of Object.entries(OVERRIDE_ENV_KEYS)) {
    if (Object.hasOwn(operatorEnv, operatorKey) && operatorEnv[operatorKey] !== undefined) {
      values.set(renderKey, String(operatorEnv[operatorKey]));
    }
  }

  return values;
}

function splitOrigins(value) {
  return String(value ?? "")
    .split(/[\s,]+/)
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function frontendOriginsFrom(envValues) {
  return [
    ...splitOrigins(envValues.get("FRONTEND_ORIGIN")),
    ...splitOrigins(envValues.get("FRONTEND_ORIGINS")),
  ];
}

function expectedDemoFlags(profile) {
  return profile === "production_pilot"
    ? { seed: "false", login: "false", remediation: "Set ALLOW_DEMO_SEED=false and ALLOW_DEMO_LOGIN=false." }
    : { seed: "true", login: "true", remediation: "Set ALLOW_DEMO_SEED=true and ALLOW_DEMO_LOGIN=true." };
}

function boolString(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function validateFrontendApiTarget({ profile = "public_demo", apiBaseUrl, expectedBackendUrl }) {
  const category = "vercel_frontend";
  const key = "frontend_api_target";
  const apiTarget = normalizeUrl(apiBaseUrl);
  const expectedTarget = normalizeUrl(expectedBackendUrl);

  if (!VALID_PROFILES.has(profile)) {
    return [
      fail(
        category,
        key,
        "BEYOU_DEPLOY_PROFILE must be public_demo or production_pilot.",
        "Set BEYOU_DEPLOY_PROFILE to public_demo or production_pilot.",
        { envKeys: ["BEYOU_DEPLOY_PROFILE"] },
      ),
    ];
  }

  if (!apiBaseUrl || !String(apiBaseUrl).trim()) {
    return [
      fail(
        category,
        key,
        "NEXT_PUBLIC_API_BASE_URL is not set.",
        "Set NEXT_PUBLIC_API_BASE_URL to the deployed HTTPS backend origin.",
        { envKeys: ["NEXT_PUBLIC_API_BASE_URL", "BEYOU_EXPECTED_BACKEND_URL"] },
      ),
    ];
  }

  if (!apiTarget) {
    return [
      fail(
        category,
        key,
        "NEXT_PUBLIC_API_BASE_URL is not a valid absolute URL.",
        "Use the deployed HTTPS backend origin for NEXT_PUBLIC_API_BASE_URL.",
        { envKeys: ["NEXT_PUBLIC_API_BASE_URL"] },
      ),
    ];
  }

  if (isLocalHost(apiTarget.hostname)) {
    return [
      fail(
        category,
        key,
        "NEXT_PUBLIC_API_BASE_URL points at a local host.",
        "Use the deployed backend origin before running deployment smoke checks.",
        { envKeys: ["NEXT_PUBLIC_API_BASE_URL"] },
      ),
    ];
  }

  if (apiTarget.protocol !== "https:") {
    return [
      fail(
        category,
        key,
        "NEXT_PUBLIC_API_BASE_URL is not HTTPS.",
        "Use an HTTPS backend origin for public demo and production pilot deployments.",
        { envKeys: ["NEXT_PUBLIC_API_BASE_URL"] },
      ),
    ];
  }

  if (!expectedTarget) {
    return [
      fail(
        category,
        key,
        "BEYOU_EXPECTED_BACKEND_URL is missing or invalid.",
        "Set BEYOU_EXPECTED_BACKEND_URL to the deployed HTTPS backend origin.",
        { envKeys: ["BEYOU_EXPECTED_BACKEND_URL"] },
      ),
    ];
  }

  if (apiTarget.href !== expectedTarget.href) {
    return [
      fail(
        category,
        key,
        "NEXT_PUBLIC_API_BASE_URL does not match BEYOU_EXPECTED_BACKEND_URL.",
        "Point the frontend API target at the expected backend origin.",
        { envKeys: ["NEXT_PUBLIC_API_BASE_URL", "BEYOU_EXPECTED_BACKEND_URL"] },
      ),
    ];
  }

  return [
    pass(category, key, "NEXT_PUBLIC_API_BASE_URL is HTTPS and matches BEYOU_EXPECTED_BACKEND_URL.", {
      envKeys: ["NEXT_PUBLIC_API_BASE_URL", "BEYOU_EXPECTED_BACKEND_URL"],
    }),
  ];
}

export function validateDeploymentConfig({ renderYaml, vercelJson, vercelRoot }) {
  const results = [];
  let renderConfig;
  let vercelConfig;

  try {
    renderConfig = parseRenderConfig(renderYaml);
  } catch {
    return [
      fail(
        "render_backend",
        "render_config_parse",
        "render.yaml could not be parsed.",
        "Fix render.yaml syntax before deployment.",
      ),
    ];
  }

  try {
    vercelConfig = parseJsonConfig(vercelJson);
  } catch {
    vercelConfig = null;
  }

  const backendService = backendServiceFrom(renderConfig);
  const startCommand = String(backendService?.startCommand ?? "");

  results.push(
    backendService?.rootDir === "backend"
      ? pass("render_backend", "render_root", "Render backend rootDir is configured for the backend service.")
      : fail("render_backend", "render_root", "Render backend rootDir is not backend.", "Set Render backend rootDir to backend."),
  );

  results.push(
    backendService?.buildCommand === "pip install -e ."
      ? pass("render_backend", "render_build", "Render backend build command matches the expected package install.")
      : fail("render_backend", "render_build", "Render backend build command is not the expected package install.", "Set buildCommand to pip install -e ."),
  );

  results.push(
    startCommand.includes("alembic upgrade head") && startCommand.includes("uvicorn app.main:app")
      ? pass("render_backend", "render_start", "Render backend start command runs migrations and starts FastAPI.")
      : fail(
          "render_backend",
          "render_start",
          "Render backend start command does not include migrations and FastAPI startup.",
          "Include alembic upgrade head and uvicorn app.main:app in the start command.",
        ),
  );

  results.push(
    backendService?.healthCheckPath === "/health/live"
      ? pass("render_backend", "render_health", "Render health check uses /health/live.")
      : fail("render_backend", "render_health", "Render health check path is not /health/live.", "Set healthCheckPath to /health/live."),
  );

  const missingWebPushEnv = WEB_PUSH_RENDER_ENV_KEYS.filter((key) => !renderEnvVarFrom(backendService, key));
  const unsafeWebPushEnv = WEB_PUSH_RENDER_ENV_KEYS.filter((key) => {
    const item = renderEnvVarFrom(backendService, key);
    return item && item.sync !== false;
  });
  if (missingWebPushEnv.length === 0 && unsafeWebPushEnv.length === 0) {
    results.push(
      pass("render_backend", "render_web_push_env", "Render declares Web Push VAPID env vars as manual/secret values.", {
        envKeys: WEB_PUSH_RENDER_ENV_KEYS,
      }),
    );
  } else {
    results.push(
      fail(
        "render_backend",
        "render_web_push_env",
        "Render Web Push VAPID env vars are missing or not marked manual/secret.",
        "Add WEB_PUSH_VAPID_PUBLIC_KEY, WEB_PUSH_VAPID_PRIVATE_KEY, and WEB_PUSH_SUBJECT to Render with sync: false, then set values in the Render dashboard.",
        { envKeys: WEB_PUSH_RENDER_ENV_KEYS },
      ),
    );
  }

  if (!vercelConfig) {
    results.push(fail("vercel_frontend", "vercel_config_parse", "frontend/vercel.json could not be parsed.", "Fix frontend/vercel.json syntax before deployment."));
  } else {
    results.push(
      vercelConfig.framework === "nextjs"
        ? pass("vercel_frontend", "vercel_framework", "Vercel framework is Next.js.")
        : fail("vercel_frontend", "vercel_framework", "Vercel framework is not Next.js.", "Set framework to nextjs."),
    );

    results.push(
      vercelConfig.buildCommand === "npm run build"
        ? pass("vercel_frontend", "vercel_build", "Vercel build command matches the frontend build script.")
        : fail("vercel_frontend", "vercel_build", "Vercel build command is not npm run build.", "Set buildCommand to npm run build."),
    );

    results.push(
      vercelConfig.installCommand === "npm install"
        ? pass("vercel_frontend", "vercel_install", "Vercel install command matches npm install.")
        : fail("vercel_frontend", "vercel_install", "Vercel install command is not npm install.", "Set installCommand to npm install."),
    );
  }

  if (!String(vercelRoot ?? "").trim()) {
    results.push(
      warn(
        "vercel_frontend",
        "vercel_root",
        "BEYOU_VERCEL_ROOT was not provided, so the Vercel project root cannot be confirmed.",
        "Set BEYOU_VERCEL_ROOT=frontend after confirming the Vercel Root Directory setting.",
        { envKeys: ["BEYOU_VERCEL_ROOT"] },
      ),
    );
  } else if (String(vercelRoot).trim() !== "frontend") {
    results.push(
      fail(
        "vercel_frontend",
        "vercel_root",
        "BEYOU_VERCEL_ROOT does not match the expected frontend root.",
        "Set the Vercel project Root Directory to frontend, then rerun with BEYOU_VERCEL_ROOT=frontend.",
        { envKeys: ["BEYOU_VERCEL_ROOT"] },
      ),
    );
  } else {
    results.push(pass("vercel_frontend", "vercel_root", "BEYOU_VERCEL_ROOT confirms the frontend project root.", { envKeys: ["BEYOU_VERCEL_ROOT"] }));
  }

  return results;
}

export function validateRenderEnvExpectations({ profile = "public_demo", renderYaml, expectedFrontendUrl, operatorEnv = {} }) {
  let envValues;
  try {
    envValues = envMapFromRender(renderYaml, operatorEnv);
  } catch {
    return [
      fail("render_backend", "render_runtime_mode", "Render env vars could not be parsed.", "Fix render.yaml env var syntax."),
      fail("render_backend", "render_demo_flags", "Render env vars could not be parsed.", "Fix render.yaml env var syntax."),
      fail("render_backend", "render_session_cookie", "Render env vars could not be parsed.", "Fix render.yaml env var syntax."),
      fail("render_backend", "render_frontend_origin", "Render env vars could not be parsed.", "Fix render.yaml env var syntax."),
    ];
  }

  const results = [];
  const expectedProfile = VALID_PROFILES.has(profile) ? profile : "public_demo";
  const runtimeMode = boolString(envValues.get("RUNTIME_MODE"));
  const demoFlags = expectedDemoFlags(expectedProfile);
  const allowDemoSeed = boolString(envValues.get("ALLOW_DEMO_SEED"));
  const allowDemoLogin = boolString(envValues.get("ALLOW_DEMO_LOGIN"));
  const sessionCookieSecure = boolString(envValues.get("SESSION_COOKIE_SECURE"));
  const sessionCookieSameSite = boolString(envValues.get("SESSION_COOKIE_SAMESITE"));

  results.push(
    runtimeMode === expectedProfile
      ? pass("render_backend", "render_runtime_mode", "RUNTIME_MODE matches the selected deployment profile.", { envKeys: ["RUNTIME_MODE", "BEYOU_DEPLOY_PROFILE"] })
      : fail(
          "render_backend",
          "render_runtime_mode",
          "RUNTIME_MODE does not match the selected deployment profile.",
          `Set RUNTIME_MODE=${expectedProfile}.`,
          { envKeys: ["RUNTIME_MODE", "BEYOU_DEPLOY_PROFILE"] },
        ),
  );

  results.push(
    allowDemoSeed === demoFlags.seed && allowDemoLogin === demoFlags.login
      ? pass("render_backend", "render_demo_flags", "Demo seed/login flags match the selected deployment profile.", {
          envKeys: ["ALLOW_DEMO_SEED", "ALLOW_DEMO_LOGIN"],
        })
      : fail("render_backend", "render_demo_flags", "Demo seed/login flags do not match the selected deployment profile.", demoFlags.remediation, {
          envKeys: ["ALLOW_DEMO_SEED", "ALLOW_DEMO_LOGIN"],
        }),
  );

  results.push(
    sessionCookieSecure === "true" && sessionCookieSameSite === "none"
      ? pass("render_backend", "render_session_cookie", "Session cookie security metadata matches cross-site HTTPS deployment.", {
          envKeys: ["SESSION_COOKIE_SECURE", "SESSION_COOKIE_SAMESITE"],
        })
      : fail(
          "render_backend",
          "render_session_cookie",
          "Session cookie security metadata is not ready for cross-site HTTPS deployment.",
          "Set SESSION_COOKIE_SECURE=true and SESSION_COOKIE_SAMESITE=none.",
          { envKeys: ["SESSION_COOKIE_SECURE", "SESSION_COOKIE_SAMESITE"] },
        ),
  );

  const expectedFrontend = normalizeUrl(expectedFrontendUrl);
  const originValues = frontendOriginsFrom(envValues);
  const uniqueOrigins = [...new Set(originValues.map((origin) => normalizeUrl(origin)?.href ?? origin.trim()).filter(Boolean))];
  const normalizedOrigins = uniqueOrigins.map((origin) => normalizeUrl(origin)).filter(Boolean);
  const hasWildcard = originValues.some((origin) => origin === "*");
  const hasLocal = normalizedOrigins.some((origin) => isLocalHost(origin.hostname));
  const hasNonHttps = normalizedOrigins.some((origin) => origin.protocol !== "https:");
  const exactMatchCount = expectedFrontend
    ? normalizedOrigins.filter((origin) => origin.href === expectedFrontend.href && origin.protocol === "https:").length
    : 0;

  if (!expectedFrontend) {
    results.push(
      fail(
        "render_backend",
        "render_frontend_origin",
        "BEYOU_EXPECTED_FRONTEND_URL is missing or invalid.",
        "Set BEYOU_EXPECTED_FRONTEND_URL to the deployed HTTPS frontend origin.",
        { envKeys: ["BEYOU_EXPECTED_FRONTEND_URL", "FRONTEND_ORIGIN", "FRONTEND_ORIGINS"] },
      ),
    );
  } else if (expectedProfile === "production_pilot") {
    const safePilotOrigins =
      !hasWildcard && !hasLocal && !hasNonHttps && normalizedOrigins.length === 1 && exactMatchCount === 1;
    results.push(
      safePilotOrigins
        ? pass("render_backend", "render_frontend_origin", "Production pilot has exactly one HTTPS frontend origin matching expected metadata.", {
            envKeys: ["FRONTEND_ORIGIN", "FRONTEND_ORIGINS", "BEYOU_EXPECTED_FRONTEND_URL"],
          })
        : fail(
            "render_backend",
            "render_frontend_origin",
            "Production pilot frontend origin metadata is not exact, singular, and HTTPS.",
            "Set one HTTPS frontend origin that exactly matches BEYOU_EXPECTED_FRONTEND_URL; remove wildcard and local origins.",
            { envKeys: ["FRONTEND_ORIGIN", "FRONTEND_ORIGINS", "BEYOU_EXPECTED_FRONTEND_URL"] },
          ),
    );
  } else {
    const safePublicDemoOrigins = !hasWildcard && !hasLocal && !hasNonHttps && exactMatchCount >= 1;
    results.push(
      safePublicDemoOrigins
        ? pass("render_backend", "render_frontend_origin", "Public demo includes exact HTTPS frontend origin metadata.", {
            envKeys: ["FRONTEND_ORIGIN", "FRONTEND_ORIGINS", "BEYOU_EXPECTED_FRONTEND_URL"],
          })
        : fail(
            "render_backend",
            "render_frontend_origin",
            "Public demo frontend origin metadata is missing the expected HTTPS origin or includes unsafe origins.",
            "Set FRONTEND_ORIGIN or FRONTEND_ORIGINS to include the expected HTTPS frontend origin; remove wildcard and local origins.",
            { envKeys: ["FRONTEND_ORIGIN", "FRONTEND_ORIGINS", "BEYOU_EXPECTED_FRONTEND_URL"] },
          ),
    );
  }

  return results;
}

function sanitizeText(value) {
  let sanitized = String(value ?? "");
  sanitized = sanitized.replace(/\b([A-Z][A-Z0-9_]{2,})=("[^"]*"|'[^']*'|[^\s,;]+)/g, "$1=[redacted]");
  sanitized = sanitized.replace(/https?:\/\/[^\s,;)"']+/g, "[redacted-url]");
  sanitized = sanitized.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]");
  sanitized = sanitized.replace(/__Secure-[^\s,;)"']+/g, "[redacted-cookie]");
  sanitized = sanitized.replace(/__Host-[^\s,;)"']+/g, "[redacted-cookie]");
  sanitized = sanitized.replace(/\bbeyou_session\b/g, "[redacted-cookie]");

  for (const label of SECRET_LABELS) {
    sanitized = sanitized.replace(new RegExp(`\\b${label}\\b`, "gi"), "[redacted-env]");
  }
  sanitized = sanitized.replace(/\beyJ[A-Za-z0-9_-]{10,}\b/g, "[redacted-token]");

  return sanitized;
}

export function formatGuardrailResults(results) {
  const lines = ["Deployment guardrail results:"];

  for (const item of results) {
    lines.push(`[${item.status}] ${sanitizeText(item.category)}/${sanitizeText(item.key)} - ${sanitizeText(item.evidence)}`);
    if (Array.isArray(item.envKeys) && item.envKeys.length > 0) {
      lines.push(`  env: ${item.envKeys.map(sanitizeText).join(", ")}`);
    }
    if (item.command) {
      lines.push(`  command: ${sanitizeText(item.command)}`);
    }
    if (item.remediation) {
      lines.push(`  remediation: ${sanitizeText(item.remediation)}`);
    }
  }

  return lines.join("\n");
}

function validateDeployProfile(profile) {
  return VALID_PROFILES.has(profile)
    ? pass("deployment_profile", "deploy_profile", "BEYOU_DEPLOY_PROFILE is an accepted deployment profile.", {
        envKeys: ["BEYOU_DEPLOY_PROFILE"],
      })
    : fail(
        "deployment_profile",
        "deploy_profile",
        "BEYOU_DEPLOY_PROFILE is missing or unsupported.",
        "Set BEYOU_DEPLOY_PROFILE to public_demo or production_pilot.",
        { envKeys: ["BEYOU_DEPLOY_PROFILE"] },
      );
}

export async function main({ env = process.env, stdout = console.log } = {}) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const frontendRoot = path.resolve(scriptDir, "..");
  const repoRoot = path.resolve(frontendRoot, "..");
  const renderYaml = await readFile(path.join(repoRoot, "render.yaml"), "utf8");
  const vercelJson = await readFile(path.join(frontendRoot, "vercel.json"), "utf8");
  const profile = String(env.BEYOU_DEPLOY_PROFILE ?? "").trim();
  const effectiveProfile = VALID_PROFILES.has(profile) ? profile : "public_demo";

  const results = [
    validateDeployProfile(profile),
    ...validateFrontendApiTarget({
      profile: effectiveProfile,
      apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
      expectedBackendUrl: env.BEYOU_EXPECTED_BACKEND_URL,
    }),
    ...validateDeploymentConfig({
      renderYaml,
      vercelJson,
      vercelRoot: env.BEYOU_VERCEL_ROOT,
    }),
    ...validateRenderEnvExpectations({
      profile: effectiveProfile,
      renderYaml,
      expectedFrontendUrl: env.BEYOU_EXPECTED_FRONTEND_URL,
      operatorEnv: env,
    }),
  ];

  stdout(formatGuardrailResults(results));
  return results.some((item) => item.status === "fail") ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    (exitCode) => {
      process.exitCode = exitCode;
    },
    () => {
      console.error("Deployment guardrail failed unexpectedly.");
      process.exitCode = 1;
    },
  );
}
