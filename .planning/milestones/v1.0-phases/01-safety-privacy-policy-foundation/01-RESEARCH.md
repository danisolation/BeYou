# Phase 01: Safety, Privacy & Policy Foundation - Research

**Researched:** 2026-05-20  
**Domain:** Safety/privacy policy contracts, authorization visibility rules, audit boundaries, demo-data separation, non-clinical student-facing copy  
**Confidence:** HIGH for project-scoped artifact planning; MEDIUM for legal/compliance specifics pending expert review

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Data & Visibility Policy

- Classify data into five groups: public content, account/profile data, relationship links, wellbeing records, and safety/SOS/chat signals.
- Teacher and parent self-check visibility is summary-only by default: risk level, advice summary, date, and support suggestion. Raw answers are not shown by default.
- Raw chatbot transcripts are private to the student by default; teacher, parent, and admin do not see raw transcript content by default.
- High-risk sharing to adults uses safety summary and SOS note confirmed/provided by the student; the system must not automatically send the full chat transcript.

#### Privacy Notice & Consent UX

- Place privacy and visibility notice in onboarding after login and keep a fixed link in dashboard/profile so students can revisit it.
- Use student-friendly Vietnamese organized around questions like "Ai thay gi?" and "Khi nao can bao nguoi lon?" rather than legal-heavy language.
- For MVP demo, include a demo consent/visibility acknowledgement and clearly state that real student pilot requires legal/school review.
- Do not promise absolute confidentiality. Explain that information is private except when safety risk means a trusted adult may need to help.

#### Audit & Demo/Real Separation

- Audit schema/policy should capture actor, action, resource type/id, timestamp, reason/status, and metadata, while avoiding raw sensitive content.
- Required audit events include sensitive reads, SOS status changes, role/link changes, admin content changes, and high-risk safety events.
- Demo data is separated with `is_demo` metadata, environment/banner indicators, and seeds limited to dev/demo contexts.
- This phase should create policy documents, data contracts, and UI copy surfaces sufficient for later implementation; full auth/audit runtime can be built in Phase 2.

#### Non-Clinical Safety Copy

- Self-check labels should be supportive and non-diagnostic: "On dinh", "Can chu y", "Nen tim ho tro", and "Can ho tro som".
- Chatbot disclaimer should be short and warm: it does not replace a professional, but can help the student think about a safe next step.
- SOS copy should be serious without causing panic: "Gui tin hieu de nguoi lon tin cay biet em can ho tro", with clear confirmation before send.
- Emergency guidance should encourage finding a nearby trusted adult and appropriate support resources. The system must not automatically call outside emergency services in v1.

### the agent's Discretion

The agent may choose exact artifact format, route naming, component structure, and storage shape as long as the decisions above remain enforceable by later phases.

### Deferred Ideas (OUT OF SCOPE)

- Full production legal consent workflow for real school pilot.
- External SOS channels such as SMS, Zalo, email, or push notifications.
- Human counselor handoff and emergency-service automation.

## Summary

Phase 1 should produce durable policy and contract artifacts, not a full auth/audit runtime, because the repo currently has no application code and Phase 2 owns full auth/audit implementation. The best plan is to create human-readable policy documents plus machine-readable YAML-style contracts that later FastAPI and Next.js work can consume.

The highest-risk planning errors are unclear adult visibility, raw sensitive content in audit/logs, demo data being mistaken for real data, and clinical/therapy-like copy. OWASP authorization guidance supports deny-by-default, checking permissions on every request, and using attribute/relationship-based access in addition to RBAC.

