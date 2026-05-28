# Phase 54: PWA Foundation & App Shell - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

App is installable, works offline (fallback), and loads instantly from cache on repeat visits. This phase enhances the existing PWA infrastructure (manifest, service worker, install prompt, offline page) to fully meet all success criteria — particularly app shell caching for <1s repeat paint.

</domain>

<decisions>
## Implementation Decisions

### App Shell Caching Strategy
- Pre-cache critical CSS + layout JS chunks in service worker to ensure <1s first paint on repeat visits
- Keep current `peerlight-shell-v1` versioning with version bump on deploy
- Use cache-first for static assets, network-first for pages (current approach enhanced)

### Verification & Gap Closure
- Add Lighthouse PWA check or manual audit to verify <1s first paint criterion
- Keep custom sw.js — no @next/pwa package (lighter, no sensitive data risk)
- Enhance existing sw.js to pre-cache app shell assets and verify all 5 success criteria pass

### the agent's Discretion
- Specific list of assets to add to SHELL_ASSETS array (layout chunks, fonts, critical CSS paths)
- Whether to add runtime caching rules for font files and static images

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/public/manifest.json` — complete manifest with correct name, icons, theme_color, display: standalone
- `frontend/public/sw.js` — service worker with install/activate/fetch handlers, API exclusion
- `frontend/components/pwa-register.tsx` — service worker registration + install prompt (visits >= 2)
- `frontend/app/offline/page.tsx` — Vietnamese offline page with retry button
- `frontend/app/layout.tsx` — root layout with manifest link, theme-color meta, PWARegister component

### Established Patterns
- Tailwind CSS with custom design tokens (primary, on-background, outline-variant)
- Dark mode support via ThemeProvider and class-based toggling
- Next.js app router with (authenticated) group layout
- Vietnamese-first UI copy

### Integration Points
- `frontend/app/layout.tsx` — PWARegister already mounted in root layout
- `frontend/public/sw.js` — service worker file served statically
- `frontend/public/manifest.json` — linked in root layout head

</code_context>

<specifics>
## Specific Ideas

- Existing implementation covers ~80% of success criteria already
- Main gap: sw.js SHELL_ASSETS only includes '/' and '/offline' — needs layout shell, fonts, critical CSS
- Success criterion 4 (repeat visits < 1s) requires broader pre-caching

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
