# Phase 23: Selective Mood-Note Sharing & Revocation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 23 - Selective Mood-Note Sharing & Revocation
**Mode:** Auto-selected because the user delegates design and implementation decisions to the agent.
**Areas discussed:** Share Scope and Student Control; Preview, Confirmation, and Copy; Adult Read Boundary; Audit and Privacy Invariants

---

## Share Scope and Student Control

| Option | Description | Selected |
|--------|-------------|----------|
| Existing private note only | Share the raw private note tied to one check-in. | |
| Private note plus optional student-authored summary | Share the selected private note or a student-authored summary with chosen linked adults. | ✓ |
| Automatic system summary | Generate and share a system-written interpretation. | |

**User's choice:** Auto-selected recommended option.
**Notes:** The selected option satisfies SHARE-01 while avoiding clinical interpretation and preserving student agency.

---

## Preview, Confirmation, and Copy

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal share button | Fastest UI, but weak consent clarity. | |
| Confirmation preview with named adults and privacy boundaries | Strongest consent and trust alignment. | ✓ |
| Multi-step wizard | More guidance, but heavier for a small mood-history action. | |

**User's choice:** Auto-selected recommended option.
**Notes:** Phase 23 requires exact preview of what is shared, who sees it, what remains private, and revocation path.

---

## Adult Read Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Add shared notes directly into existing mood trend summary | Simple but risks blurring summary-only boundaries. | |
| Separate consented shared-note section/API | Clear boundary between aggregate trends and explicit student grants. | ✓ |
| Dedicated standalone adult page only | Strong separation but adds navigation overhead. | |

**User's choice:** Auto-selected recommended option.
**Notes:** Existing adult support summary remains aggregate-only unless active share grants exist.

---

## Audit and Privacy Invariants

| Option | Description | Selected |
|--------|-------------|----------|
| Metadata-only audit with content flags/counts | Preserves operations visibility without private content. | ✓ |
| Store redacted text previews in audit | Easier debugging but violates v1.4 audit boundary. | |
| No audit for share/read/revoke | Avoids content risk but fails transparency requirements. | |

**User's choice:** Auto-selected recommended option.
**Notes:** SHARE-05 requires audit metadata to exclude raw private note and student-authored summary text.

---

## the agent's Discretion

- Exact endpoint names, component structure, loading states, and card layout.
- Whether to show active shares inline or in an expandable region on each history item.

## Deferred Ideas

- Reason-for-access prompts before protected reads — Phase 24.
- Admin policy and operations visibility — Phase 25.
- External notification delivery to adults — future milestone, not v1.4.
