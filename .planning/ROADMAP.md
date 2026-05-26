# Roadmap: Peerlight AI

**Created:** 2026-05-26
**Granularity:** Coarse
**Status:** Between milestones — run `/gsd-new-milestone` to define the next requirements and roadmap.

## Completed Milestones

- ✅ **v1.5 Production Pilot Readiness & Identity** — Phases 28-32 (shipped 2026-05-26; constrained pass with live `smoke:pilot` tech debt accepted) — [roadmap archive](milestones/v1.5-ROADMAP.md), [requirements archive](milestones/v1.5-REQUIREMENTS.md), [audit](milestones/v1.5-MILESTONE-AUDIT.md)
- ✅ **v1.4 Consent-Based Notifications & Access Transparency** — Phases 21-27 (shipped 2026-05-25) — [roadmap archive](milestones/v1.4-ROADMAP.md)
- ✅ **v1.3 Pilot UX & Demo Readiness** — Phases 16-20 (shipped 2026-05-22) — [roadmap archive](milestones/v1.3-ROADMAP.md)
- ✅ **v1.2 Trusted Adult Plan & Mood Check-ins** — Phases 12-15 (shipped 2026-05-22) — [roadmap archive](milestones/v1.2-ROADMAP.md)
- ✅ **v1.1 Production Hardening & Support Polish** — Phases 7-11 (shipped 2026-05-22) — [roadmap archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.0 MVP Demo** — Phases 1-6 (shipped 2026-05-21) — [roadmap archive](milestones/v1.0-ROADMAP.md)

## Next Milestone

No active milestone is defined yet. Fresh requirements should be created with `/gsd-new-milestone`.

Likely candidate themes from deferred v1.5 scope:

- Live production-pilot evidence: configure safe pilot env, confirm `/health/ready=ready`, and record `npm --prefix frontend run smoke:pilot`.
- Full school identity-provider integration after a pilot school selects OAuth/OIDC/SAML/SCIM requirements.
- Counselor handoff workflow and richer pilot incident-response operations.
- External notification delivery governance for Zalo/SMS/push only after consent, retries, dead-letter handling, and provider review.
- Multi-school tenancy after single-school pilot safety is proven.

## Archive Notes

v1.5 phase artifacts are archived under `.planning/milestones/v1.5-phases/`. The full v1.5 roadmap, requirements, audit, and research artifacts live in `.planning/milestones/`.

---
*Last updated: 2026-05-26 after v1.5 milestone archive*