**Primary recommendation:** Plan Phase 1 as a policy-contract package: data classification, visibility matrix, audit event catalog, demo/real separation rules, privacy notice copy, non-clinical copy guide, and a lightweight threat model checklist.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SAFE-01 | System classifies data by sensitivity before implementing storage or sharing rules. | Use `data-classification.md` and `data-classification.yml` with the five locked classes. |
| SAFE-02 | Student can read a clear privacy and visibility notice explaining who can see self-check results, SOS alerts, and chatbot safety signals. | Use the required UI copy headings and Vietnamese notice text from the UI spec. |
| SAFE-03 | Backend enforces role, relationship, and purpose-based authorization for every sensitive student resource. | Phase 1 should define the policy matrix; Phase 2 implements enforcement. |
| SAFE-04 | System records audit events when users access sensitive student data, update SOS alerts, change roles/links, or modify safety-related content. | Phase 1 should define audit event names, fields, and "do not log raw content" rules. |
| SAFE-05 | System separates demo data from real data so seeded accounts and demo records cannot be mistaken for production student records. | Use `is_demo`, demo banners, badges, and seed restrictions. |
| SAFE-06 | Student-facing self-check, chatbot, and result copy avoids clinical diagnosis language and clearly states the app does not replace professional support. | Use exact support labels and chatbot disclaimer from UI spec. |

## Project Constraints

- Backend stack must be Python.
- v1 is an MVP demo with complete core flows, not every production extension.
- Real student psychological data may be entered, so privacy, role authorization, and secure defaults are required from the start.
- The chatbot must not claim to be a therapist or professional diagnosis tool.
- High-risk chatbot messages must trigger escalation guidance and SOS suggestions.
- v1 SOS is in-app notification and status handling, not external email/Zalo/SMS.
- v1 authentication uses email/password plus seeded demo users; OAuth/SSO is deferred.
- Student-facing screens must feel supportive, calm, mobile-friendly, and avoid heavy medicalized language.

## Standard Stack

### Core Artifacts for Phase 1

| Artifact | Format | Purpose | Why Standard |
|----------|--------|---------|--------------|
| `01-DATA-CLASSIFICATION.md` | Markdown | Human-readable five-class data policy. | Easy for planner, designers, and future implementers to review. |
| `01-DATA-CLASSIFICATION.yml` | YAML | Machine-readable list of classes, examples, allowed sharing, audit requirements. | Easier to grep and later convert into tests or schemas. |
| `01-VISIBILITY-MATRIX.md` | Markdown table | Role + relationship + purpose visibility rules. | Matches the UI spec plain-language table pattern. |
| `01-AUTHORIZATION-POLICY.yml` | YAML | Machine-readable role + relationship + purpose policy. | Gives Phase 2 concrete keys for implementation. |
| `01-AUDIT-EVENT-CATALOG.yml` | YAML | Names required audit events and forbidden payload fields. | Makes SAFE-04 grep/test verifiable before runtime exists. |
| `01-DEMO-DATA-POLICY.md` | Markdown | Rules for `is_demo`, banners, badges, seed limits, and production warnings. | Directly supports SAFE-05. |
| `01-SAFETY-COPY-GUIDE.md` | Markdown | Vietnamese privacy, self-check, chatbot, SOS, and adult-view copy. | Directly supports SAFE-02 and SAFE-06. |
| `01-PRIVACY-NOTICE.vi.md` | Markdown | Student-facing privacy notice content. | Directly supports SAFE-02 and UI-SPEC. |
| `01-THREAT-MODEL.md` | Markdown | Assets, actors, trust boundaries, threats, mitigations, verification. | Security enforcement is enabled; plans must include threat model blocks. |
| `01-PHASE1-ACCEPTANCE.md` | Markdown | Grep-verifiable acceptance checklist. | Gives executor and verifier stable pass/fail anchors. |

### Supporting Later Stack, Not Implemented in Phase 1

| Technology | Phase | Purpose | Status |
|------------|-------|---------|--------|
| FastAPI/Python | Phase 2+ | Backend implementation of auth, authorization, audit, and sensitive APIs. | Planned, not built in Phase 1. |
| Next.js/TypeScript/Tailwind/shadcn/ui | Later frontend phases | Privacy notice and role portals. | Planned; shadcn is not initialized because no frontend scaffold exists. |
| PostgreSQL | Phase 2+ | Future storage for users, links, sensitive records, SOS, audit. | Planned, not built in Phase 1. |

