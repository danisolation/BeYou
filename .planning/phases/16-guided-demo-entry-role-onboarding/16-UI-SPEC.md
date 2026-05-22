# Phase 16 UI Spec: Guided Demo Entry & Role Onboarding

**Created:** 2026-05-22
**Status:** Implemented

## Surfaces

- Public entry page `/`
- Manual login page `/login`
- Student dashboard `/student`
- Teacher dashboard `/teacher`
- Parent dashboard `/parent`
- Admin dashboard `/admin`

## UX Requirements

- Public entry must explain BeYou's purpose, roles, privacy boundary, non-clinical limits, and SOS boundary in Vietnamese.
- Demo role entry must use large touch-friendly buttons and avoid requiring manual credential copying.
- Dashboard guide cards must be concise, scannable, and role-specific.
- Demo guidance must reinforce support-not-surveillance and demo/real-data separation.

## Responsive Contract

- Public entry uses one column on mobile and two columns on larger screens.
- Demo role buttons wrap into a two-column grid when width allows.
- Dashboard guide steps use one column on mobile and three columns on medium screens.
- Action links stack on mobile and wrap horizontally on larger screens.

## Privacy/Safety Contract

- No guide card may expose raw self-check answers, raw mood notes, chatbot transcripts, credentials, secrets, exports, or per-student risk rankings.
- Copy must state that demo data is fictional and that BeYou is non-clinical.
