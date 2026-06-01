# Quick Task 260601-mac-ios-login: Fix iOS/macOS Safari Login Blocking (3rd Party Cookies) - Plan

**Date:** 2026-06-01

## Problem

Under Safari/macOS/iOS's Intelligent Tracking Prevention (ITP), third-party/cross-site cookies are blocked entirely by default. Because the frontend is deployed at `https://beyou-frontend.vercel.app` and the backend is at `https://beyou-backend.onrender.com`, standard cookie authentication relies on cross-site/third-party HttpOnly cookies. As a result, Safari refuses to save the session cookie, preventing subsequent queries from executing successfully.

## Solution

Configure NextJS/Vercel Same-Origin Rewrites (reverse proxying) to bypass cross-site cookie restrictions altogether:

1. **NextJS Rewrites:**
   In [frontend/next.config.ts](frontend/next.config.ts), define a same-origin proxy rewrite mapping `/api/:path*` to `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`.
   
2. **Relative Browser API Fetch:**
   In [frontend/lib/api.ts](frontend/lib/api.ts) and [frontend/lib/chat-api.ts](frontend/lib/chat-api.ts), modify the client-side fetch calls to use relative paths (`/api/...`) instead of cross-origin absolute paths when running in non-local browser contexts (`window.location.hostname` not `localhost` or `127.0.0.1`).
   
3. This creates a same-origin cookie structure for the browser (`Set-Cookie` domain matches `vercel.app`), which works perfectly even under maximum Apple Safari privacy/ITP settings.

## Verification

- Run full vitest UI/integration suite (`169 passed`).
- Run backend unit tests (`15 passed`).