**Installation:** none for Phase 1 policy-contract work.

## Recommended Artifact Structure

```text
.planning/phases/01-safety-privacy-policy-foundation/
├── 01-RESEARCH.md
├── 01-CONTEXT.md
├── 01-UI-SPEC.md
├── 01-DATA-CLASSIFICATION.md
├── 01-DATA-CLASSIFICATION.yml
├── 01-VISIBILITY-MATRIX.md
├── 01-AUTHORIZATION-POLICY.yml
├── 01-AUDIT-EVENT-CATALOG.yml
├── 01-DEMO-DATA-POLICY.md
├── 01-SAFETY-COPY-GUIDE.md
├── 01-PRIVACY-NOTICE.vi.md
├── 01-THREAT-MODEL.md
└── 01-PHASE1-ACCEPTANCE.md
```

This structure keeps Phase 1 artifacts next to the existing phase context and UI contract. It avoids adding application scaffolding before Phase 2.

## Data Classification Contract

Use the five locked classes exactly.

| Class Key | Human Label | Examples | Default Visibility | Audit Required |
|-----------|-------------|----------|--------------------|----------------|
| `public_content` | Public content | Published scenarios, general coping content, non-sensitive UI copy. | Public/authenticated as applicable. | No unless admin modifies content. |
| `account_profile` | Account/profile data | Name, email, role, school, class. | User self; admin by purpose; linked adults only where needed. | Yes for admin/role changes. |
| `relationship_links` | Relationship links | Student-teacher and student-parent links. | Admin manages; linked parties may see relationship context. | Yes for create/update/revoke. |
| `wellbeing_records` | Wellbeing records | Self-check attempts, raw answers, scores, risk/support labels, advice. | Student full access; adults summary-only by default. | Yes for sensitive reads. |
| `safety_sos_chat_signals` | Safety/SOS/chat signals | SOS alerts, chat safety events, high-risk summaries, raw chat transcripts. | Student full own view where appropriate; adults receive safety summaries/SOS only by policy. | Yes for reads, high-risk events, and status changes. |

Recommended YAML shape:

```yaml
classes:
  - key: wellbeing_records
    label: Wellbeing records
    examples:
      - self_check_raw_answers
      - self_check_result_summary
    default_visibility: private_to_student
    adult_default: summary_only
    audit_required: true
    raw_content_allowed_by_default:
      student: own_only
      teacher: never_by_default
      parent: never_by_default
      admin: restricted_support_or_admin_purpose_only
```

## Visibility Matrix Format

Use a resource-by-role table plus relationship and purpose qualifiers.

| Resource | Student | Teacher | Parent | Admin | Purpose Limit | Audit |
|----------|---------|---------|--------|-------|---------------|-------|
| Self-check raw answers | Own only | Not shown by default | Not shown by default | Restricted support/admin purpose only | Student reflection/support only | Sensitive read |
| Self-check summary | Own | Linked/managed students only | Linked child only | Restricted support/admin purpose only | Support, not surveillance | Sensitive read |
| Chat transcript | Own only by default | Not shown by default | Not shown by default | Not shown by default | Private support conversation | Exceptional access only if later policy defines |
| Chat safety signal | Own summary | Safety summary only when needed | Safety summary only when needed | Audit/safety metadata only | Safety escalation | High-risk event |
| SOS alert | Own | Linked/assigned recipients only | Linked child only | Operational metadata only | Response workflow | SOS create/read/status |
| Student-adult link | Own visible summary | Own managed links | Own child links | Manage links | Relationship management | Link change |
| Admin content changes | No | No | No | CRUD | Content governance | Admin content change |

## Policy/Data Contracts vs Deferred Implementation

### Define in Phase 1

- Data classes, examples, and sensitivity defaults.
- Role + relationship + purpose matrix.
- Audit event names and required fields.
- Demo/real indicators: `is_demo`, banner copy, badge copy, seed restrictions.
- Privacy notice content and placement rules.
- Non-clinical copy rules and banned wording.
- Threat model blocks for sensitive resources and future implementation phases.

