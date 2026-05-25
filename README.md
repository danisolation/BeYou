# BeYou

BeYou is a privacy-first Vietnamese high-school wellbeing web app. It helps students reflect on mood, practice school situations, chat with a supportive bot, prepare trusted-adult support plans, and send in-app SOS signals while keeping adult/admin access privacy-limited.

## Live demo

- Frontend: https://beyou-frontend.vercel.app
- Backend health: https://beyou-backend.onrender.com/health/live

Seeded demo roles are available from the public entry page without manually copying credentials. If manual login is needed, use password `BeYouDemo!2026` with:

| Role | Email |
|---|---|
| Student | `student.demo@beyou.local` |
| Teacher | `teacher.demo@beyou.local` |
| Parent | `parent.demo@beyou.local` |
| Admin | `admin.demo@beyou.local` |

Demo data is fictional and marked in the UI. Do not enter real student data into the demo deployment.

## v1.4 privacy boundaries

BeYou v1.4 adds consent-based reminders and access transparency without expanding raw student data access:

- Students control in-app mood check-in reminders, quiet hours, and pause/resume state.
- Reminder delivery is in-app only. Zalo, SMS, push, and email reminders are deferred until consent governance, provider operations, retries, and message privacy review exist.
- Mood-note sharing is student-granted per check-in and revocable; private notes remain student-only by default.
- Teacher/parent protected support summaries can require a controlled support-oriented reason before content is shown.
- Admins can configure safe default policy controls and inspect operations/readiness as metadata only.

Adult/admin views must stay support-oriented: no raw exports, no per-student risk leaderboards, no private chatbot transcripts, no raw self-check answers, no raw reason text, and no drilldowns that turn support into surveillance.

## Verification

Run the core local gates from the repository root:

```powershell
Set-Location D:\BeYou\backend; python -m pytest; python -m ruff check .
Set-Location D:\BeYou\frontend; npm test; npm run lint; npm run build
Set-Location D:\BeYou; npm --prefix frontend run smoke:production
```

`/health/ready` may report `not_ready` on the public demo while demo seeding is intentionally enabled; the production smoke accepts either HTTP 200 or 503 and records the reported readiness state.

