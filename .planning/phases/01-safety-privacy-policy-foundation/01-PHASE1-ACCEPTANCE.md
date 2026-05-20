# Phase 1 Acceptance Checklist

**Phase:** Safety, Privacy & Policy Foundation  
**Status:** Grep-verifiable checklist for SAFE-01 through SAFE-06

## Requirement coverage

| Requirement | Artifact(s) | Acceptance anchor |
|---|---|---|
| SAFE-01 | `01-DATA-CLASSIFICATION.md`, `01-DATA-CLASSIFICATION.yml` | Five data classes and sensitive resource keys exist. |
| SAFE-02 | `01-PRIVACY-NOTICE.vi.md` | Student privacy notice explains visibility and safety exceptions. |
| SAFE-03 | `01-VISIBILITY-MATRIX.md`, `01-AUTHORIZATION-POLICY.yml` | Role + relationship + purpose authorization is denied by default. |
| SAFE-04 | `01-AUDIT-EVENT-CATALOG.yml` | Metadata-only audit events and forbidden raw fields exist. |
| SAFE-05 | `01-DEMO-DATA-POLICY.md` | Demo records require `is_demo`, banner, badge, and seed restrictions. |
| SAFE-06 | `01-SAFETY-COPY-GUIDE.md` | Non-clinical labels, disclaimers, SOS copy, and emergency guidance exist. |

## Required files

- `01-DATA-CLASSIFICATION.md`
- `01-DATA-CLASSIFICATION.yml`
- `01-VISIBILITY-MATRIX.md`
- `01-AUTHORIZATION-POLICY.yml`
- `01-AUDIT-EVENT-CATALOG.yml`
- `01-DEMO-DATA-POLICY.md`
- `01-SAFETY-COPY-GUIDE.md`
- `01-PRIVACY-NOTICE.vi.md`
- `01-THREAT-MODEL.md`
- `01-PHASE1-ACCEPTANCE.md`

## Grep checks

Run from the repository root. In PowerShell, fail fast after each command if `$LASTEXITCODE` is non-zero.

```powershell
git grep "SAFE-01" .planning/phases/01-safety-privacy-policy-foundation
git grep "SAFE-02" .planning/phases/01-safety-privacy-policy-foundation
git grep "SAFE-03" .planning/phases/01-safety-privacy-policy-foundation
git grep "SAFE-04" .planning/phases/01-safety-privacy-policy-foundation
git grep "SAFE-05" .planning/phases/01-safety-privacy-policy-foundation
git grep "SAFE-06" .planning/phases/01-safety-privacy-policy-foundation
git grep "wellbeing_records" .planning/phases/01-safety-privacy-policy-foundation
git grep "self_check_raw_answers" .planning/phases/01-safety-privacy-policy-foundation
git grep "sensitive_resource_read" .planning/phases/01-safety-privacy-policy-foundation
git grep "is_demo" .planning/phases/01-safety-privacy-policy-foundation
git grep "BeYou không thay thế chuyên gia" .planning/phases/01-safety-privacy-policy-foundation
git grep "Ai có thể xem thông tin của em?" .planning/phases/01-safety-privacy-policy-foundation
git grep "Nếu em đang thấy không an toàn ngay lúc này" .planning/phases/01-safety-privacy-policy-foundation
git grep "BeYou v1 không tự động gọi dịch vụ khẩn cấp bên ngoài." .planning/phases/01-safety-privacy-policy-foundation
```

## Forbidden student-facing copy check

Run forbidden-string checks only against `01-PRIVACY-NOTICE.vi.md` and future student-facing copy files. Do not run this check against research, UI specs, or internal policy files because those documents may name banned concepts for validation.

For Phase 1, `01-SAFETY-COPY-GUIDE.md` tracks banned concepts with English policy keys only:

- `diagnosis_claim`
- `therapy_claim`
- `ai_doctor_claim`
- `ai_therapist_claim`
- `risk_leaderboard_framing`
- `secret_monitoring_framing`

## Completion rule

Phase 1 is complete when all required files exist, all grep checks pass, each SAFE requirement has a matching artifact, and future implementation phases can trace sensitive data, visibility, audit, demo, and safety-copy behavior back to these contracts.
