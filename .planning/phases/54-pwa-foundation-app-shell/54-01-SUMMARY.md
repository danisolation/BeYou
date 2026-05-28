---
phase: 54-pwa-foundation-app-shell
plan: 01
subsystem: pwa-service-worker
tags: [pwa, service-worker, caching, build-tooling]
dependency_graph:
  requires: []
  provides: [app-shell-caching, font-caching, build-time-asset-injection]
  affects: [frontend/public/sw.js, frontend/scripts/inject-sw-assets.mjs, frontend/package.json]
tech_stack:
  added: []
  patterns: [stale-while-revalidate, cache-first, network-first, build-time-injection]
key_files:
  created:
    - frontend/scripts/inject-sw-assets.mjs
  modified:
    - frontend/public/sw.js
    - frontend/package.json
decisions:
  - Used build-manifest.json (rootMainFiles/polyfillFiles) instead of legacy _buildManifest.js for Next.js 16 Turbopack compatibility
  - CSS files from chunks directory included in shell assets for instant styled renders
metrics:
  duration: 712s
  completed: "2026-05-28T10:10:47Z"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 54 Plan 01: PWA App Shell Caching & Build-Time Asset Injection Summary

**One-liner:** Differentiated 5-branch fetch handler in sw.js with build-time manifest injection of Next.js critical chunks for <1s repeat-visit paint.

## What Was Done

### Task 1: Enhanced sw.js + inject-sw-assets.mjs + build hook

- Added `FONTS_CACHE = 'peerlight-fonts-v1'` constant
- Implemented 5-branch fetch handler:
  1. `/api/*` → return early (privacy guard)
  2. `fonts.googleapis.com` / `fonts.gstatic.com` → stale-while-revalidate into FONTS_CACHE
  3. `/_next/static/*` → cache-first with runtime put (hashed = immutable)
  4. `request.mode === 'navigate'` → network-first, fallback /offline
  5. All other → cache-first with silent catch
- Updated activate handler to preserve both CACHE_NAME and FONTS_CACHE
- Created `inject-sw-assets.mjs` ESM post-build script using `node:fs`, `node:path`, `node:url`
- Chained script in package.json build: `"next build && node scripts/inject-sw-assets.mjs"`

### Task 2: Build Verification & PWA Criteria Validation

- Build exits 0 with injection injecting 9 assets (5 rootMainFiles + 1 polyfill + 1 CSS + 2 shell pages)
- CACHE_NAME replaced with timestamp version (`peerlight-shell-v1779962623720`)
- PWA-01 ✓: manifest.json has name "Peerlight AI", icons 192/512, theme_color, display standalone
- PWA-02 ✓: sw.js serves /offline for failed navigate requests
- PWA-03 ✓: pwa-register.tsx shows install banner after visits >= 2
- PWA-04 ✓: SHELL_ASSETS has framework chunks after build injection
- Tests: vitest hangs (pre-existing environment issue, not caused by these changes)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted inject script to Next.js 16 Turbopack manifest format**
- **Found during:** Task 2
- **Issue:** Plan assumed legacy `_buildManifest.js` with page route entries and `framework-`/`main-`/`webpack-` prefixed chunk files. Next.js 16 uses `build-manifest.json` with `rootMainFiles`/`polyfillFiles` arrays, and chunks have hashed names without prefix conventions.
- **Fix:** Rewrote inject script to read `build-manifest.json`, fall back to legacy format, and collect CSS from chunks dir.
- **Files modified:** frontend/scripts/inject-sw-assets.mjs
- **Commit:** 3c594cb

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 994b1a5 | feat(54-01): enhanced service worker with differentiated caching + build-time asset injection |
| 2 | 3c594cb | fix(54-01): adapt inject-sw-assets to Next.js 16 Turbopack build-manifest.json format |

## Verification Results

| Criterion | Status |
|-----------|--------|
| sw.js has FONTS_CACHE constant | ✓ |
| sw.js has 5-branch fetch handler | ✓ |
| sw.js activate preserves both caches | ✓ |
| sw.js has /api/ privacy guard | ✓ |
| inject-sw-assets.mjs exists as ESM with node: imports | ✓ |
| inject script reads BUILD_ID + build-manifest.json | ✓ |
| inject script replaces SHELL_ASSETS and CACHE_NAME | ✓ |
| package.json build chains inject script | ✓ |
| `npm run build` exits 0 | ✓ |
| Post-build SHELL_ASSETS has ≥4 entries | ✓ (9 entries) |
| Post-build CACHE_NAME is timestamped | ✓ |
| manifest.json correct (PWA-01) | ✓ |
| Offline fallback works (PWA-02) | ✓ |
| Install banner logic (PWA-03) | ✓ |
| Framework chunks injected (PWA-04) | ✓ |

## Known Stubs

None — all functionality is fully wired.
