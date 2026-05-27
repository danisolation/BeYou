# Requirements: Peerlight AI v1.7 UI Redesign to Match Stitch Mockups

**Created:** 2026-05-27
**Milestone:** v1.7
**Source:** Google Stitch mockup feedback + user specifications
**Total:** 20 requirements

## v1.7 Requirements

### Student Homepage (HOME)

- [ ] **HOME-01**: Student sees a card-based About/Homepage with synchronized design language (no duplicate sections, image+text blocks only)
- [ ] **HOME-02**: Student sees "Bắt đầu" as the only navigation CTA on the homepage

### Login (AUTH)

- [ ] **AUTH-01**: Student sees updated login page with 3 branding cards (Góc nhỏ bình yên, Nâng niu từng xao động, Điểm hẹn chữa lành)
- [ ] **AUTH-02**: Login page loads without slow circle animation issue

### Student Dashboard (DASH)

- [ ] **DASH-01**: Student dashboard uses circular/rounded cards with specific CTAs (Vào test, Vào check-in, Vào thực hành, Vào thiết lập)
- [ ] **DASH-02**: Dashboard does not show history sections (history lives inside each feature page)
- [ ] **DASH-03**: Dashboard does not show privacy blocks or reminder settings inline

### Peerlight AI Chat (CHAT)

- [ ] **CHAT-01**: Mobile chat view has a hamburger menu (≡) for sidebar navigation
- [ ] **CHAT-02**: Chat is consistently named "Peerlight AI" everywhere

### Psychological Tests (TEST)

- [ ] **TEST-01**: Student can browse a list of available tests
- [ ] **TEST-02**: Student can take a test (question-by-question sub-page)
- [ ] **TEST-03**: Student can view test results after completion

### Emotional Check-in (CHECKIN)

- [ ] **CHECKIN-01**: Check-in page shows privacy banner with 4 specific reassurance points
- [ ] **CHECKIN-02**: Check-in history is displayed inside the check-in page (not on dashboard)

### Scenarios (SCENARIO)

- [ ] **SCENARIO-01**: Student can browse a library of scenarios
- [ ] **SCENARIO-02**: Student can practice a scenario (interactive sub-page)
- [ ] **SCENARIO-03**: Student can view scenario results/feedback

### Trusted Adults (TRUST)

- [ ] **TRUST-01**: Trusted Adults page matches the Stitch mockup design

### SOS (SOS)

- [ ] **SOS-01**: SOS page shows initial confirmation state before activation
- [ ] **SOS-02**: After pressing "Đúng, tôi cần giúp ngay", SOS shows activated overlay

### Settings (SETTINGS)

- [ ] **SETTINGS-01**: Settings page combines check-in settings and SOS settings in one view

### Teacher/Parent Portal (ADULT)

- [ ] **ADULT-01**: Teacher/Parent portal includes Peerlight AI chatbot (same design as student)
- [ ] **ADULT-02**: Teacher/Parent dashboard uses card-based layout matching student design
- [ ] **ADULT-03**: Teacher/Parent SOS profile view shows only the student SOS detail section

### UI Consistency (UICONS)

- [ ] **UICONS-01**: All pages share consistent design tokens (colors, typography, spacing, card styles) from one synchronized Tailwind config
- [ ] **UICONS-02**: Navigation is consistent: desktop sidebar + mobile bottom nav across all student pages

## Future Requirements

- Content text update from Word file (psychological test questions, scenario scripts)
- Teacher/Parent full portal redesign beyond dashboard+SOS
- Admin portal redesign (not covered in this feedback)

## Out of Scope

- Backend API changes (this milestone is frontend-only UI redesign)
- New features or flows (only redesigning existing ones to match mockups)
- Mobile native app
- Content authoring (questions/scenarios come from Word file later)

## Traceability

| REQ-ID | Phase | Plan |
|--------|-------|------|
| HOME-01 | — | — |
| HOME-02 | — | — |
| AUTH-01 | — | — |
| AUTH-02 | — | — |
| DASH-01 | — | — |
| DASH-02 | — | — |
| DASH-03 | — | — |
| CHAT-01 | — | — |
| CHAT-02 | — | — |
| TEST-01 | — | — |
| TEST-02 | — | — |
| TEST-03 | — | — |
| CHECKIN-01 | — | — |
| CHECKIN-02 | — | — |
| SCENARIO-01 | — | — |
| SCENARIO-02 | — | — |
| SCENARIO-03 | — | — |
| TRUST-01 | — | — |
| SOS-01 | — | — |
| SOS-02 | — | — |
| SETTINGS-01 | — | — |
| ADULT-01 | — | — |
| ADULT-02 | — | — |
| ADULT-03 | — | — |
| UICONS-01 | — | — |
| UICONS-02 | — | — |
