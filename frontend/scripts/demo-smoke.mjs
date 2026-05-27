import { fileURLToPath } from "node:url";

import {
  checkBackendLive,
  checkCredentialedCorsPreflight,
  checkFrontendReachable,
  checkReadiness,
  cookieFrom,
  normalizeUrl,
  record,
} from "./smoke-utils.mjs";

const accounts = [
  { role: "student", email: "student.demo@beyou.local", route: "/student" },
  { role: "teacher", email: "teacher.demo@beyou.local", route: "/teacher" },
  { role: "parent", email: "parent.demo@beyou.local", route: "/parent" },
  { role: "admin", email: "admin.demo@beyou.local", route: "/admin" },
];

function smokeUrl(value, fallback, label) {
  const normalized = normalizeUrl(value ?? fallback);
  if (!normalized) throw new Error(`${label} smoke URL is invalid`);
  return normalized.href;
}

export async function main({ env = process.env } = {}) {
  const frontendUrl = smokeUrl(env.BEYOU_FRONTEND_URL, "https://beyou-frontend.vercel.app", "frontend");
  const backendUrl = smokeUrl(
    env.BEYOU_BACKEND_URL ?? env.NEXT_PUBLIC_API_BASE_URL,
    "https://beyou-backend.onrender.com",
    "backend",
  );
  const demoPassword = env.BEYOU_DEMO_PASSWORD ?? "BeYouDemo!2026";
  const results = [];

  await checkFrontendReachable(results, frontendUrl);
  await checkBackendLive(results, backendUrl);
  await checkReadiness(results, backendUrl, "public_demo");
  await checkCredentialedCorsPreflight(results, frontendUrl, backendUrl);

  for (const account of accounts) {
    const login = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: frontendUrl,
      },
      body: JSON.stringify({ email: account.email, password: demoPassword }),
    });
    if (!login.ok) throw new Error(`${account.role} login returned ${login.status}`);
    const sessionCookie = cookieFrom(login);
    if (!sessionCookie) throw new Error(`${account.role} login did not issue a session cookie`);
    record(results, `${account.role} demo login`, true, "session cookie issued");

    const me = await fetch(`${backendUrl}/api/auth/me`, {
      headers: {
        Cookie: sessionCookie,
        Origin: frontendUrl,
      },
    });
    if (!me.ok) throw new Error(`${account.role} /api/auth/me returned ${me.status}`);
    const payload = await me.json();
    if (payload.role !== account.role) throw new Error(`${account.role} session returned role ${payload.role}`);
    record(results, `${account.role} session role`, true, payload.dashboard_route ?? account.route);

    const dashboard = await fetch(`${frontendUrl}${account.route}`);
    if (!dashboard.ok) throw new Error(`${account.role} dashboard route returned ${dashboard.status}`);
    record(results, `${account.role} dashboard route`, true, account.route);
  }

  console.log(`DEMO_SMOKE_PASS ${results.filter((result) => result.ok).length}/${results.length}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    const results = [];
    record(results, "demo smoke", false, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
