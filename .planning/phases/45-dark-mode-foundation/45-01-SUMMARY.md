---
status: complete
phase: 45
plan: 01
subsystem: frontend/theme
tags: [dark-mode, css-variables, theme-toggle, accessibility]
key-files:
  created:
    - frontend/components/theme-provider.tsx
  modified:
    - frontend/tailwind.config.ts
    - frontend/app/globals.css
    - frontend/app/layout.tsx
    - frontend/app/(authenticated)/layout.tsx
    - frontend/app/(authenticated)/student/notification-preferences/page.tsx
    - frontend/components/stitch-card.tsx
    - frontend/components/navigation/student-sidebar.tsx
    - frontend/components/navigation/mobile-bottom-nav.tsx
decisions:
  - Used class-based dark mode (darkMode: "class") for explicit user control
  - Only converted colors that need to change in dark mode to CSS vars (background, surface, on-background, outline, outline-variant); accent colors kept as static hex
  - Used inline script for flash prevention rather than a cookie-based approach
metrics:
  duration: ~4min
  completed: 2026-05-27
  tasks: 5
  files: 9
---

# Phase 45 Plan 01: Dark Mode Foundation Summary

CSS-only dark mode system with class-based toggle, localStorage persistence, and system preference detection.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Dark mode color system | 0e26d5c | darkMode:"class" in Tailwind, .dark CSS vars, dark body gradient |
| 2 | ThemeProvider component | 99fc3ad | React context, localStorage read/write, system media query listener |
| 3 | Integrate in root layout | 770754e | ThemeProvider wrapper, suppressHydrationWarning, inline flash-prevention script |
| 4 | Appearance toggle in settings | 004291f | Sáng/Tối/Hệ thống button group with useTheme() |
| 5 | Dark variants on core components | 230adf9 | Header, sidebar, bottom nav, stitch-card dark backgrounds |

## Verification

- `npx tsc --noEmit` passes for all source files (0 errors in non-test files)
- Pre-existing test file TS errors are unrelated to this phase

## Deviations from Plan

None - plan executed exactly as written.

## Architecture Notes

- Colors that vary between modes use CSS custom properties: `--background`, `--surface`, `--foreground`, `--outline`, `--outline-variant`
- Colors that look good in both modes (primary-container, student-blue, etc.) stay as static hex in Tailwind config
- Flash prevention: inline `<script>` reads localStorage before React hydrates, avoids FOUC
- ThemeProvider respects system preference changes in real-time when set to "system" mode
