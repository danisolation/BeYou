# Quick Task 260601-mac-ios-login: Fix iOS/macOS Safari Login Blocking (3rd Party Cookies) - Summary

**Completed:** 2026-06-01
**Commit:** Pending

## Problem

Due to Apple Safari/iOS Intelligent Tracking Prevention (ITP), third-party (cross-site) cookie sharing is disabled by default. When visiting `https://beyou-frontend.vercel.app`, any HttpOnly session cookies set by `https://beyou-backend.onrender.com` are dropped by the browser. This blocks a user from staying logged in on iPhone and Mac Safari.

## Solution

Implemented same-origin routing/reverse proxy via NextJS rewrites on Vercel:

1. **Proxy Rewrites:**
   Added a `rewrites` configuration block to `frontend/next.config.ts`, mapping `/api/:path*` to the destination backend API.
   
2. **Relative Client Routing:**
   Updated `apiUrl` in `frontend/lib/api.ts` and `sendChatMessageStream` in `frontend/lib/chat-api.ts` to use relative routing in browser environments (while keeping JSDOM/localhost fully operational under absolute URLs to ensure test and local dev environments remain intact).

This allows cookies to be set under the same-origin (`vercel.app`), fully bypassing Safari's third-party cookie blocking.

## Files Modified

| File | Change |
|------|--------|
| `frontend/next.config.ts` | Configured edge-rewrites for same-origin proxy of `/api/:path*` requests |
| `frontend/lib/api.ts` | Configured client-side browser requests to use relative `/api/...` paths |
| `frontend/lib/chat-api.ts` | Configured streaming browser requests to use relative `/api/...` paths |

## Verification

- `npm run test` -> Passed 169/169 frontend tests.
- `pytest` -> Passed 15/15 CSRF fallback / security tests.
