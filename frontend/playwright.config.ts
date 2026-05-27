import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command:
        "powershell -NoProfile -Command \"cd ..\\backend; docker compose up -d postgres; python -m alembic upgrade head; $env:ALLOW_DEMO_SEED='true'; $env:FRONTEND_ORIGIN='http://127.0.0.1:3000'; python -m app.seeds.demo_seed; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000\"",
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command:
        "powershell -NoProfile -Command \"$env:NEXT_PUBLIC_API_BASE_URL='http://127.0.0.1:8000'; npx next dev --hostname 127.0.0.1 --port 3000\"",
      url: "http://127.0.0.1:3000/login",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
