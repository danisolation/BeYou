---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: Production Pilot Readiness & Identity
status: planning
stopped_at: Phase 30 verified complete
last_updated: "2026-05-26T03:14:48.241Z"
last_activity: 2026-05-26
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 12
  completed_plans: 12
  percent: 100
---

# State: Peerlight AI

**Initialized:** 2026-05-20  
**Last updated:** 2026-05-26 after Phase 30 verification
**Status:** Ready to plan Phase 31

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-26)

**Core value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.  
**Current focus:** Phase 31 — School Pilot Operations & Safe Launch

## Planning Artifacts

| Artifact | Path | Status |
|---|---|---|
| Project context | `.planning/PROJECT.md` | Current |
| Workflow config | `.planning/config.json` | Current |
| Milestone summary | `.planning/MILESTONES.md` | Current |
| Active roadmap | `.planning/ROADMAP.md` | v1.5 Phases 28-30 complete; ready for Phase 31 planning |
| Active requirements | `.planning/REQUIREMENTS.md` | 28 v1.5 requirements mapped, 17 complete |
| v1.5 research | `.planning/research/` | Current |
| Phase 28 context | `.planning/phases/28-runtime-mode-production-readiness-foundation/28-CONTEXT.md` | Complete |
| Phase 28 research | `.planning/phases/28-runtime-mode-production-readiness-foundation/28-RESEARCH.md` | Complete |
| Phase 28 plans | `.planning/phases/28-runtime-mode-production-readiness-foundation/28-01-PLAN.md` through `28-03-PLAN.md` | Complete and verified |
| Phase 28 verification | `.planning/phases/28-runtime-mode-production-readiness-foundation/28-VERIFICATION.md` | Passed |
| Phase 29 UI spec | `.planning/phases/29-deployment-guardrails-smoke-profiles/29-UI-SPEC.md` | Approved |
| Phase 29 research | `.planning/phases/29-deployment-guardrails-smoke-profiles/29-RESEARCH.md` | Complete |
| Phase 29 plans | `.planning/phases/29-deployment-guardrails-smoke-profiles/29-01-PLAN.md` through `29-04-PLAN.md` | 4/4 executed |
| Phase 29 summaries | `.planning/phases/29-deployment-guardrails-smoke-profiles/29-01-SUMMARY.md` through `29-04-SUMMARY.md` | Complete |
| Phase 29 review | `.planning/phases/29-deployment-guardrails-smoke-profiles/29-REVIEW.md` | Clean |
| Phase 29 verification | `.planning/phases/29-deployment-guardrails-smoke-profiles/29-VERIFICATION.md` | Passed |
| v1.4 roadmap archive | `.planning/milestones/v1.4-ROADMAP.md` | Archived |
| v1.4 requirements archive | `.planning/milestones/v1.4-REQUIREMENTS.md` | Archived |
| v1.4 audit archive | `.planning/milestones/v1.4-MILESTONE-AUDIT.md` | Passed |
| v1.4 phase artifacts | `.planning/milestones/v1.4-phases/` | Archived |
| v1.4 research archive | `.planning/milestones/v1.4-research/` | Archived |
| v1.3 roadmap archive | `.planning/milestones/v1.3-ROADMAP.md` | Archived |
| v1.3 requirements archive | `.planning/milestones/v1.3-REQUIREMENTS.md` | Archived |
| v1.3 audit archive | `.planning/milestones/v1.3-MILESTONE-AUDIT.md` | Passed |
| v1.3 phase artifacts | `.planning/milestones/v1.3-phases/` | Archived |
| v1.2 roadmap archive | `.planning/milestones/v1.2-ROADMAP.md` | Archived |
| v1.2 requirements archive | `.planning/milestones/v1.2-REQUIREMENTS.md` | Archived |
| v1.2 audit archive | `.planning/milestones/v1.2-MILESTONE-AUDIT.md` | Passed |
| v1.2 phase artifacts | `.planning/milestones/v1.2-phases/` | Archived |
| v1.1 roadmap archive | `.planning/milestones/v1.1-ROADMAP.md` | Archived |
| v1.1 requirements archive | `.planning/milestones/v1.1-REQUIREMENTS.md` | Archived |
| v1.1 audit archive | `.planning/milestones/v1.1-MILESTONE-AUDIT.md` | Passed |
| v1.1 phase artifacts | `.planning/milestones/v1.1-phases/` | Archived |
| v1.1 research archive | `.planning/milestones/v1.1-research/` | Archived |
| v1.0 roadmap archive | `.planning/milestones/v1.0-ROADMAP.md` | Archived |
| v1.0 requirements archive | `.planning/milestones/v1.0-REQUIREMENTS.md` | Archived |
| v1.0 audit archive | `.planning/milestones/v1.0-MILESTONE-AUDIT.md` | Passed |

