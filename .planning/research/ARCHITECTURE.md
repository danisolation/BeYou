# Architecture: BeYou v1.2 Trusted Adult Plan & Mood Check-ins

**Milestone:** v1.2 Trusted Adult Plan & Mood Check-ins  
**Researched:** 2026-05-22

## Summary

The v1.2 architecture should be additive. It should introduce support-plan and mood-check-in domain models, student APIs/UI, adult summary APIs/UI, and admin configuration, while reusing existing authorization, audit, and authenticated layout patterns.

## Domain Model

Recommended new or extended entities:

- `StudentSupportPlan`
  - `student_id`
  - lifecycle/status fields
  - preferred support style, contact preferences, "what helps", "what does not help"
  - student-visible/shareable note fields only
  - timestamps
- `StudentSupportPlanAdult`
  - support plan to linked adult mapping
  - recipient role and relationship identifiers
  - share flags or selected role in support circle
- `MoodCheckInPrompt`
  - admin-managed prompt text/options/guidance
  - lifecycle status and sort order
- `MoodCheckIn`
  - student, prompt, mood value/tags, energy/stress/context fields
  - optional private note
  - derived non-clinical summary/trend fields
  - timestamps

## Backend APIs, Services, and Schemas

Suggested routers:

- `student_support.py`
  - `GET/PUT /api/student/support-plan`
  - `GET /api/student/support-plan/adults`
- `student_mood.py`
  - `GET /api/student/mood-check-ins/prompts`
  - `POST /api/student/mood-check-ins`
  - `GET /api/student/mood-check-ins/history`
- `teacher_support.py` / `parent_support.py`
  - extend linked-student detail/support endpoints with support plan and mood trend summaries.
- `admin_wellbeing.py` or existing admin content router
  - CRUD/lifecycle for mood prompts and support guidance.

Suggested services:

- Support plan service for student ownership, linked-adult validation, and shareable summary generation.
- Mood check-in service for submission validation, trend summary generation, and high-concern guidance.
- Adult summary service that strips raw notes and exposes only safe summaries.

## Authorization and Audit

- Student owns support plans and mood check-ins.
- Adults can only access summaries for linked/managed students.
- Admin can configure prompts/guidance but cannot read raw individual mood notes.
- Wrong-role/unlinked access should return existing denial behavior without leaking student existence.
- Audit events should include metadata such as action type, actor role/id, target type/id, status, and safe counts; never raw notes or raw answers.

## Frontend Surfaces

- Student:
  - support plan page/card;
  - mood check-in page/card;
  - mood history/trends page or dashboard section.
- Teacher/parent:
  - support summary card on linked student support/detail pages;
  - role-specific supportive action copy.
- Admin:
  - mood prompt/guidance management area;
  - validation and preview of student-facing copy.
- Operations:
  - minimal metadata audit entries only; no raw drilldowns.

## Data Flows

1. Student creates support plan -> backend validates linked adults -> stores shareable preferences -> emits metadata audit -> adult summary can include selected support preferences.
2. Student submits mood check-in -> backend stores structured mood and optional private note -> derives safe trend summary -> emits metadata audit -> student can view full history.
3. Adult views linked student support summary -> backend checks relationship -> returns support preferences and trend labels only -> emits metadata audit if existing patterns require.
4. Admin updates mood prompt/guidance -> backend validates lifecycle/content -> emits metadata audit -> student prompt list updates.

## Testing Strategy

- Backend:
  - migration/model tests;
  - student support plan and check-in API tests;
  - adult summary authorization/privacy tests;
  - admin prompt validation tests;
  - audit metadata sanitization tests.
- Frontend:
  - student plan/check-in/history tests;
  - teacher/parent summary-only tests;
  - admin prompt UI tests;
  - protected route/privacy redirect regression.

## Suggested Build Order

1. Support plan backend/domain and student UI.
2. Mood check-in backend/domain and student UI/history.
3. Adult summary APIs and teacher/parent UI.
4. Admin prompt/guidance config plus operations/audit closure.

## Open Risks

- Optional notes can easily leak through summaries, logs, audit metadata, or test fixtures.
- Adult summaries can drift into surveillance if trend labels become rankings.
- High-concern check-ins must support escalation without automatic SOS side effects.
