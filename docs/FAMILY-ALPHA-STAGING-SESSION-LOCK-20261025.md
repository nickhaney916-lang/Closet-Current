# Closet Current — staging terminal-session and cross-tab UI lock

**Family Alpha #255 · October 25, 2026 · Draft/HOLD · staging source build ONLY.**

## Verified issue and scope

Independent Work Assignment #26 identified a real defect in the **actual staged Auth transform**: after a successful mock login, a terminal refresh error (`refresh_token_not_found`) rejected `getAccessToken` but retained the user identity, generation, saved local Auth token and visible private app shell. The original audit's passing test **characterized the open defect**; it was not a privacy acceptance test. Its separate draft PR #294 remains unchanged.

This integration fixes that exact staging-local lifecycle. It does not assert cloud authorization bypass, invalidate already issued Supabase JWTs, change SQL row/storage policy, access customer data, or alter production `public/auth.js`.

## Implementation

The reusable `scripts/family-alpha-stage-session-hardening.mjs` applies a **strict exact-source transform** only after `stageAuthSource` has moved all login URLs, publishable keys, redirect and storage namespace to staging. It changes only the generated `dist-family-alpha-staging-auth-hold/auth.js` and the stage-specific derived development candidate. The original public authentication source and normal `dist/` are preserved.

- Terminal provider refresh rejection (`refresh_token_not_found`, `invalid_refresh_token`, `invalid_grant`, `session_not_found`, `session_expired`, `refresh_token_already_used`, HTTP 401/403), missing local refresh token, or unexpected refreshed **owner** immediately invalidate local user/session, increment generation, clear the stage-only localStorage token, hide app shell, reveal Auth gate, invalidate pending cloud work, dispatch avatar/session event and request a reload to purge old IndexedDB connections/photo objects.
- Transient offline TypeError, timeout, rate limiting (429), and service errors (5xx) reject the request **without erasing local session**. They do not falsely assert provider revocation.
- A staging auth-key `storage` event from another tab forces local lock on the previously signed-in tab; removal or replacement is treated conservatively. Delayed password login, signup, recovery and bootstrap token confirmation are fenced by session generation to avoid unlocking after a cross-tab change.
- The explicit `getAccessToken` generation and owner guards are retained. All backend URLs remain staging-only. The frontend UI guard is defense in depth; only deployed RLS/Storage is a server-side authorization boundary.

## Verification standards

`tests/family-alpha-stage-session-lock.test.mjs` runs the **actual stage-transformed code** in synthetic Node VM DOM/Auth with fabricated users. Its assertions are true **regression acceptance tests**: stale UI must be locked; a passing characterization of the previous bug is not accepted. It includes terminal, transient, owner mismatch, cross-tab, delayed login, and URL isolation scenarios.

The no-deploy CI rebuilds disabled staging Auth, retained recognition/2D candidate and protected preview HOLD artifact, runs targeted tests and the full Node suite. Nothing sends email, creates users, connects to live Supabase, deploys to Cloudflare or uses photos.

## Remaining release blockers

The main staging root still hosts only the Cloudflare Access placeholder. Independent #26 needs explicit operator follow-up on current direct-signup restrictions, registered callback, tested unauthorized browser/alias access and real JWT owner A/B/Storage tests. Existing Resend SMTP delivery is an email-transport milestone, not end-to-end account login. The human-reviewed 2D avatar stage rollout remains independently **OFF** until explicit owner approval. Physical Android/iPhone camera and four-person family acceptance are also unverified.

**No merge, no staging/prod/SMTP/DNS/backend changes, no real customer data, no paid AI, no spend, no Drive Duel. Family Alpha HOLD.**
