# Phase 1 Threat Model

**Requirements:** SAFE-04, SAFE-05  
**Status:** Phase 1 safety/privacy threat register

## Assets

- `student_self_check_raw_answers`
- `self_check_summary`
- `chat_transcript_raw`
- `chat_safety_signal`
- `sos_alert`
- `student_adult_link`
- `audit_event`
- `demo_record`

## Actors

| Actor | Trust level | Notes |
|---|---|---|
| Student | Primary data subject | Owns private wellbeing and support experience. |
| Teacher | Linked support adult | Can support linked students only. |
| Parent | Linked support adult | Can support linked child only. |
| Admin | Operational administrator | Manages accounts/content/audit with purpose limits. |
| Unlinked adult | Untrusted for a student resource | Must not access private student data. |
| Demo viewer | Demo-only actor | Must not confuse demo records with real student data. |

## Trust Boundaries

| Boundary | Description | Primary controls |
|---|---|---|
| linked_user_to_unlinked_student | Prevent unlinked adult access to student resources. | `01-AUTHORIZATION-POLICY.yml` relationship checks. |
| sensitive_event_to_audit_log | Reduce runtime events to metadata before audit storage. | `01-AUDIT-EVENT-CATALOG.yml` metadata-only policy. |
| demo_data_to_real_data | Keep seeded demo data visibly and structurally separate. | `01-DEMO-DATA-POLICY.md` `is_demo`, banner, and badge. |
| student_copy_to_safety_claim | Prevent BeYou from implying diagnosis, therapy, or emergency automation. | `01-SAFETY-COPY-GUIDE.md` and `01-PRIVACY-NOTICE.vi.md`. |
| frontend_to_backend_api | Do not rely on frontend-only hiding for sensitive authorization. | `01-AUTHORIZATION-POLICY.yml` backend enforcement target. |

## STRIDE Threat Register

| Threat ID | STRIDE / Safety Category | Asset(s) | Risk | Mitigation |
|---|---|---|---|---|
| `idor_access_to_unlinked_student` | Information Disclosure / Elevation of Privilege | `self_check_summary`, `sos_alert`, `student_adult_link` | Teacher/parent/admin accesses a student outside their authorized relationship. | `01-AUTHORIZATION-POLICY.yml` requires deny-by-default, role, relationship, and purpose checks. |
| `raw_sensitive_content_in_audit_log` | Information Disclosure | `chat_transcript_raw`, `student_self_check_raw_answers`, `audit_event` | Audit payload stores raw chat, raw self-check answers, passwords, tokens, or secrets. | `01-AUDIT-EVENT-CATALOG.yml` defines `audit_policy: metadata_only` and `forbidden_fields`. |
| `demo_record_mistaken_for_real_student` | Tampering / Information Disclosure / Safety confusion | `demo_record`, `sos_alert`, `self_check_summary` | Demo data is acted on as if it were a real student support case. | `01-DEMO-DATA-POLICY.md` requires `is_demo`, persistent banner, `Demo` badge, and seed restrictions. |
| `clinical_or_therapy_claim_in_student_copy` | Safety / Misrepresentation | `self_check_summary`, `chat_safety_signal`, student copy | Student-facing copy implies diagnosis, therapy, doctor, or professional replacement. | `01-SAFETY-COPY-GUIDE.md` defines non-clinical labels, disclaimers, and banned concept keys; `01-PRIVACY-NOTICE.vi.md` reinforces supportive scope. |
| `frontend_only_privacy_enforcement` | Information Disclosure | all sensitive resources | UI hides data but backend still returns it to unauthorized roles. | `01-AUTHORIZATION-POLICY.yml` sets `frontend_only_privacy_enforcement: forbidden` and `enforcement_target: backend_phase_2`. |

## Verification

- `git grep "student_self_check_raw_answers" .planning/phases/01-safety-privacy-policy-foundation/01-THREAT-MODEL.md`
- `git grep "chat_transcript_raw" .planning/phases/01-safety-privacy-policy-foundation/01-THREAT-MODEL.md`
- `git grep "idor_access_to_unlinked_student" .planning/phases/01-safety-privacy-policy-foundation/01-THREAT-MODEL.md`
- `git grep "raw_sensitive_content_in_audit_log" .planning/phases/01-safety-privacy-policy-foundation/01-THREAT-MODEL.md`
- `git grep "demo_record_mistaken_for_real_student" .planning/phases/01-safety-privacy-policy-foundation/01-THREAT-MODEL.md`
- `git grep "clinical_or_therapy_claim_in_student_copy" .planning/phases/01-safety-privacy-policy-foundation/01-THREAT-MODEL.md`
- `git grep "frontend_only_privacy_enforcement" .planning/phases/01-safety-privacy-policy-foundation/01-THREAT-MODEL.md`
