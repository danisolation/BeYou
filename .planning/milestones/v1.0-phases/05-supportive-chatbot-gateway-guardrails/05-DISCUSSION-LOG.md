# Phase 05 Discussion Log

**Mode:** Autonomous, no optional questions asked.  
**Reason:** User explicitly requested `/gsd-autonomous` and "don't ask"; defaults chosen to preserve safety, privacy, and demo reliability.

## Auto-Decisions

1. **Chat transcript privacy:** student-owned only by default; no adult/admin raw transcript endpoints.
2. **Safety model:** deterministic server guardrails before and after provider response.
3. **High-risk behavior:** return supportive escalation guidance, suggest SOS/trusted adult, do not auto-call outside services.
4. **Provider:** implement `freemodel.dev` adapter plus local deterministic fallback; tests use fallback/no network.
5. **Admin config:** allow keyword/copy management, never secrets or guardrail-disable switches.
6. **UI:** add `/student/chat` and `/admin/chatbot`, reuse existing card/spacing patterns.
7. **Audit:** metadata-only safety events, config changes, and transcript reads.

## Hard Boundaries Preserved

- No frontend API key exposure.
- No diagnosis, therapy, doctor, or emergency-dispatch claims.
- No raw chat transcript visibility for adults by default.
- No wildcard CORS or browser token storage.
- No Phase 06 reports.

