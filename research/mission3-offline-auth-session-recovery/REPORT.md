# Closet Current Mission 3 — Offline authentication refresh and owner-private local recovery (HOLD)

**Exact compatible parent:** verified Mission 3 PR #946 HEAD `b37e518bb6e0c3b8f84f48773196a5c3af8d55fe`. Isolated research only. No changes to production, staging, hosted Supabase, or family wardrobes. **Family Alpha HOLD #255 remains active.**

## Verified risk in existing startup code

Before this milestone, when `public/auth.js` loaded a previously saved refresh token, the boot-time `request('token?grant_type=refresh_token',...)` attempted to contact hosted authentication. If a temporary offline condition, network timeout, server 5xx or rate-limit occurred, the outer boot catch immediately removed the `closet-current-auth-v1` session. The user's private IndexedDB originals were untouched but the login was forgotten, stranding the owner behind manual sign-in on reconnect and potentially causing another open tab to lock because its shared storage epoch changed.

**An offline snapshot is not authentication proof**. The app must never unlock local private closets based solely on locally cached user IDs or expired/unverified access tokens.

## Implementation

- Treat only retryable refresh failures (network TypeError, AbortError, HTTP 429, 5xx, and malformed server response) as pending. Keep the unchanged cached refresh credential in same-origin localStorage, display clear locked state, and never set `closetAuth.user` or publish private IndexedDB records without verified server response.
- On a real `online` event, retry by reloading ONLY if the same snapshot still exists, the app is not locked, no session has been verified and the owner has not begun entering a different login. The ordinary boot path then revalidates credentials against auth transport, repopulates private owner data only after verification and rotates tokens normally.
- If a refresh token receives explicit 400/401 invalid-credential response, remove it and require normal login. A cross-tab logout or replacement of the session snapshot suppresses the automatic retry; never resurrect another account.
- No offline authentication bypass; no weakening RLS, no cloud deletion, no cookie/token leakage into evidence. All case fixtures use synthetic tokens and native IndexedDB photos on localhost only.

## Tests and evidence

`tests/mission3-offline-auth-refresh-recovery.test.cjs` executes the exact unmodified auth startup module in a controlled DOM/network VM, covering offline, timeout, HTTP 503/429, invalid response, 401 hard revocation, changed other-tab session, manual sign-in form, late failure and successful verified recovery. It verifies the private shell is always hidden until successful verification.

`scripts/test-mission3-offline-auth-recovery-browser.mjs` runs real app loading under **Chromium and WebKit, each 320/390/430 CSS pixels**. Seeds synthetic original JPEG with SHA-256 and draft directly in a private native owner IndexedDB, simulates offline host refresh failure without a single live Supabase request, verifies private UI remains locked and stored session remains unchanged. Triggers a simulated reconnect with a local verified synthetic signed user, reloads and confirms original JPEG+draft byte/source integrity and resumed private state. Simulates cross-tab credential deletion while offline and a confirmed 401 refresh failure (which must remove token, not remove private original). Stores reproducible screenshots and a SHA-256 receipt. No physical phone or actual hosted Supabase interaction.

Strict pinned parent no-deploy CI runs full serial Node suite, all prior Mission 3 owner-private browser checks, disposable signed two-owner PostgreSQL Storage RLS and this exact new browser regression. **Do not claim this milestone passed until exact-head CI succeeds.**

## Remaining Mission 3 release requirements

This proves only online reauthorization after transient offline failure in synthetic browsers, **not offline private access**. Real Android Chrome and iPhone Safari/installed PWA validation, live hosted signed two-account Supabase recovery with explicit authorization, integration of recognition/3D acceptance and final owner-approved release still remain. PR must remain DRAFT and Family Alpha HOLD #255 open; no merge/deployment.