### Defer to Phase 2+

- FastAPI authorization middleware/service implementation.
- Database schema and migrations for auth, student links, sessions, and audit logs.
- Persisted privacy acknowledgement after login.
- Runtime audit logging and append-only storage.
- Actual demo account seeding.
- Chatbot guardrail runtime and LLM integration.
- SOS workflow runtime and in-app notifications.

## UI Copy and Surfaces to Plan

| Surface | Required Phase 1 Output | Source |
|---------|-------------------------|--------|
| Onboarding privacy notice | `01-PRIVACY-NOTICE.vi.md` with acknowledgement text and headings. | UI-SPEC |
| Dashboard/profile privacy link | Copy and placement rule: `Ai có thể xem thông tin của em?` | UI-SPEC |
| Demo banner | `Đang xem dữ liệu demo - không phải hồ sơ học sinh thật.` | UI-SPEC |
| Demo badge | `Demo` | UI-SPEC |
| Self-check labels | `On dinh`, `Can chu y`, `Nen tim ho tro`, `Can ho tro som` | UI-SPEC |
| Chatbot disclaimer | `BeYou không thay thế chuyên gia tư vấn hay bác sĩ. Mình có thể lắng nghe và giúp em nghĩ về bước an toàn tiếp theo.` | UI-SPEC |
| SOS copy | Primary and confirmation copy from UI-SPEC. | UI-SPEC |
| Adult-view tone | Use support-oriented wording; avoid surveillance wording. | UI-SPEC |

## Architecture Patterns

### Pattern 1: Policy as Contract Before Runtime

Define sensitive resource rules in Markdown and YAML before writing FastAPI or Next.js implementation.

Example:

```yaml
resource: self_check_raw_answers
class: wellbeing_records
owner: student
visibility:
  student: own_only
  teacher: never_by_default
  parent: never_by_default
  admin: restricted_support_or_admin_purpose_only
purpose_required:
  - student_self_reflection
  - restricted_support_review
audit:
  event: sensitive_resource_read
  include_raw_content: false
```

### Pattern 2: Deny by Default + Relationship/Purpose Qualifiers

Every sensitive resource should specify who can access it, under which relationship, and for which purpose.

### Pattern 3: Audit Metadata, Not Raw Content

Audit events should capture actor, action, resource type/id, timestamp, reason/status, and metadata summary without raw sensitive content.

### Pattern 4: Demo Separation Is Both Data and UI

Demo separation needs metadata (`is_demo`) and visible UI indicators.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Legal consent for real school pilot | Do not invent a production legal consent workflow in Phase 1. | Mark real pilot legal/school review as required. | Real pilot legal review is explicitly deferred. |
| Authorization by role only | Do not write rules like "teacher can view all student data." | Role + relationship + purpose matrix. | Role-only checks are a documented project pitfall. |
| Audit log with raw content | Do not log full chat, full self-check answers, passwords, or tokens. | Metadata-only audit event catalog. | Raw sensitive logging is a documented pitfall and UI spec forbids raw content in audit UI. |
| Therapy/diagnosis copy | Do not create diagnostic labels or chatbot therapist claims. | Use non-clinical labels and disclaimer from UI spec. | SAFE-06 requires non-clinical copy. |
| Demo/real split by environment only | Do not rely only on deployment environment or color. | Use `is_demo`, banner, and badge. | UI spec requires visible demo banner/badge and says never rely only on color. |

## Common Pitfalls

### Pitfall 1: Treating Phase 1 as "just docs"

Later implementation lacks enforceable field names, event names, and acceptance anchors.

**How to avoid:** Include both Markdown explanations and YAML contracts with stable keys.

**Verification:** `git grep "SAFE-01"` and `git grep "self_check_raw_answers"` should find concrete policy artifacts.

### Pitfall 2: Adult visibility becomes surveillance

Teacher/parent dashboards expose raw answers, transcripts, or ranking-style risk views.

