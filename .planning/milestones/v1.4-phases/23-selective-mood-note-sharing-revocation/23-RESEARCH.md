# Phase 23: Selective Mood-Note Sharing & Revocation - Research

**Researched:** 2026-05-22  
**Domain:** FastAPI/SQLAlchemy/Next.js selective consent grants for private mood-note access  
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Sharing starts from the student's own mood history, only for check-ins that include a private note or an explicitly entered student summary.
- Default share scope is private-note sharing; optional student-authored summary is supported without auto-generating clinical interpretations.
- Students choose one or more currently linked adults; stale/revoked relationships are rejected server-side.
- Re-sharing an already-active check-in/adult pair must be idempotent or safely update scope/summary.
- Student UI must preview selected adults, exact content scope, what remains private, and revocation path.
- Copy stays Vietnamese, supportive, consent-first, and non-clinical.
- Adult reads require role check, active relationship, and active `MoodNoteShare`.
- Revoked shares disappear from adult read responses immediately.
- Audit metadata must never include raw note text, summary text, free-text reasons, or contact identifiers.
- This phase must not create SOS alerts, adult notifications, external messages, risk scores, or background delivery.
- Backend tests must prove revoked adults and unrelated adults cannot read content.

### the agent's Discretion

- Exact component factoring, endpoint naming, form layout, loading states, and whether active shares are shown inline per check-in or as a nested card are delegated to the agent, provided the privacy and confirmation decisions above hold.

### Deferred Ideas (OUT OF SCOPE)

- Reason-for-access prompts before adult reads are Phase 24.
- Admin policy controls and operations buckets for share/read/revoke are Phase 25.
- External notification to adults when a note is shared is out of scope for v1.4.
- Full access timeline or counselor handoff remains future work.

</user_constraints>

## Summary

Phase 23 should reuse the existing `MoodNoteShare` table/model rather than add a new persistence model. The existing model already stores `mood_checkin_id`, `student_id`, `adult_id`, `relationship_type_snapshot`, `share_scope`, optional `student_summary`, demo flag, created timestamp, and revocation metadata. [VERIFIED: codebase]

Recommended implementation is a small backend service around mood-note share grants, plus schema extensions to student mood-history and adult support-summary responses. Student mutations should live under the existing `/api/student/mood-check-ins` router prefix or a closely related router mounted without double `/api`; adult reads should extend existing teacher/parent support-summary endpoints. [VERIFIED: codebase]

Primary risk is accidental privacy expansion: `authorization.py` currently allows linked adults to pass `shared_mood_note` permission based on active relationship alone, so Phase 23 service code must add a second explicit `MoodNoteShare.revoked_at IS NULL` grant check before returning raw note/summary content. [VERIFIED: codebase]

**Primary recommendation:** Implement a dedicated `mood_note_shares` service that enforces student ownership, active linked-adult validation, active share grant checks, immediate revocation, and metadata-only audit before extending UI.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHARE-01 | Student can share a specific existing private mood note or student-authored summary with selected currently linked adults. | Reuse `MoodNoteShare`; validate `MoodCheckIn.student_id == student.id`; reuse support-plan linked-adult validation pattern. |
| SHARE-02 | Student must preview and confirm exactly what will be shared, who will see it, and what remains private. | UI-SPEC defines per-card preview copy, adult names, scope, privacy reminders, and confirmation flow. |
| SHARE-03 | Student can revoke a shared mood note per adult or all selected adults. | Set `revoked_at` and `revoked_by_id`; filter adult reads by active grants only. |
| SHARE-04 | Teacher or parent can see only active mood-note shares explicitly granted to them. | Add explicit active relationship + active `MoodNoteShare` query in adult service. |
| SHARE-05 | Share/read/revoke audit metadata excludes raw private note and summary text. | Existing audit service rejects forbidden keys including `private_note`, `shared_note_text`, and `student_summary`. |

</phase_requirements>

