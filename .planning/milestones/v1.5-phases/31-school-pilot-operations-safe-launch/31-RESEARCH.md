# Phase 31: School Pilot Operations & Safe Launch - Research

**Researched:** 2026-05-26  
**Domain:** FastAPI/Next.js admin operations, metadata-only school pilot readiness, launch checklist, demo/real data safety  
**Confidence:** HIGH for repository integration points; MEDIUM for package-currentness because backend packages were verified from local environment, not registry.

<user_constraints>
## User Constraints

- Reuse the existing admin operations dashboard (`/api/admin/operations/dashboard` and `/admin/operations`) as the Phase 31 UI anchor.
- Add optional `pilot_launch`, `pilot_data_safety`, and `pilot_handoff` sections to preserve older operations payload compatibility.
- Use status cards, checklists, and buckets that fit the existing rounded Peerlight AI admin style; avoid raw-identifier tables.
- Keep copy support-oriented and operational: "launch readiness" and "support handoff", not surveillance.
- Represent launch requirements as metadata-only checklist items with enum-like keys, labels, `pass`/`warn`/`fail` statuses, evidence, safe remediation, and optional safe commands.
- Derive overall launch status as `ready`, `needs_review`, or `blocked`.
- Include runtime mode, readiness, migration/static checks, origin/cookie contract, seed state, identity readiness, smoke evidence, privacy regression status, baseline content, and school policy setup.
- Do not persist launch approvals or create a new launch workflow.
- Add aggregate counts/statuses only for demo users, demo links, demo content/config rows, demo policy/consent/share state, and broad active real-user counts.
- In `production_pilot`, active demo accounts, active demo links, or active walkthrough/config rows must block or flag launch.
- Never expose raw emails, user IDs, link IDs, content titles, note text, provider subjects, school/class names, free-text reasons, raw claims, raw exports, risk leaderboards, or drilldown links.
- Add safe rollback/handoff guidance to README and operations dashboard: redeploy known-good frontend/backend, revert config, rerun readiness/guardrails/smoke, notify school owner, escalate incidents, avoid destructive database reset and raw export defaults.
- Continue admin-only operations authorization with `require_role(admin)` and `require_permission(... purpose="admin_operations")`.
- Continue recursive metadata sanitization and extend forbidden terms if new pilot metadata could carry unsafe text.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Requirement | Research Support |
|----|-------------|------------------|
| PILOT-01 | Admin operations includes a production pilot launch checklist covering runtime mode, readiness, migrations, origins/cookies, seed state, identity readiness, smoke evidence, and privacy regression status. | Reuse `build_operations_dashboard()`, readiness, deployment guardrails, smoke profiles, auth provider metadata, and new optional `pilot_launch`. |
| PILOT-02 | Admin can verify demo/real data safety through counts/statuses only, and production pilot launch is blocked or flagged when active demo users, links, or walkthrough rows are present unexpectedly. | Existing models expose `is_demo`, `status`, and active/published flags across users, links, content, policy, consent/reminder/share state. |
| PILOT-03 | Pilot operations exposes login, session, readiness, audit, and launch metadata without raw sensitive data, exports, or per-student drilldowns. | Existing operations sanitizer removes forbidden keys/unsafe text; Phase 31 should extend tests and keep all new payloads aggregate-only. |
| PILOT-04 | Pilot rollback and handoff guidance documents safe redeploy, config rollback, readiness recheck, school contact, and incident escalation without destructive reset or raw export defaults. | README already has deployment rollback steps; Phase 31 should extend operations dashboard with metadata-only handoff guidance. |
| PILOT-05 | Baseline content and school policy setup guidance supports real pilot launch without creating public demo accounts, demo links, or walkthrough data in production pilot mode. | Demo seed already no-ops in `production_pilot`; policy/content counts can be derived from existing tables. |

</phase_requirements>

## Summary

Phase 31 should extend the existing admin operations dashboard rather than creating new routes or workflows. The backend already has the right pattern: `GET /api/admin/operations/dashboard` requires admin role and purpose-scoped permission, builds readiness first, and returns a Pydantic response with optional fields for backwards-compatible additions.