**How to avoid:** Make adult views summary-only and support-oriented by default.

**Warning signs:** Words like `giám sát`, `xếp hạng rủi ro`, `theo dõi bí mật`, or raw transcript access appear in adult policy defaults.

### Pitfall 3: Audit events leak sensitive content

Audit records store full self-check answers, chat text, passwords, tokens, or unnecessary raw SOS notes.

**How to avoid:** Define `forbidden_fields` in the audit catalog.

### Pitfall 4: Demo records look real

Seeded/demo records are mistaken for real student records.

**How to avoid:** Require `is_demo`, persistent demo banner, and `Demo` badge.

### Pitfall 5: Safety copy sounds clinical

BeYou appears to diagnose or provide therapy.

**How to avoid:** Use the exact non-clinical labels and chatbot disclaimer from UI-SPEC.

## Threat Model Requirements for Plans

Each Phase 1 plan should contain a `threat_model` block because security enforcement is enabled.

Recommended block format:

```yaml
threat_model:
  assets:
    - student_self_check_raw_answers
    - sos_alert_status
    - chat_safety_signal
  actors:
    - student
    - linked_teacher
    - linked_parent
    - admin
    - unlinked_authenticated_user
  trust_boundaries:
    - frontend_to_backend_api
    - student_private_data_to_adult_summary
    - demo_data_to_real_data
  threats:
    - idor_access_to_unlinked_student
    - raw_sensitive_content_in_audit_log
    - demo_record_mistaken_for_real_student
    - clinical_or_therapy_claim_in_student_copy
  mitigations:
    - role_relationship_purpose_matrix
    - metadata_only_audit_catalog
    - is_demo_and_visible_banner
    - non_clinical_copy_guide
  verification:
    - grep_required_policy_keys
    - review_visibility_matrix_against_SAFE_03
```

## Grep/Test-Verifiable Acceptance Strategy

Because no application code exists yet, Phase 1 acceptance should be based on artifact existence, stable IDs, required strings, and forbidden strings.

Recommended checks:

```powershell
git grep "SAFE-01" .planning/phases/01-safety-privacy-policy-foundation
git grep "wellbeing_records" .planning/phases/01-safety-privacy-policy-foundation
git grep "self_check_raw_answers" .planning/phases/01-safety-privacy-policy-foundation
git grep "sensitive_resource_read" .planning/phases/01-safety-privacy-policy-foundation
git grep "is_demo" .planning/phases/01-safety-privacy-policy-foundation
git grep "BeYou không thay thế chuyên gia" .planning/phases/01-safety-privacy-policy-foundation
git grep "Ai có thể xem thông tin của em?" .planning/phases/01-safety-privacy-policy-foundation
```

Forbidden-string checks should fail the phase if found in student-facing copy:

```powershell
git grep -n "chẩn đoán\|điều trị\|bác sĩ AI\|nhà trị liệu AI\|xếp hạng rủi ro\|theo dõi bí mật" .planning/phases/01-safety-privacy-policy-foundation
```

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Later implementation | Phase 1 defines privacy acknowledgement and demo/auth assumptions; Phase 2 implements login. |
| V3 Session Management | Later implementation | Phase 1 should not implement sessions; Phase 2 should use secure session design from project research. |
| V4 Access Control | Yes | Role + relationship + purpose matrix; deny-by-default policy. |
| V5 Input Validation | Later implementation | Phase 1 should define allowed keys/enums for policy contracts. |
| V7 Error Handling and Logging | Yes | Metadata-only audit catalog and forbidden audit fields. |
| V8 Data Protection | Yes | Data classification, minimization, demo separation, raw-content restrictions. |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unlinked adult accesses student resource | Information Disclosure / Elevation of Privilege | Relationship checks in visibility matrix. |
| Raw sensitive data written to audit/logs | Information Disclosure | Metadata-only audit catalog; forbidden raw content fields. |
| Demo record mistaken for real student | Tampering / Information Disclosure / Safety confusion | `is_demo`, persistent banner, `Demo` badge. |
| Clinical claims in student copy | Safety / Misrepresentation | Non-clinical copy guide and banned terms. |
| Frontend-only privacy enforcement | Information Disclosure | Backend policy contracts consumed by Phase 2 implementation. |