## Project Constraints

- Backend is Python/FastAPI with PostgreSQL, SQLAlchemy, Alembic, cookie sessions, role/relationship authorization, metadata-only audit, and readiness checks. [VERIFIED: copilot-instructions.md]
- Frontend is Next.js/TypeScript with cookie-authenticated API calls and no browser token storage. [VERIFIED: copilot-instructions.md]
- Backend routers are mounted under `/api`; sub-routers must not double-prefix `/api`. [VERIFIED: copilot-instructions.md]
- Student-facing UI must be supportive, calm, mobile-friendly, and avoid heavy medicalized language. [VERIFIED: copilot-instructions.md]
- Operations/audit surfaces must stay metadata-only and avoid raw exports, risk leaderboards, and per-student risk drilldowns. [VERIFIED: copilot-instructions.md]

## Standard Stack

### Core

| Library / Module | Version | Purpose | Why Standard |
|---|---:|---|---|
| FastAPI | project dependency | Backend API routers and dependency injection | Existing backend framework. [VERIFIED: pyproject.toml] |
| SQLAlchemy | project dependency | ORM queries for `MoodCheckIn`, `MoodNoteShare`, `StudentAdultLink` | Existing data access layer. [VERIFIED: pyproject.toml] |
| Pydantic | project dependency | Request/response schemas | Existing API schema layer. [VERIFIED: pyproject.toml] |
| Next.js / React / TypeScript | package uses `latest` | Student and adult UI | Existing frontend stack. [VERIFIED: package.json] |
| Vitest + Testing Library | package uses `latest` | Frontend regression tests | Existing frontend test stack. [VERIFIED: package.json] |
| pytest | dev dependency | Backend API/service tests | Existing backend test stack. [VERIFIED: pyproject.toml] |

### Supporting

| Existing Module | Purpose | When to Use |
|---|---|---|
| `backend/app/services/audit.py` | Metadata-only audit event creation and forbidden-key validation | All share/read/revoke audit events. [VERIFIED: codebase] |
| `backend/app/core/sessions.py` | Cookie auth and same-site mutation guard | Student share/revoke mutations. [VERIFIED: codebase] |
| `backend/app/core/authorization.py` | Role and relationship permission checks | Student ownership and adult relationship checks. [VERIFIED: codebase] |
| `backend/app/services/support_plan.py` | Active linked-adult lookup/validation pattern | Reuse/extract for selecting current adults. [VERIFIED: codebase] |

## Architecture Patterns

### Recommended Backend Shape

```text
backend/app/
├── api/student_mood_checkins.py
├── api/adult_summaries.py
├── schemas/mood_note_shares.py
├── services/mood_note_shares.py
├── services/mood_checkins.py
├── services/adult_summaries.py
└── tests/test_phase23_mood_note_shares.py
```

### Recommended Frontend Shape

```text
frontend/
├── lib/mood-checkin-api.ts
├── lib/adult-summary-api.ts
├── app/(authenticated)/student/mood-check-ins/history/page.tsx
├── app/(authenticated)/teacher/students/[studentId]/support-summary/page.tsx
├── app/(authenticated)/parent/students/[studentId]/support-summary/page.tsx
└── tests/phase23-mood-note-sharing-ui.test.tsx
```

### Pattern 1: Student-owned mutation

Require cookie auth, student role, privacy acknowledgement, same-site mutation protection, and check-in ownership before creating/revoking grants. [VERIFIED: codebase]

Recommended endpoints:

```text
GET    /api/student/mood-check-ins/share-options
POST   /api/student/mood-check-ins/{checkin_id}/shares
DELETE /api/student/mood-check-ins/{checkin_id}/shares/{adult_id}
DELETE /api/student/mood-check-ins/{checkin_id}/shares
```

Avoid double `/api` in router paths because `main.py` already mounts `student_mood_checkins.router` at `/api/student/mood-check-ins`. [VERIFIED: codebase]