The recommended implementation is to add three optional response sections: `pilot_launch`, `pilot_data_safety`, and `pilot_handoff`. These sections should contain only enum-like keys, labels, statuses, counts, evidence strings, remediation strings, and command strings. They must not include raw student data, raw identifiers, raw emails, provider subjects, notes, transcripts, self-check answers, free-text reasons, exports, or drilldown URLs.

## Existing Patterns

### Backend

- `backend/app/services/admin_operations.py` builds the metadata-only dashboard through small summary helpers and returns a single `AdminOperationsDashboardResponse`.
- `backend/app/schemas/admin_operations.py` owns Pydantic schemas and already uses optional Phase 30 fields (`auth_provider`, `identity_mappings`, `session_auth`) for compatibility.
- `backend/app/api/admin_operations.py` already enforces admin role plus purpose-scoped operations permission.
- `backend/app/services/readiness.py` already owns runtime, readiness, migrations, DB, cookie/origin, demo policy, placeholder-secret, and identity configuration checks.
- `backend/app/seeds/demo_seed.py` already refuses demo seeding in `production_pilot`.
- `_safe_metadata()` recursively drops forbidden keys and replaces unsafe strings with `metadata_an_toan`.

### Frontend

- `frontend/lib/admin-operations-api.ts` mirrors the dashboard response and uses optional fields for new contract additions.
- `frontend/app/(authenticated)/admin/operations/page.tsx` already provides reusable local helpers: `Panel`, `MetricCard`, `StatusBadge`, `BucketList`, smoke/guardrail panels, and identity panels.
- Existing operations UI tests assert no token storage, no export/download buttons, no raw content, no raw identifiers, and no drilldown/ranking controls.

### Documentation

- `README.md` already documents runtime modes, deployment guardrails, smoke profiles, and safe rollback. Phase 31 should extend this existing section rather than introducing a separate doc structure.

## Recommended Schema Design

Add these Pydantic models in `backend/app/schemas/admin_operations.py`:

```python
class PilotLaunchChecklistItem(BaseModel):
    key: str
    label: str
    status: ReadinessCheckStatus
    blocking: bool
    evidence: str
    remediation: str | None = None
    command: str | None = None

class PilotLaunchSummary(BaseModel):
    status: Literal["ready", "needs_review", "blocked"]
    generated_at: datetime
    checklist: list[PilotLaunchChecklistItem]

class PilotDataSafetyBucket(BaseModel):
    key: str
    label: str
    count: int
    status: ReadinessCheckStatus
    blocking: bool
    evidence: str
    remediation: str | None = None

class PilotDataSafetySummary(BaseModel):
    status: Literal["safe", "needs_review", "blocked"]
    buckets: list[PilotDataSafetyBucket]

class PilotHandoffItem(BaseModel):
    key: str
    label: str
    status: ReadinessCheckStatus
    guidance: str
    command: str | None = None

class PilotHandoffSummary(BaseModel):
    rollback: list[PilotHandoffItem]
    school_handoff: list[PilotHandoffItem]
    baseline_setup: list[PilotHandoffItem]
```

Add optional fields to `AdminOperationsDashboardResponse`:

```python
pilot_launch: PilotLaunchSummary | None = None
pilot_data_safety: PilotDataSafetySummary | None = None
pilot_handoff: PilotHandoffSummary | None = None
```

Mirror these as optional TypeScript fields in `frontend/lib/admin-operations-api.ts`.

## Launch Checklist Status Semantics

Overall `pilot_launch.status` should be:

- `blocked` if any blocking checklist item has `fail`.
- `needs_review` if there are no blocking failures but any checklist item has `warn`.
- `ready` only when all checklist items pass.

Recommended checklist items:

| Key | Blocking | Evidence Source |
|-----|----------|-----------------|
| `runtime_mode` | yes | `settings.runtime_mode`, `settings.is_production_pilot` |
| `readiness_status` | yes | `readiness_report.status` |
| `migration_status` | yes | Existing readiness check keys related to Alembic/migrations |
| `origin_cookie_contract` | yes | Existing `_exact_credentialed_origin_match()` / `cors_cookie_contract` guardrail |
| `demo_seed_login_policy` | yes | `settings.allow_demo_seed`, `settings.allow_demo_login` |
| `identity_readiness` | yes for production pilot | `auth_provider` summary and readiness identity check |
| `pilot_smoke_profile` | yes | Existing `pilot_smoke` profile status and command |
| `privacy_regression_status` | yes | Static metadata item pointing to safe local regression gates |
| `baseline_content` | warning/fail depending runtime | Non-demo published content/config counts |
| `school_policy_setup` | warning/fail depending runtime | Non-demo school policy defaults and in-app-only channel state |

