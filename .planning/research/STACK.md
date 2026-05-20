# Technology Stack

**Project:** BeYou - Tu Tin La Minh  
**Domain:** Web app ho tro suc khoe tinh than, ap luc ban be, chatbot ho tro va SOS noi bo cho hoc sinh THPT Viet Nam  
**Researched:** 2026-05-20  
**Overall confidence:** High cho stack chinh; Medium cho freemodel.dev vi tai lieu public han che.

## Khuyen nghi ngan gon

Dung **FastAPI + PostgreSQL + SQLAlchemy/Alembic** cho backend Python, **Next.js + React + TypeScript + Tailwind + shadcn/ui** cho frontend, xac thuc bang **HttpOnly cookie session**, mat khau hash bang **Argon2**, va tich hop freemodel.dev qua **backend-only provider abstraction**.

Stack nay phu hop vi BeYou la ung dung nhieu vai tro, du lieu nhay cam, can API ro rang, phan quyen chat, de demo MVP nhung van co duong nang cap production.

## Backend

| Technology | Purpose | Why | Confidence |
|---|---|---|---|
| Python 3.12+ | Backend runtime | On dinh, ecosystem tot cho FastAPI/Pydantic/SQLAlchemy | High |
| FastAPI | API framework | API-first, async tot cho chatbot/SOS, OpenAPI tu dong | High |
| Pydantic v2 | Validation/schema | Kiem soat du lieu form/test/chat co cau truc | High |
| Uvicorn | ASGI server | Pho bien cho FastAPI | High |
| httpx | Async HTTP client | Goi freemodel.dev co timeout va error handling ro | High |
| OpenAI-compatible client | Optional LLM client | freemodel.dev cong bo OpenAI-compatible endpoints | Medium |

**Recommendation:** Chon FastAPI thay vi Django lam backend chinh. Django manh ve admin CRUD, nhung BeYou can API-first, chatbot async, portal rieng va authorization domain-specific.

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

**Recommendation:** Dung PostgreSQL ngay tu dau. Khong dung SQLite/MongoDB lam database chinh vi BeYou can transaction, relationship, audit, reporting va authorization query ro rang.

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

**Khong dung:** JWT access token trong `localStorage`; rui ro XSS va kho revoke.

## LLM Integration: freemodel.dev

Tao module backend:

```text
app/services/llm/
  provider.py
  freemodel.py
  safety.py
  prompts.py
```

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

1. Student cannot read another student's assessment.
2. Parent cannot read unlinked student.
3. Teacher cannot read unmanaged class/student.
4. Admin action creates audit log.
5. High-risk chat message triggers escalation response.
6. SOS status flow: sent -> received -> supporting -> completed.
7. API key never appears in frontend bundle or network calls.

## Deployment Recommendation

### Local development

Use Docker Compose:

```text
frontend: Next.js
backend: FastAPI/Uvicorn
db: PostgreSQL
redis: optional only if implementing distributed rate limit/session
```

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
