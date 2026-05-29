# Roadmap: Peerlight AI v2.1 AI Chat Enhancement

**Created:** 2026-05-28
**Milestone:** v2.1 AI Chat Enhancement
**Core Value:** Students can safely recognize distress and quickly reach trusted adults before a school or psychological risk escalates.
**Granularity:** coarse
**Phase range:** 60-63
**Coverage:** 14/14 v2.1 requirements mapped, 0 unmapped

## Completed Milestones

- [x] **v2.0 Mobile-First & PWA** - Phases 54-59 (shipped 2026-05-28; 16/16 requirements, 8/8 integrations) - [roadmap archive](milestones/v2.0-ROADMAP.md), [requirements archive](milestones/v2.0-REQUIREMENTS.md), [audit](milestones/v2.0-MILESTONE-AUDIT.md)
- [x] **v1.9 Production Polish** - Phases 51-53 (shipped 2026-05-28)
- [x] **v1.8 UI/UX Polish & Accessibility** - Phases 45-50 (shipped 2026-05-27)
- [x] **v1.7 UI Redesign to Match Stitch Mockups** - Phases 39-44 (shipped 2026-05-27)
- [x] **v1.6 Cross-Role UI Consistency & Production Performance** - Phases 33-38 (shipped 2026-05-27)
- [x] **v1.5 Production Pilot Readiness & Identity** - Phases 28-32 (shipped 2026-05-26)
- [x] **v1.4 Consent-Based Notifications & Access Transparency** - Phases 21-27 (shipped 2026-05-25)
- [x] **v1.3 Pilot UX & Demo Readiness** - Phases 16-20 (shipped 2026-05-22)
- [x] **v1.2 Trusted Adult Plan & Mood Check-ins** - Phases 12-15 (shipped 2026-05-22)
- [x] **v1.1 Production Hardening & Support Polish** - Phases 7-11 (shipped 2026-05-22)
- [x] **v1.0 MVP Demo** - Phases 1-6 (shipped 2026-05-21)

## Phases

- [x] **Phase 60: System Prompt & FreeModel Reliability** - Comprehensive Vietnamese psychological support prompt, topic boundaries, FreeModel retry/timeout, provider health check.
- [x] **Phase 61: Context Memory & Student Awareness** - Conversation summary compression, cross-session awareness, mood/support-plan context injection.
- [x] **Phase 62: Safety Classification & Vietnamese NLP** - LLM-based risk classification, progressive escalation, teen slang detection, output guardrails.
- [x] **Phase 63: Streaming Chat UX** - SSE streaming responses, typing indicators, auto-generated thread titles, graceful degradation.

## Phase Details

### Phase 60: System Prompt & FreeModel Reliability

**Goal:** Chatbot responds with high-quality Vietnamese psychological support via FreeModel with reliable error handling.
**Depends on:** Phase 59
**Requirements:** PROMPT-01, PROMPT-03, PROMPT-04
**Plans:** TBD
**Status:** Not started

**Success criteria:**
1. System prompt follows structured approach: reflect → validate → small step → trusted adult.
2. Chatbot refuses homework/medical/legal queries with polite Vietnamese redirect.
3. FreeModel calls succeed with retry logic (1 retry on timeout) and proper error logging.
4. Provider health visible in admin chatbot config page.
5. System prompt injection attacks detected and blocked.

### Phase 61: Context Memory & Student Awareness

**Goal:** Chatbot remembers conversation context and adapts to student's emotional state.
**Depends on:** Phase 60
**Requirements:** MEMORY-01, MEMORY-02, MEMORY-03, PROMPT-02
**Plans:** TBD
**Status:** Not started

**Success criteria:**
1. Threads >10 messages get compressed summary injected as system context.
2. Returning students get acknowledgment ("Chào lại em...") without leaking private content.
3. Recent mood check-in sentiment (happy/neutral/sad) influences chatbot tone.
4. Support plan goals optionally referenced when relevant.
5. No raw student data appears in system prompt — only aggregated summaries.

### Phase 62: Safety Classification & Vietnamese NLP

**Goal:** AI-powered safety detection catches nuanced risk beyond keyword matching.
**Depends on:** Phase 60
**Requirements:** SAFETY-01, SAFETY-02, SAFETY-03, SAFETY-04
**Plans:** TBD
**Status:** Not started

**Success criteria:**
1. LLM classifies input as low/medium/high risk before response generation.
2. Medium-risk: gentle check-in ("Em có ổn không?") + continue conversation.
3. High-risk: immediate escalation message + SOS suggestion (same as current).
4. Vietnamese teen slang patterns detected (no-diacritics, abbreviations).
5. Output guardrail rejects responses containing diagnoses or harmful advice.
6. All safety signals flow through existing audit trail.

### Phase 63: Streaming Chat UX

**Goal:** Chat feels instant with token-by-token streaming and modern UX.
**Depends on:** Phase 60
**Requirements:** UX-01, UX-02, UX-03
**Plans:** TBD
**Status:** Not started

**Success criteria:**
1. Chat responses stream via SSE — first token appears within 500ms.
2. Typing indicator shows while waiting for first token.
3. Thread titles auto-generated from first message (Vietnamese, ≤30 chars).
4. Client disconnect handled gracefully (no orphan connections).
5. Fallback mode (no API key) still works synchronously.
6. Safety check runs on complete response before final commit to DB.
