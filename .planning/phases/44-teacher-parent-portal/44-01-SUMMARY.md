---
status: complete
phase: 44
plan: 01
subsystem: teacher-parent-portal
tags: [chat, dashboard, sos, design-tokens, card-layout]
key-files:
  created:
    - frontend/app/(authenticated)/teacher/chat/page.tsx
    - frontend/app/(authenticated)/parent/chat/page.tsx
  modified:
    - frontend/app/(authenticated)/teacher/page.tsx
    - frontend/app/(authenticated)/parent/page.tsx
    - frontend/app/(authenticated)/teacher/sos-alerts/[alertId]/page.tsx
    - frontend/app/(authenticated)/parent/sos-alerts/[alertId]/page.tsx
    - frontend/components/sos-alert-detail.tsx
    - frontend/lib/chat-api.ts
    - backend/app/api/chat.py
    - backend/app/services/chat.py
decisions:
  - Reused ChatThread model with student_id as generic owner_id for adult chat (no schema change needed)
  - Adult chat skips SOS safety escalation logic (no SOS suggestions for teachers/parents)
  - Backend routes added for /teacher/chat/* and /parent/chat/* with role enforcement
metrics:
  duration: ~15min
  completed: 2025-01-28
  tasks: 4
  files-changed: 10
---

# Phase 44 Plan 01: Teacher/Parent Portal Updates Summary

**One-liner:** Card-based dashboard redesign for teacher/parent portals with Peerlight AI chat integration and simplified SOS views using design tokens.

## What Was Done

### Task 1: Peerlight AI Chat for Teacher/Parent
- Created `frontend/app/(authenticated)/teacher/chat/page.tsx` — full chat page matching student design
- Created `frontend/app/(authenticated)/parent/chat/page.tsx` — same pattern, parent-focused copy
- Added frontend API helpers: `sendTeacherChatMessage`, `listTeacherChatThreads`, `getTeacherChatTranscript` (and parent equivalents)
- Added backend routes in `backend/app/api/chat.py` for `/teacher/chat/*` and `/parent/chat/*`
- Added `send_adult_chat_message`, `list_adult_chat_threads`, `get_adult_chat_transcript` service functions
- Adult chat uses same AI provider but without SOS safety escalation

### Task 2: Teacher Dashboard Redesign
- Replaced `AdultStudentList` component with `StitchCard` grid (variant="circular")
- Three cards: Học sinh liên kết (Users), Cảnh báo SOS (ShieldAlert), Peerlight AI (Bot)
- Removed teacher assessments and evaluations sections

### Task 3: Parent Dashboard Redesign
- Same card-based layout as teacher
- Three cards: Con của bạn (Users), Cảnh báo SOS (ShieldAlert), Peerlight AI (Bot)
- Read-only focused descriptions

### Task 4: SOS Alert Detail Simplification
- Restyled `sos-alert-detail.tsx` with design tokens (rounded-card, border-outline-variant, bg-surface)
- Removed verbose role explanation sections
- Simplified to essential sections: header with student info, status/severity, timeline, teacher controls
- Added proper `LoadingState` component to page wrappers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed OptionalDashboardResult type access**
- **Found during:** TypeScript verification after Task 2/3
- **Issue:** `dashboardData.notifications?.length` doesn't work because notifications is `OptionalDashboardResult<T>` (union type), not a direct array
- **Fix:** Changed to `dashboardData.notifications.status === "ready" ? dashboardData.notifications.data.length : 0`
- **Files modified:** teacher/page.tsx, parent/page.tsx
- **Commit:** 113bbc8

## Verification

```
cd frontend && npx tsc --noEmit
# Result: 0 errors in source files (pre-existing test file errors only)
```

## Self-Check: PASSED