## Environment Availability

No external runtime dependency is required for Phase 1 policy-contract artifacts. Git is available in the environment and can support grep-style acceptance checks.

## Validation Architecture

Skipped because `.planning/config.json` explicitly sets `workflow.nyquist_validation` to `false`.

## Open Questions (RESOLVED)

1. **Real student pilot legal consent**
   - What we know: MVP demo can include demo acknowledgement and must state real pilot needs legal/school review.
   - What is unclear: exact legal consent/assent process for real Vietnamese school deployment.
   - RESOLVED for Phase 1 planning: mark legal/school review as a required blocker before any real student pilot, but do not build a full production legal consent workflow in the MVP demo.

2. **Retention policy**
   - What we know: project research flags retention/deletion for self-check, SOS, chat metadata, and possible transcripts as unresolved.
   - What is unclear: retention duration by data class.
   - RESOLVED for Phase 1 planning: use `retention: TBD_before_real_pilot` for sensitive classes so demo implementation can proceed while blocking real pilot launch until concrete retention durations are approved.

3. **Raw chatbot transcript storage**
   - What we know: raw transcripts are private to the student by default and not shown to adults/admins by default.
   - What is unclear: whether transcripts are stored at all in production.
   - RESOLVED for Phase 1 planning: separate `chat_transcript_raw` from `chat_safety_signal`; raw transcripts remain student-private by default and production storage/deletion must be decided before real pilot.

4. **SOS adult response expectations**
   - What we know: v1 SOS is in-app and should not auto-call outside emergency services.
   - What is unclear: school SLA and fallback if no linked adult responds.
   - RESOLVED for Phase 1 planning: include explicit copy telling students to find a nearby trusted adult or appropriate support resource if immediate danger exists, and state that BeYou v1 does not automatically call outside emergency services.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | YAML is the preferred machine-readable format for policy contracts. | Standard Stack | Low; JSON or Markdown tables could replace YAML. |
| A2 | Stable grep anchors are sufficient for Phase 1 acceptance in a no-code repo. | Grep/Test-Verifiable Acceptance Strategy | Medium; planner may prefer a validation script. |
| A3 | Future implementation can consume Phase 1 YAML contracts. | Summary / Architecture Patterns | Medium; app scaffolding may choose a different contract format. |
| A4 | Retention can be marked `TBD_before_real_pilot` in Phase 1. | Open Questions | Medium; user may require a concrete retention decision earlier. |

## Sources

### Primary

- `.planning/phases/01-safety-privacy-policy-foundation/01-CONTEXT.md`
- `.planning/phases/01-safety-privacy-policy-foundation/01-UI-SPEC.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/PITFALLS.md`
- `.planning/research/ARCHITECTURE.md`
- `copilot-instructions.md`
- `.planning/config.json`

### External

- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- OWASP ASVS project page: https://owasp.org/www-project-application-security-verification-standard/

## Metadata

| Area | Level | Reason |
|------|-------|--------|
| User constraints | HIGH | Directly copied from phase context. |
| Artifact recommendations | MEDIUM-HIGH | Strongly supported by project docs; exact YAML-vs-JSON choice is assumed. |
| Visibility matrix | HIGH | Directly supported by context, UI spec, architecture research, and OWASP authorization guidance. |
| Audit catalog | HIGH | Directly supported by context, UI spec, pitfalls, and OWASP logging guidance. |
| Legal/compliance | LOW-MEDIUM | Project research says legal/school review is needed before real pilot. |
| UI copy | HIGH | Exact strings are specified in UI spec. |

**Research date:** 2026-05-20  
**Valid until:** 2026-06-19 for project artifacts; legal/compliance assumptions require review before any real student pilot.