Evidence strings must use booleans/counts/statuses, not actual origins, emails, IDs, domains, contacts, URLs, or user-provided text.

## Data Safety Counting Strategy

Use aggregate counts only. Do not return record IDs, user IDs, link IDs, emails, titles, names, notes, provider subjects, school/class names, or drilldown URLs.

Recommended buckets:

| Bucket Key | Query Strategy | Production Pilot Status |
|------------|----------------|-------------------------|
| `demo_active_users` | Count `User` where `is_demo=True`, `status=active`. | `fail` if count > 0 in production pilot. |
| `demo_active_links` | Count `StudentAdultLink` where `is_demo=True`, `status=active`. | `fail` if count > 0 in production pilot. |
| `demo_published_self_checks` | Count `SelfCheckTest` where `is_demo=True`, `status=published`, `is_active=True`. | `fail` if count > 0 in production pilot. |
| `demo_published_scenarios` | Count `Scenario` where `is_demo=True`, `status=published`. | `fail` if count > 0 in production pilot. |
| `demo_mood_configs` | Count `MoodCheckInConfig` where `is_demo=True`, `status=published`. | `fail` if count > 0 in production pilot. |
| `demo_policy_defaults` | Count `SchoolPrivacyPolicyDefault` where `is_demo=True`. | `warn` if count > 0 in production pilot. |
| `demo_notification_preferences` | Count `StudentNotificationPreference` where `is_demo=True`. | `warn` if count > 0 in production pilot. |
| `demo_reminder_states` | Count `MoodCheckinReminderState` where `is_demo=True`. | `warn` if count > 0 in production pilot. |
| `demo_mood_shares` | Count `MoodNoteShare` where `is_demo=True`. | `warn` if count > 0 in production pilot. |
| `real_active_students` | Count non-demo active students. | Informational; do not block on zero. |
| `real_active_adults` | Count non-demo active teachers/parents/admins. | Informational; do not block on zero. |

Open assumption: active demo accounts/links/content should fail in production pilot; demo policy/consent/share artifacts can warn unless they are active launch dependencies. Zero real active users should not block launch because launch may precede onboarding.

## Handoff and Baseline Guidance

`pilot_handoff.rollback` should include static safe steps:

- Redeploy last known good Vercel frontend and Render backend.
- Revert deployment environment variables to last known good values.
- Rerun `/health/ready`, `npm --prefix frontend run guard:deploy`, and `npm --prefix frontend run smoke:pilot`.
- Notify the school/pilot owner if real users are affected.
- Escalate incidents through the agreed support path.
- Do not use destructive database reset as default rollback.
- Do not use raw data export as default rollback.

`pilot_handoff.baseline_setup` should include static/status items:

- Non-demo baseline self-check content is published.
- Non-demo baseline scenario content is published.
- Mood/check-in configuration is present.
- School privacy policy defaults are present.
- Reminder channels remain in-app-only.
- Demo seed/login are disabled for real pilot.
- Handoff/contact path is documented as metadata status only, not as raw contact details.

## Concrete Files to Change

| File | Change |
|------|--------|
| `backend/app/schemas/admin_operations.py` | Add pilot schemas and optional response fields. |
| `backend/app/services/admin_operations.py` | Add pilot builders, counting logic, status derivation, safe static guidance. |
| `frontend/lib/admin-operations-api.ts` | Add matching optional TypeScript types and dashboard fields. |
| `frontend/app/(authenticated)/admin/operations/page.tsx` | Render pilot launch, data safety, baseline, and rollback/handoff panels. |
| `README.md` | Extend pilot launch, rollback/handoff, and baseline setup guidance. |
| `backend/tests/test_phase31_school_pilot_operations.py` | New backend test coverage. |
| `frontend/tests/phase31-school-pilot-operations-ui.test.tsx` | New frontend test coverage. |