### Pattern 2: Active grant read boundary

Adult support summary may include shared notes only when all are true: adult role matches route, student exists, active relationship exists, and active `MoodNoteShare` exists for that adult/check-in. [VERIFIED: codebase]

Adult `require_permission(... resource_type="shared_mood_note")` is insufficient alone because relationship authorization currently allows the resource type without checking a grant row. [VERIFIED: codebase]

### Pattern 3: Idempotent active grant upsert

Use the existing partial unique index on active `(mood_checkin_id, adult_id)` grants; on re-share, update `share_scope`/`student_summary` safely rather than inserting duplicate active rows. [VERIFIED: codebase]

## Implementation Approach

1. Add schemas for linked adult option without email/contact identifier; active share state in mood history; share request with `adult_ids`, `share_scope`, optional `student_summary`; revoke response; and adult shared note item.
2. Add `services/mood_note_shares.py` to load and validate owned check-ins, require private note for `private_note` scope, require non-empty normalized `student_summary` for summary scope, validate selected adult IDs against active `StudentAdultLink`, create/update active grants, revoke per adult/all by setting `revoked_at` and `revoked_by_id`, list active shares for student history, and list active shared notes for adult support summary.
3. Extend student history response with `shareable`, `active_shares`, and available linked adults either globally or via separate endpoint.
4. Extend adult support summary response with `shared_mood_notes: AdultSharedMoodNote[]`, while keeping `mood_summary` aggregate-only and visually separate.
5. Add UI controls per approved UI-SPEC: `MoodShareControls`, `SharePreviewPanel`, `ActiveShareList`, `RevokeShareConfirmation`, and `AdultSharedMoodNotesCard`.

## Files Likely to Modify

### Backend

- `backend/app/schemas/mood_checkins.py` — extend history item with share state. [VERIFIED: codebase]
- `backend/app/schemas/adult_summaries.py` — add `shared_mood_notes`. [VERIFIED: codebase]
- `backend/app/schemas/mood_note_shares.py` — new schemas. [ASSUMED]
- `backend/app/services/mood_note_shares.py` — new grant lifecycle service. [ASSUMED]
- `backend/app/services/mood_checkins.py` — join/load active share state. [VERIFIED: codebase]
- `backend/app/services/adult_summaries.py` — include active shared notes and read audit. [VERIFIED: codebase]
- `backend/app/api/student_mood_checkins.py` — add share/revoke endpoints. [VERIFIED: codebase]
- `backend/app/api/adult_summaries.py` — keep same support-summary endpoints, response expands. [VERIFIED: codebase]
- `backend/tests/test_phase23_mood_note_shares.py` — new backend regression tests. [ASSUMED]

### Frontend

- `frontend/lib/mood-checkin-api.ts` — add share types and API functions. [VERIFIED: codebase]
- `frontend/lib/adult-summary-api.ts` — add shared-note response types. [VERIFIED: codebase]
- `frontend/app/(authenticated)/student/mood-check-ins/history/page.tsx` — add share/revoke controls. [VERIFIED: codebase]
- `frontend/app/(authenticated)/teacher/students/[studentId]/support-summary/page.tsx` — add shared notes card. [VERIFIED: codebase]
- `frontend/app/(authenticated)/parent/students/[studentId]/support-summary/page.tsx` — reuses teacher detail component. [VERIFIED: codebase]
- `frontend/tests/phase23-mood-note-sharing-ui.test.tsx` — new UI regression tests. [ASSUMED]

## Data / Authorization / Audit Constraints

