# Phase 17 UI Spec: Responsive Accessibility Baseline

**Created:** 2026-05-22
**Status:** Implemented

## Responsive Contract

- Representative public/auth/role-dashboard routes must not horizontally overflow at mobile, tablet, or desktop widths.
- Long emails, labels, cards, tables, and text blocks must wrap or scroll in their own container instead of widening the document.
- Touch targets remain at least the existing 44px/min-h-11 baseline.

## Accessibility Contract

- Keyboard focus must move to an interactive element on key public/auth/dashboard routes.
- Error states touched by this phase should expose `role=alert`.
- Async demo role entry should expose busy state while login is in progress.
- Reduced-motion preferences remain respected.

## Safety Contract

- Responsive and accessibility changes must not change authorization, role visibility, privacy defaults, or demo credential behavior.