## Test Strategy

### Backend Tests

Add `backend/tests/test_phase31_school_pilot_operations.py` with focused coverage:

1. Production pilot launch checklist returns `blocked` when readiness or demo policy fails.
2. Launch checklist returns `ready` only when blocking checklist items pass.
3. Demo data safety counts active demo users/links/content/policy rows by aggregate only.
4. Production pilot data safety flags active demo users/links/walkthrough rows as blockers or warnings.
5. Dashboard response excludes raw forbidden data after seeding audit metadata with unsafe keys/values.
6. Admin operations endpoint still requires admin role and purpose-scoped permission.
7. Optional `pilot_*` fields serialize without breaking existing response.
8. Handoff guidance includes safe redeploy/config/readiness/school contact/incident escalation text and excludes destructive reset/raw export defaults.

Suggested targeted gate:

```powershell
Set-Location D:\BeYou\backend
python -m pytest tests/test_phase31_school_pilot_operations.py -q
python -m ruff check .
```

### Frontend Tests

Add `frontend/tests/phase31-school-pilot-operations-ui.test.tsx`:

1. Operations page renders launch status, checklist, data safety buckets, baseline setup, and rollback/handoff guidance.
2. Optional `pilot_*` fields can be absent without UI crash.
3. UI contains no export/download/raw JSON/drilldown/risk leaderboard controls.
4. Rendered text excludes raw identity/provider/secret/student/private-data markers.
5. Pilot smoke and guardrail commands appear as metadata strings only.

Suggested targeted gate:

```powershell
Set-Location D:\BeYou\frontend
npm test -- phase31-school-pilot-operations-ui.test.tsx
npm run lint
```

## Common Pitfalls

1. **Treating demo seed readiness as pilot data safety.** Existing `demo_seed` says demo data is present for public demo readiness; Phase 31 needs the inverse for production pilot. Add a separate `pilot_data_safety` section.
2. **Leaking identifiers through evidence strings.** Use booleans/counts such as `exact_allowed_origin_match=yes`, not actual origins, domains, emails, or IDs.
3. **Adding free-text handoff or incident fields.** Use static guidance only; no write endpoint and no persisted handoff model.
4. **Breaking older dashboard payload tests.** New fields must be optional in backend and frontend, with `?? null` / `?? []` fallbacks.
5. **Turning real-user counts into surveillance.** Count only broad active real-user totals needed for pilot launch readiness; no class/school/risk/student breakdowns.

## Security Domain

| Threat Pattern | Risk | Mitigation |
|----------------|------|------------|
| Admin privacy expansion into surveillance | Information disclosure | Metadata-only aggregate buckets, no drilldowns, no exports. |
| Raw identity claim leakage | Information disclosure | Safe provider metadata validators and operations sanitizer. |
| Demo accounts active in real pilot | Spoofing/elevation risk | Production pilot blockers for demo seed/login and active demo rows. |
| Cookie/CORS misconfiguration | Session risk | Existing origin/cookie readiness and guardrail evidence. |
| Unsafe rollback through destructive reset/export | Tampering/information disclosure | Static rollback guidance forbids destructive reset and raw export defaults. |

## Assumptions Log

| # | Claim | Risk if Wrong |
|---|-------|---------------|
| A1 | Demo accounts/links/content should fail in production pilot; demo policy/consent/share state can warn unless active launch dependencies. | Planner may implement stricter or looser blockers than the school expects. |
| A2 | Zero real active users should not block launch. | If school requires pre-provisioned users before launch, checklist would under-block. |

## Sources

- `.planning/phases/31-school-pilot-operations-safe-launch/31-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `backend/app/services/admin_operations.py`
- `backend/app/schemas/admin_operations.py`
- `backend/app/api/admin_operations.py`
- `backend/app/services/readiness.py`
- `backend/app/core/config.py`
- `backend/app/seeds/demo_seed.py`
- `frontend/lib/admin-operations-api.ts`
- `frontend/app/(authenticated)/admin/operations/page.tsx`
- `README.md`
- Backend Phase 7/11/25/30 tests
- Frontend Phase 11/25/30 operations tests

</research>
