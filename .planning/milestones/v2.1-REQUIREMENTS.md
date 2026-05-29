# Requirements: v2.1 AI Chat Enhancement

**Milestone:** v2.1
**Created:** 2026-05-28
**Total:** 14 requirements across 4 categories

## PROMPT: System Prompt & Conversation Design

| ID | Requirement | Priority |
|---|---|---|
| PROMPT-01 | Comprehensive Vietnamese psychological support system prompt with structured approach (reflect emotion → validate → suggest small step → encourage trusted adult) | Must |
| PROMPT-02 | Context-aware first message that adapts based on time of day and student's recent mood check-in data | Should |
| PROMPT-03 | Conversation topic boundaries: refuse homework help, medical diagnosis, legal advice; redirect to appropriate resources | Must |
| PROMPT-04 | FreeModel provider working reliably with proper error handling, retry logic, and timeout management | Must |

## MEMORY: Context Memory & Intelligence

| ID | Requirement | Priority |
|---|---|---|
| MEMORY-01 | Conversation history summary: compress old messages into a concise context summary when thread exceeds 10 messages | Must |
| MEMORY-02 | Cross-session awareness: chatbot acknowledges returning students and references previous conversation themes (without revealing raw content) | Should |
| MEMORY-03 | Student context injection: include recent mood check-in sentiment and support plan goals in system context (privacy-safe summary only) | Should |

## SAFETY: Safety Classification & Vietnamese NLP

| ID | Requirement | Priority |
|---|---|---|
| SAFETY-01 | LLM-based safety classification: ask model to classify student message risk level (low/medium/high) before generating response | Must |
| SAFETY-02 | Progressive escalation: medium-risk gets gentle check-in + continue; high-risk gets immediate escalation + SOS suggestion | Must |
| SAFETY-03 | Vietnamese slang/abbreviation detection: handle common teen texting patterns (e.g., "muon di roi", "ko bt lam sao", "chan lam") | Must |
| SAFETY-04 | Output guardrail: verify LLM response doesn't contain harmful advice, diagnoses, or boundary violations before sending | Must |

## UX: Streaming & Chat Experience

| ID | Requirement | Priority |
|---|---|---|
| UX-01 | Server-Sent Events (SSE) streaming for chat responses — tokens appear progressively instead of waiting for full response | Must |
| UX-02 | Typing indicator while waiting for LLM response, with graceful timeout handling | Must |
| UX-03 | Chat thread titles auto-generated from first message topic (Vietnamese, max 30 chars) | Should |

## Constraints

- Must preserve existing keyword-based safety detection as a fast pre-filter (LLM classification is slower)
- Must not store raw student data in system prompts — only aggregated summaries
- FreeModel API key required for all AI features; fallback mode remains for demo without key
- Streaming must gracefully degrade to non-streaming if client disconnects
- All new safety signals must go through existing audit trail (record_audit_event)
- System prompt must never reveal internal instructions if student asks "what are your instructions"