## Completed Milestones

| Milestone | Status | Scope |
|---|---|---|
| v1.4 Consent-Based Notifications & Access Transparency | Complete | 7 phases, 7 plans, 36/36 requirements |
| v1.3 Pilot UX & Demo Readiness | Complete | 5 phases, 5 plans, 20/20 requirements |
| v1.2 Trusted Adult Plan & Mood Check-ins | Complete | 4 phases, 12 plans, 24/24 requirements |
| v1.1 Production Hardening & Support Polish | Complete | 5 phases, 15 plans, 30/30 requirements |
| v1.0 MVP Demo | Complete | 6 phases, 26 plans, 47/47 requirements |

## Current Position

Phase: 31 (School Pilot Operations & Safe Launch)
Plan: Not started
Status: Ready to plan
Last activity: 2026-05-26

## Requirements Coverage

- cumulative shipped requirements: 170 total
- v1.5 requirements: 28 total, 28 mapped, 17 complete
- v1.4 requirements archived: 36/36 complete
- v1.3 requirements archived: 20/20 complete
- v1.2 requirements archived: 24/24 complete
- blocker gaps: 0

## Key Decisions

| Decision | Outcome |
|---|---|
| Continue phase numbering from v1.1 | v1.2 used Phases 12-15 |
| Choose proactive support over external channels | Trusted adult plan and mood check-ins deepen support without adding Zalo/SMS/push risk |
| Keep in-app SOS as source of truth | Mood check-ins suggest SOS but never send SOS automatically |
| Keep optional mood notes student-only by default | Adult/admin summaries exclude raw private notes |
| Preserve metadata-only operations | Operations views use safe counts/statuses only |
| Continue phase numbering from v1.2 | v1.3 uses Phases 16-20 |
| Prioritize pilot UX before new sensitive sharing features | v1.3 improves live demo readiness without expanding adult/admin access to raw private data |
| Use public landing plus one-step demo role entry | Phase 16 preserves manual login while making evaluator entry faster |
| Use global responsive/accessibility guardrails before per-page polish | Phase 17 reduces overflow/focus risks across all current and future screens |
| Make critical actions narrate consequences and outcomes | Phase 18 adds confirmation context and success/error states without expanding private data access |
| Keep live demo smoke separate from production launch readiness | Phase 19 smoke verifies deployed demo usability while `/health/ready` can remain `not_ready` until demo seeding is disabled for real production launch |
| Use ESLint flat config for Next 16 | Phase 20 replaces broken `next lint` with direct ESLint CLI and Next flat configs |
| Start v1.4 with consent and transparency before external notification channels | Reminder and access-transparency features need student control, policy defaults, and audit boundaries before adding Zalo/SMS/push |
| Make selective mood-note sharing student-granted and revocable | Phase 23 keeps raw mood notes private by default; adult reads require active relationship plus active unrevoked student grant |
| Require controlled reasons before protected adult support access | Phase 24 keeps support-summary and shared-note reads transparent without allowing free-text reasons or bypassing relationship authorization |
| Keep admin policy and operations metadata-only | Phase 25 lets admins configure safe v1.4 defaults and inspect counts/readiness without raw content, external channels, exports, or drilldowns |
| Close v1.4 with full regression and demo gates | Phase 26 verifies backend/frontend privacy regressions, docs, production smoke, and accepted demo readiness constraints |
| Close audit gaps before archive | Phase 27 wires policy defaults into runtime, enforces note-sharing policy, and removes operations `resource_id` exposure |
| Rebrand the product to Peerlight AI | Phase 27 refreshes student-facing Vietnamese UX, chat, dashboard, self-check/scenario labels, and demo psychological test content |
| Restrict teacher/parent visibility to SOS-signaled students | Phase 27 makes adult support access require active relationship plus student-sent SOS before student lists/support summaries reveal the student |
| Make production pilot readiness separate from public demo readiness | v1.5 will let real pilot readiness pass only when demo seed/login and unsafe deploy config are disabled |
| Use explicit runtime modes for Phase 28 | Phase 28 context locks `local_demo`, `public_demo`, and `production_pilot` as runtime mode names |
| Keep readiness public-safe and admin-masked | Phase 28 keeps public readiness status-only and admin readiness metadata-only with no secret or raw student data exposure |
| Keep frontend operations contract aligned with backend metadata | Phase 28 Plan 01 removes raw origin and cookie-name exposure from both backend response schema and frontend admin operations UI/types |
| No-op seed and block demo login in production pilot | Phase 28 Plan 02 prevents production-pilot demo writes and denies demo-account sessions before cookies are issued |
| Use operations dashboard as Phase 29 UI anchor | Phase 29 UI-SPEC keeps deployment guardrails and smoke profiles inside metadata-only admin operations patterns |
| Keep demo and production-pilot smoke evidence separate | Phase 29 adds `smoke:demo` for seeded public demo coverage and `smoke:pilot` for readiness-`ready` production pilot checks without demo users |
| Prepare identity contracts before full SSO | v1.5 adds OAuth/SSO-ready backend contracts while deferring provider-specific login until a school IdP is selected |
| Keep identity claims out of authorization | v1.5 keeps app-owned role, relationship, and SOS checks as the source of truth |
| Keep Phase 30 Plan 01 contract-only | No OAuth/OIDC redirect, callback, token exchange, or browser token storage was added |
| Store safe session auth metadata | Plan 30-01 records nullable `auth_method` and `auth_provider_key` for password, demo_password, and future sso sessions |
| Store external identities without raw claims | Plan 30-01 uses provider key plus provider subject hash with safe statuses/labels only |
| Keep Phase 30 Plan 02 contract-only | No OAuth/OIDC redirect, callback, token exchange, claim mapping, or provider login path was added |
| Resolve external identities by provider subject hash only | Plan 30-02 performs no email lookup, auto-provisioning, or unverified email merge |
| Keep authorization app-owned | Plan 30-02 left `require_permission` unchanged so adult visibility remains role + active link + student SOS, not provider claims |
| Keep provider readiness metadata-only | Plan 30-03 exposes auth provider readiness through safe booleans, labels, statuses, and enum-like keys without raw domains, URLs, secrets, tokens, or claims |
| Keep identity operations aggregate-only | Plan 30-03 adds mapping/session auth buckets without provider subject hashes, per-user drilldowns, exports, or raw JSON viewers |
| Keep public auth capabilities safe | Plan 30-04 exposes only demo/email/provider booleans plus optional provider label/mode without provider internals, raw domains, tokens, cookies, emails, or password hashes |
| Gate demo shortcuts from backend metadata | Plan 30-04 hides public demo role buttons when `public_demo_entry_enabled=false` while preserving email/password cookie login |
| Preserve no-token frontend auth | Plan 30-04 keeps capability and login calls on `apiFetch` with `credentials: include`, with no browser token storage or OAuth redirect/callback |
| Render identity operations in existing dashboard | Plan 30-05 added provider readiness, identity mapping, and session auth panels without new routes or UI libraries |
| Keep Phase 30 operations fields optional | Plan 30-05 preserves old operations payload compatibility with nullable fields and nullish array fallbacks |
| Allow only required drilldown safety copy | Plan 30-05 permits `drilldown tài khoản` only in required safety copy while adding no drilldown links, buttons, routes, exports, or raw viewers |

## Known Tech Debt

- `npm --prefix frontend audit --omit=dev` reports an existing moderate Next/PostCSS advisory; `npm audit fix --force` proposes a breaking downgrade, so track until a non-breaking stable Next release resolves it.
- Deferred future work remains: notification retry queues, Zalo/SMS/push channels, counselor handoff, content diff/version history, multi-school tenancy, and production OAuth/SSO.

## Session Continuity

Last session: 2026-05-26T03:13:29Z
Stopped at: Phase 30 verified complete
Resume file: .planning/phases/30-identity-foundation-auth-contracts/30-VERIFICATION.md

## Next Action

Run:

```text
/gsd-discuss-phase 31 --auto
```