| Constraint | Required Implementation |
|---|---|
| Student ownership | Query `MoodCheckIn` by `id` and `student_id == current_user.id`. [VERIFIED: codebase] |
| Active relationship | Validate selected adult IDs against active `StudentAdultLink`. [VERIFIED: codebase] |
| Active share | Adult content query must filter `MoodNoteShare.adult_id`, `student_id`, and `revoked_at IS NULL`. [VERIFIED: codebase] |
| Revocation | Set `revoked_at` and `revoked_by_id`; do not delete rows so metadata history remains available. [VERIFIED: codebase] |
| Audit | Use `record_audit_event`; metadata keys must not include forbidden raw-content keys. [VERIFIED: codebase] |
| No notifications/SOS | Do not touch `SosAlert`, `InAppNotification`, external channels, workers, or risk scoring. [VERIFIED: REQUIREMENTS.md] |

Safe audit metadata examples:

```json
{
  "student_id": "...",
  "adult_id": "...",
  "share_id": "...",
  "mood_checkin_id": "...",
  "share_scope": "private_note",
  "relationship_type": "teacher",
  "has_private_note": true,
  "has_student_summary": false,
  "decision": "student_consented_share_metadata_only"
}
```

Do not use keys such as `private_note`, `student_summary`, `shared_note_text`, or raw content values because `audit.py` rejects these keys. [VERIFIED: codebase]

## UI Integration Notes

- Student share controls belong inside each shareable mood-history card, near the private-note panel. [VERIFIED: UI-SPEC]
- Share CTA must appear only when a check-in has `private_note` or a student-authored summary option. [VERIFIED: UI-SPEC]
- Adult selection must show display name and relationship label, not email/contact identifiers. [VERIFIED: UI-SPEC]
- Preview must name adults, content scope, what remains private, revocation path, and no external notifications/SOS/risk score. [VERIFIED: UI-SPEC]
- Adult support summary order must be privacy boundary, support plan, shared mood notes, then aggregate mood trend. [VERIFIED: UI-SPEC]
- Parent route imports and reuses teacher `AdultSupportSummaryDetail`, so shared-note card should be added once in the shared component. [VERIFIED: codebase]

## Do Not Hand-Roll

| Problem | Do Not Build | Use Instead |
|---|---|---|
| Authorization | Frontend-only hiding or route-only checks | Backend `require_role`, `require_permission`, active relationship query, and explicit active share query. [VERIFIED: codebase] |
| Audit sanitization | Custom string filtering per route | Existing `record_audit_event` forbidden-key validator. [VERIFIED: codebase] |
| Adult selection | New relationship model | Existing `StudentAdultLink` active-link pattern. [VERIFIED: codebase] |
| Revocation history | Hard delete active shares | Existing `revoked_at`/`revoked_by_id` columns. [VERIFIED: codebase] |

## Common Pitfalls

### Pitfall 1: Relationship-only adult access

**What goes wrong:** A linked adult can see raw shared-note content without an active grant.  
**Why:** `authorization.py` recognizes `shared_mood_note` for active linked adults, but grant enforcement must happen in the service query. [VERIFIED: codebase]  
**Avoid:** Require both relationship and `MoodNoteShare.revoked_at IS NULL`.

### Pitfall 2: Audit metadata key rejection

**What goes wrong:** Audit save raises `HTTPException` because metadata includes forbidden keys like `student_summary`.  
**Avoid:** Use `has_student_summary`, `share_scope`, counts, IDs, and status only. [VERIFIED: codebase]

### Pitfall 3: Double `/api` route prefix

**What goes wrong:** New route becomes `/api/api/...`.  
**Avoid:** Add child paths relative to existing router prefixes. [VERIFIED: main.py]

### Pitfall 4: UI mentions notifications or alerts

**What goes wrong:** Copy implies adults are notified or SOS is automatic.  
**Avoid:** Use approved Vietnamese UI-SPEC text only. [VERIFIED: UI-SPEC]

## Test Plan

### Backend tests

Add `backend/tests/test_phase23_mood_note_shares.py`.

Required cases:

1. Student shares own private-note check-in with active linked teacher and parent.
2. Student cannot share a check-in without private note when scope is `private_note`.
3. Student summary scope requires non-empty student-authored summary.
4. Stale/revoked/unlinked adult selection returns 422/403.
5. Re-share same check-in/adult updates active grant idempotently.
6. Adult support summary includes shared note only for granted adult.
7. Relationship-only adult cannot read unshared private note.
8. Revoked share disappears immediately from adult response.
9. Revoked adult cannot read content; unrelated linked adult cannot read unshared note.
10. Share/read/revoke audit excludes raw note and summary text.
11. Share/revoke does not create SOS alert, notification, external delivery, or risk score.

### Frontend tests

Add `frontend/tests/phase23-mood-note-sharing-ui.test.tsx`.

Required cases:

1. Student history renders share CTA only on shareable card.
2. Adult selection shows names/relationship labels, not emails.
3. Preview shows adult names, content scope, what remains private, revocation path.
4. Share success shows active share state in same card.
5. Revocation requires second confirmation and names affected adult.
6. Adult support summary renders separate shared-note card before aggregate trend.
7. Revoked/empty shared-note state uses approved empty copy.
8. UI text avoids forbidden words/copy from UI-SPEC.

## Verification Commands

```bash
cd D:\BeYou\backend
python -m pytest tests/test_phase23_mood_note_shares.py -q
python -m pytest tests/test_phase13_mood_checkins.py tests/test_phase14_adult_support_summaries.py tests/test_phase21_privacy_controls.py -q
python -m ruff check app tests
```

```bash
cd D:\BeYou\frontend
npm test -- --run tests/phase23-mood-note-sharing-ui.test.tsx
npm run lint
npm run build
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---:|---|---|
| Python | Backend tests | yes | 3.12.7 | - |
| pytest | Backend tests | yes | 8.4.2 | - |
| Node.js | Frontend tests/build | yes | v22.17.0 | - |
| npm | Frontend scripts | yes | 10.9.2 | - |
| git | Workflow | yes | 2.52.0.windows.1 | - |

## Validation Architecture

Skipped because `.planning/config.json` has `workflow.nyquist_validation: false`. [VERIFIED: config.json]

## Security Domain

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | yes | Existing cookie session auth. [VERIFIED: codebase] |
| V3 Session Management | yes | HttpOnly session cookie and server-side session lookup. [VERIFIED: codebase] |
| V4 Access Control | yes | Role + relationship + active grant checks. [VERIFIED: codebase] |
| V5 Input Validation | yes | Pydantic schemas and server-side validation. [VERIFIED: codebase] |
| V6 Cryptography | no new crypto | Do not add custom cryptography. [ASSUMED] |

## Sources

### Primary

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/phases/23-selective-mood-note-sharing-revocation/23-CONTEXT.md`
- `.planning/phases/23-selective-mood-note-sharing-revocation/23-UI-SPEC.md`
- `copilot-instructions.md`
- `backend/app/db/models.py`
- `backend/app/core/authorization.py`
- `backend/app/core/sessions.py`
- `backend/app/services/audit.py`
- `backend/app/services/mood_checkins.py`
- `backend/app/services/adult_summaries.py`
- `backend/app/services/support_plan.py`
- `backend/app/api/student_mood_checkins.py`
- `backend/app/api/adult_summaries.py`
- `frontend/app/(authenticated)/student/mood-check-ins/history/page.tsx`
- `frontend/app/(authenticated)/teacher/students/[studentId]/support-summary/page.tsx`
- `frontend/app/(authenticated)/parent/students/[studentId]/support-summary/page.tsx`
- `frontend/lib/mood-checkin-api.ts`
- `frontend/lib/adult-summary-api.ts`

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — verified from project files.
- Architecture: HIGH — based on existing routers/services/models.
- Pitfalls: HIGH — based on concrete authorization, audit, and UI constraints.
- Open questions: LOW/NONE — no blocking design ambiguity found.

**Research date:** 2026-05-22  
**Valid until:** 2026-06-21
