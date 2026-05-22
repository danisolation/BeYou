const frontendUrl = (process.env.BEYOU_FRONTEND_URL ?? "https://beyou-frontend.vercel.app").replace(/\/$/, "");
const backendUrl = (
  process.env.BEYOU_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://beyou-backend.onrender.com"
).replace(/\/$/, "");
const demoPassword = process.env.BEYOU_DEMO_PASSWORD ?? "BeYouDemo!2026";

const accounts = [
  { role: "student", email: "student.demo@beyou.local", route: "/student" },
  { role: "teacher", email: "teacher.demo@beyou.local", route: "/teacher" },
  { role: "parent", email: "parent.demo@beyou.local", route: "/parent" },
  { role: "admin", email: "admin.demo@beyou.local", route: "/admin" },
];

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const marker = ok ? "PASS" : "FAIL";
  console.log(`${marker} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function assertFetch(name, url, init, check) {
  const response = await fetch(url, init);
  const detail = await check(response);
  record(name, true, detail);
  return response;
}

function cookieFrom(response) {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const [cookie] = setCookie.split(";");
  return cookie;
}

async function main() {
  await assertFetch("frontend reachable", frontendUrl, {}, async (response) => {
    if (!response.ok) throw new Error(`frontend returned ${response.status}`);
    return frontendUrl;
  });

  await assertFetch("backend live health", `${backendUrl}/health/live`, {}, async (response) => {
    if (!response.ok) throw new Error(`/health/live returned ${response.status}`);
    return backendUrl;
  });

  await assertFetch("backend readiness health", `${backendUrl}/health/ready`, {}, async (response) => {
    if (![200, 503].includes(response.status)) throw new Error(`/health/ready returned ${response.status}`);
    const payload = await response.json();
    return `reported ${payload.status ?? "unknown"} with HTTP ${response.status}`;
  });

  await assertFetch(
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
      if (allowOrigin !== frontendUrl) throw new Error(`unexpected allow-origin ${allowOrigin}`);
      if (allowCredentials !== "true") throw new Error("credentials header missing");
      return "origin and credentials allowed";
    },
  );

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
    record(`${account.role} demo login`, true, "session cookie issued");

    const me = await fetch(`${backendUrl}/api/auth/me`, {
      headers: {
        Cookie: sessionCookie,
        Origin: frontendUrl,
      },
    });
    if (!me.ok) throw new Error(`${account.role} /api/auth/me returned ${me.status}`);
    const payload = await me.json();
    if (payload.role !== account.role) throw new Error(`${account.role} session returned role ${payload.role}`);
    record(`${account.role} session role`, true, payload.dashboard_route ?? account.route);

    const dashboard = await fetch(`${frontendUrl}${account.route}`);
    if (!dashboard.ok) throw new Error(`${account.role} dashboard route returned ${dashboard.status}`);
    record(`${account.role} dashboard route`, true, account.route);
  }
}

main()
  .then(() => {
    console.log(`SMOKE_PASS ${results.filter((result) => result.ok).length}/${results.length}`);
  })
  .catch((error) => {
    record("production smoke", false, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
