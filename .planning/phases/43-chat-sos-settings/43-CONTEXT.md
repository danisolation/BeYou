# Phase 43: Chat, SOS, Trusted Adults & Settings - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (UI phase with mockup reference)

<domain>
## Phase Boundary

Redesign Peerlight AI chat (mobile hamburger menu), SOS page (2-state confirmation + overlay), Trusted Adults page (match mockup), and Settings page (combine check-in + SOS settings).

</domain>

<decisions>
## Implementation Decisions

### Peerlight AI Chat
- Add hamburger menu (≡) button on mobile for sidebar/conversation history
- Ensure "Peerlight AI" naming is consistent everywhere
- Keep existing chat logic and API integration

### SOS Page
- Two states:
  1. Initial confirmation: "Bạn có chắc chắn cần hỗ trợ khẩn cấp?" with a prominent button "Đúng, tôi cần giúp ngay"
  2. After pressing: Shows activated overlay with info about what happens next (adults notified, etc.)
- SOS should be its own route, not inline on dashboard
- Use error/destructive colors for SOS (red theme)

### Trusted Adults (Người lớn tin tưởng)
- Keep existing support-plan page as-is for now
- Restyle to match Stitch mockup aesthetic (design tokens)
- Show linked adults as cards

### Settings (Cài đặt)
- Combine check-in notification settings AND SOS settings into one page
- Current notification-preferences page becomes the unified settings page
- Sections: notification preferences, check-in reminders, SOS contacts/sharing preferences

### Agent's Discretion
- SOS page URL (use /student/sos or modify existing dashboard section)
- How hamburger menu animates (slide-in drawer or dropdown)
- Settings page section order

</decisions>

<code_context>
## Existing Code Insights

### Current Pages
- frontend/app/(authenticated)/student/chat/ — AI chat page
- frontend/app/(authenticated)/student/support-plan/ — trusted adults page
- frontend/app/(authenticated)/student/notification-preferences/ — settings page
- SOS currently lives inline on the student dashboard (now removed in Phase 41)

### Integration Points
- Chat: existing chat API, conversation management
- SOS: /api/student/sos endpoint, SOS alert creation
- Support plan: /api/student/support-plan endpoint
- Notification prefs: /api/student/notification-preferences endpoint

</code_context>

<specifics>
## Specific Ideas

- Chat hamburger: a slide-in drawer from left showing conversation history on mobile
- SOS page: full-screen overlay when activated, calming but urgent design
- Settings: clean sections with toggles and options

</specifics>

<deferred>
## Deferred Ideas

- SOS email delivery settings (backend feature, not UI)
- Advanced chat features (voice, attachments)

</deferred>
