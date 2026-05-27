# Phase 1: Safety, Privacy & Policy Foundation - Context

**Gathered:** 2026-05-20  
**Status:** Ready for planning

<domain>

## Phase Boundary

This phase establishes BeYou's safety and privacy operating model before code-heavy sensitive flows are built. It must define data sensitivity classes, student-facing privacy/visibility notices, role + relationship + purpose authorization rules, audit event boundaries, demo-vs-real data separation, and non-clinical safety copy standards. It should produce durable artifacts and UI/content surfaces that later phases implement consistently.

</domain>

<decisions>

## Implementation Decisions

### Data & Visibility Policy

- Classify data into five groups: public content, account/profile data, relationship links, wellbeing records, and safety/SOS/chat signals.
- Teacher and parent self-check visibility is summary-only by default: risk level, advice summary, date, and support suggestion. Raw answers are not shown by default.
- Raw chatbot transcripts are private to the student by default; teacher, parent, and admin do not see raw transcript content by default.
- High-risk sharing to adults uses safety summary and SOS note confirmed/provided by the student; the system must not automatically send the full chat transcript.

### Privacy Notice & Consent UX

- Place privacy and visibility notice in onboarding after login and keep a fixed link in dashboard/profile so students can revisit it.
- Use student-friendly Vietnamese organized around questions like "Ai thay gi?" and "Khi nao can bao nguoi lon?" rather than legal-heavy language.
- For MVP demo, include a demo consent/visibility acknowledgement and clearly state that real student pilot requires legal/school review.
- Do not promise absolute confidentiality. Explain that information is private except when safety risk means a trusted adult may need to help.

### Audit & Demo/Real Separation

- Audit schema/policy should capture actor, action, resource type/id, timestamp, reason/status, and metadata, while avoiding raw sensitive content.
- Required audit events include sensitive reads, SOS status changes, role/link changes, admin content changes, and high-risk safety events.
- Demo data is separated with `is_demo` metadata, environment/banner indicators, and seeds limited to dev/demo contexts.
- This phase should create policy documents, data contracts, and UI copy surfaces sufficient for later implementation; full auth/audit runtime can be built in Phase 2.

### Non-Clinical Safety Copy

- Self-check labels should be supportive and non-diagnostic: "On dinh", "Can chu y", "Nen tim ho tro", and "Can ho tro som".
- Chatbot disclaimer should be short and warm: it does not replace a professional, but can help the student think about a safe next step.
- SOS copy should be serious without causing panic: "Gui tin hieu de nguoi lon tin cay biet em can ho tro", with clear confirmation before send.
- Emergency guidance should encourage finding a nearby trusted adult and appropriate support resources. The system must not automatically call outside emergency services in v1.

### the agent's Discretion

The agent may choose exact artifact format, route naming, component structure, and storage shape as long as the decisions above remain enforceable by later phases.

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- No application code exists yet; current repository contains GSD planning artifacts only.
- Project guide exists at `copilot-instructions.md`.

### Established Patterns

- Backend is planned as Python FastAPI.
- Frontend is planned as Next.js + TypeScript + Tailwind + shadcn/ui.
- Planning artifacts use `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/research/`.

### Integration Points

- Phase 2 should consume this phase's policies to implement auth, student links, and audit.
- Phase 3 should consume self-check visibility and non-clinical result copy rules.
- Phase 4 should consume SOS privacy, status, and audit rules.
- Phase 5 should consume chatbot safety, transcript visibility, and high-risk escalation rules.

</code_context>

<specifics>

## Specific Ideas

- Use supportive Vietnamese copy throughout student-facing privacy and safety UI.
- Keep adult views support-oriented, not surveillance-oriented.
- Treat real student data as possible from day one, even though v1 is an MVP demo.

</specifics>

<deferred>

## Deferred Ideas

- Full production legal consent workflow for real school pilot.
- External SOS channels such as SMS, Zalo, email, or push notifications.
- Human counselor handoff and emergency-service automation.

</deferred>
