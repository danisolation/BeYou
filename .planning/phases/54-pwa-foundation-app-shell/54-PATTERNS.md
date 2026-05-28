# Phase 54: PWA Foundation & App Shell - Pattern Map

**Mapped:** 2026-05-28
**Files analyzed:** 3 (modified/created)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `frontend/public/sw.js` | config | event-driven | Self (existing file to enhance) | exact |
| `frontend/scripts/inject-sw-assets.mjs` | utility | file-I/O | `frontend/scripts/phase33-frontend-baseline.mjs` | role-match |
| `frontend/package.json` | config | — | Self (add postbuild script) | exact |

## Pattern Assignments

### `frontend/public/sw.js` (config, event-driven) — MODIFY

**Analog:** Self — enhance existing patterns in place

**Current full file** (lines 1-37):
```javascript
const CACHE_NAME = 'peerlight-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/offline',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Never cache API calls (privacy)
  if (request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/offline');
        }
      });
    })
  );
});
```

**Enhancement targets:**
1. `SHELL_ASSETS` array — will be replaced at build time by inject script (keep as placeholder with `'/'` and `'/offline'`)
2. `fetch` handler — replace simple catch-all with differentiated caching:
   - `/api/*` → skip (privacy, already done)
   - `fonts.googleapis.com` / `fonts.gstatic.com` → stale-while-revalidate in separate `peerlight-fonts-v1` cache
   - `/_next/static/*` → cache-first (hashed = immutable), store in CACHE_NAME
   - `navigate` → network-first, fallback `/offline`
   - Other static → cache-first

**Key constraint:** Never cache `/api/` — privacy requirement for student psychological data.

---

### `frontend/scripts/inject-sw-assets.mjs` (utility, file-I/O) — CREATE

**Analog:** `frontend/scripts/phase33-frontend-baseline.mjs`

**Imports pattern** (lines 1-5):
```javascript
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, "..");
```

**Adapt for inject-sw-assets.mjs:**
```javascript
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, "..");
```

**Core pattern — file reading and path resolution:**
- Use `path.resolve(scriptDir, "..")` for frontend root (same as analog)
- Use `readFileSync` / `writeFileSync` (Node.js built-in only, no dependencies)
- Use `.mjs` extension with ESM imports (project convention from all `scripts/*.mjs` files)

**Script responsibility:**
1. Read `.next/BUILD_ID`
2. Read `.next/static/{buildId}/_buildManifest.js`
3. Extract chunk paths for `/` route + framework chunks
4. Read `public/sw.js`, replace `SHELL_ASSETS` array via regex
5. Replace `CACHE_NAME` with timestamp-versioned name
6. Write updated `public/sw.js`

**Console output convention** (from `deployment-guardrails.mjs`):
```javascript
// Scripts use console.log for status output
console.log(`SW updated: ${assetPaths.length} assets, cache: ${newVersion}`);
```

---

### `frontend/package.json` (config) — MODIFY

**Analog:** Self (lines 5-17)

**Current scripts section:**
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "test": "vitest run",
  "guard:deploy": "node scripts/deployment-guardrails.mjs",
  ...
}
```

**Pattern to follow:** Add a `postbuild` script that runs after `build`:
```json
"postbuild": "node scripts/inject-sw-assets.mjs"
```

Note: npm/yarn/pnpm auto-run `postbuild` after `build` completes. This matches the project's existing pattern of standalone `.mjs` scripts invoked via `node scripts/...`.

---

## Shared Patterns

### ESM Script Convention
**Source:** All files in `frontend/scripts/*.mjs`
**Apply to:** `inject-sw-assets.mjs`
```javascript
// ESM module with node: protocol imports
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve paths relative to script location
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, "..");
```

### Service Worker Privacy Guard
**Source:** `frontend/public/sw.js` line 26
**Apply to:** Any fetch handler modification
```javascript
// ABSOLUTE RULE — never cache API calls (student psychological data)
if (request.url.includes('/api/')) return;
```

### Tailwind Design Token Classes
**Source:** `frontend/components/pwa-register.tsx` and `frontend/app/offline/page.tsx`
**Apply to:** Any UI modifications (none expected this phase)
```typescript
// Color tokens: text-on-background, bg-primary, border-outline-variant
// Spacing: p-4, rounded-2xl, gap-2
// Dark mode: dark:bg-[#1a2940]
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All files have adequate analogs |

## Metadata

**Analog search scope:** `frontend/scripts/`, `frontend/public/`, `frontend/components/`, `frontend/package.json`
**Files scanned:** 6
**Pattern extraction date:** 2026-05-28
