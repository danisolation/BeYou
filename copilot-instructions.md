<!-- GSD:project-start source:PROJECT.md -->
## Project

**BeYou - Tu Tin La Minh**

BeYou is a web app for Vietnamese high-school students to recognize peer pressure, check mental well-being through short assessments, practice handling school situations, chat with a basic supportive counseling bot, and send SOS alerts when they feel unsafe or at risk.

The product serves students first, with teacher, parent, and admin portals for support, monitoring, content management, and safe escalation. v1 is an MVP demo with complete core flows, but the system must be designed with production-grade privacy and authorization because it may handle real student mental-health data.

**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.

### Constraints

- **Backend stack**: Python backend is required by the user.
- **Scope**: v1 is an MVP demo with complete core flows, not every production extension.
- **Data sensitivity**: Real student psychological data may be entered, so privacy, role authorization, and secure defaults are required from the start.
- **Chatbot safety**: The chatbot must not claim to be a therapist or professional diagnosis tool. High-risk messages must trigger escalation guidance and SOS suggestions.
- **SOS delivery**: v1 SOS is in-app notification and status handling, not external email/Zalo/SMS.
- **Authentication**: v1 uses email/password plus seeded demo users; OAuth/SSO is deferred.
- **UI/UX**: Student-facing screens must feel supportive, calm, mobile-friendly, and avoid heavy medicalized language.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Khuyen nghi ngan gon
## Backend
| Technology | Purpose | Why | Confidence |
|---|---|---|---|
| Python 3.12+ | Backend runtime | On dinh, ecosystem tot cho FastAPI/Pydantic/SQLAlchemy | High |
| FastAPI | API framework | API-first, async tot cho chatbot/SOS, OpenAPI tu dong | High |
| Pydantic v2 | Validation/schema | Kiem soat du lieu form/test/chat co cau truc | High |
| Uvicorn | ASGI server | Pho bien cho FastAPI | High |
| httpx | Async HTTP client | Goi freemodel.dev co timeout va error handling ro | High |
| OpenAI-compatible client | Optional LLM client | freemodel.dev cong bo OpenAI-compatible endpoints | Medium |
## Frontend
| Technology | Purpose | Why | Confidence |
|---|---|---|---|
| Next.js | Web app framework | Routing/protected layouts tot cho 4 portal | High |
| React | UI library | Ecosystem rong, hop voi Next.js | High |
| TypeScript | Type safety | Bat loi role/data contract som | High |
| Tailwind CSS | Styling | Nhanh cho MVP, de tao giao dien calm/mobile-first | High |
| shadcn/ui | UI components | Accessible, de theme, khong khoa vao design system nang | High |
| TanStack Query | Server-state | Dashboard, test history, SOS status can cache/refetch | High |
| react-hook-form + Zod | Forms/validation | Tot cho login, tests, admin content forms | High |
| Playwright + Vitest | E2E/unit tests | Can test full flow theo vai tro va UI logic | High |
## Database, ORM, Migrations
| Technology | Purpose | Why | Confidence |
|---|---|---|---|
| PostgreSQL | Primary database | Du lieu quan he ro: users, links, tests, SOS, audit logs | High |
| SQLAlchemy 2.x | ORM | Mature, kiem soat query tot, hop domain model phuc tap | High |
| Alembic | DB migrations | Chuan migration cho SQLAlchemy | High |
| psycopg 3 | PostgreSQL driver | Driver hien dai, ho tro SQLAlchemy | High |
| Redis | Optional cache/rate limit | Chi can khi scale hoac rate-limit phan tan | Medium |
## Auth, Session, Authorization
| Control | Recommendation | Why | Confidence |
|---|---|---|---|
| Login | Email/password + seeded demo users | Dung scope v1, khong can OAuth/SSO | High |
| Password hashing | Argon2 | Lua chon manh cho password hashing | High |
| Session | Opaque session ID trong HttpOnly, Secure, SameSite=Lax cookie | Tranh JWT/localStorage, de revoke | High |
| Session storage | Postgres sessions table cho v1 | Don gian, audit duoc, khong them infra som | High |
| CSRF | CSRF token cho mutating requests | Cookie auth can CSRF protection | High |
| RBAC | Backend-enforced role + relationship checks | Teacher/parent chi xem hoc sinh duoc link/quan ly | High |
| Audit log | Log access du lieu nhay cam, SOS update, admin change | Can cho du lieu tam ly hoc sinh | High |
## LLM Integration: freemodel.dev
| Decision | Recommendation | Why | Confidence |
|---|---|---|---|
| API access | Backend only | Khong expose API key ra frontend | High |
| Provider abstraction | `LLMProvider.generate_support_reply()` | Cho phep doi provider sau nay | High |
| Protocol | OpenAI-compatible chat/responses endpoint | freemodel.dev public site goi y OpenAI-compatible API | Medium |
| Client | `httpx` wrapper hoac OpenAI SDK | `httpx` kiem soat timeout/error tot; SDK nhanh hon | Medium |
| Storage | Khong luu raw chat mac dinh; luu metadata/risk flags/summary can thiet | Giam rui ro du lieu nhay cam | High |
| Safety | Pre-check + post-check Vietnamese risk lexicon/rules | Khong phu thuoc hoan toan vao LLM | High |
| Prompt | Bot khong tu nhan la chuyen gia/tri lieu; luon khuyen trusted adult khi co rui ro | Dung scope an toan | High |
### Guardrails bat buoc
- Khong de LLM tu dong gui SOS; chi goi y va yeu cau hoc sinh xac nhan.
- Neu phat hien self-harm, abuse, violence, coercion: tra loi ngan gon, ho tro, khuyen lien he nguoi lon tin cay, hien thi nut SOS.
- Khong chan doan benh.
- Khong dua huong dan tu hai, bao luc, ne tranh giam sat.
- Khong gui du lieu teacher/parent/admin vao prompt.
- Redact/minimize PII truoc khi goi LLM neu co the.
## Security & Privacy Controls
| Area | Recommendation | Why | Confidence |
|---|---|---|---|
| Transport | HTTPS only, HSTS production | Bao ve cookie va du lieu tam ly | High |
| Secrets | `.env` local, secret manager production | Khong commit API keys | High |
| CORS | Allowlist exact frontend origin | Khong dung `*` voi credentials | High |
| Cookies | HttpOnly, Secure, SameSite=Lax, idle timeout | Giam session theft | High |
| Rate limit | Login, chat, SOS endpoints | Chong brute force va abuse LLM cost | High |
| Audit | Append-only audit events | Quan trong cho access du lieu nhay cam | High |
| Authorization tests | Test role + relationship | Loi phan quyen la rui ro lon nhat | High |
| Data minimization | Teacher/parent chi thay du lieu can thiet | Bao ve quyen rieng tu hoc sinh | High |
| Logs | Khong log password, token, raw chat, full assessment answers | Tranh ro ri qua logs | High |
## Testing Stack
### Backend
- pytest, pytest-asyncio
- httpx for API and external LLM mocks
- Ruff for lint/format
- Factory helpers for seeded role data
### Frontend
- Vitest for unit/component tests
- Playwright for end-to-end role flows
- ESLint/Prettier for code quality
### Must-have test scenarios
## Deployment Recommendation
### Local development
### Production MVP
- **Frontend:** Vercel, Netlify, or same platform as backend.
- **Backend:** Containerized FastAPI service.
- **Database:** Managed PostgreSQL with encrypted backups.
- **Routing:** Same-site domain preferred, e.g. frontend at `/` and API at `/api`, to simplify secure cookie auth.
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|---|---|---|---|
| Backend framework | FastAPI | Django + DRF | Nang hon cho API/chatbot async; Django admin khong phu hop du lieu tam ly hoc sinh |
| Frontend | Next.js | Vite React SPA | Next tot hon cho protected layouts va portal routing |
| Database | PostgreSQL | MongoDB | Relationship/authorization/reporting phu hop relational DB hon |
| Auth storage | HttpOnly opaque session | localStorage JWT | localStorage de bi danh cap qua XSS, kho revoke |
| LLM framework | Thin provider abstraction | LangChain/LlamaIndex | Qua nang cho v1, tang privacy surface |
| Notifications | In-app SOS events | Zalo/SMS/push | Ngoai scope v1, tang compliance/delivery complexity |
| Jobs | FastAPI BackgroundTasks/simple DB events | Celery ngay tu dau | Them infra som khi chua can |
## Sources
- FastAPI docs: https://fastapi.tiangolo.com/
- Pydantic docs: https://docs.pydantic.dev/latest/
- SQLAlchemy docs: https://docs.sqlalchemy.org/en/20/
- Alembic docs: https://alembic.sqlalchemy.org/en/latest/
- Next.js docs: https://nextjs.org/docs
- React docs: https://react.dev/
- Tailwind CSS docs: https://tailwindcss.com/docs
- shadcn/ui docs: https://ui.shadcn.com/docs
- PostgreSQL docs: https://www.postgresql.org/
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- freemodel.dev public site: https://freemodel.dev/
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.github/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
