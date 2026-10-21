# Auth session retirement / in-flight refresh safety — October 20, 2026

**Status:** isolated draft development change. No production deployment, hosted Auth configuration change, email sent, database migration, paid service or Drive Duel change.

## Customer-facing failure prevented

A signed-in browser could request a token refresh and then select **Log out** while the refresh remained pending. Previously the remote logout was awaited before local session removal. A late refresh might call `showUser`, write a fresh token to localStorage or momentarily reopen the previous wardrobe during signout. Auth-specific cancellation was weaker than the existing cloud backup generation barrier.

## Correction

- Logout invalidates the session and increments an in-memory auth version **before** sending any request. It clears the stored token and hides the private app shell synchronously, disables a second login while signout completes, and reloads even if the network logout fails.
- Token refresh records its originating exact session object, user ID and auth version; late responses reject without changing the current user, UI or localStorage. Concurrent refresh requests still share one network request, and only the currently active refresh clears its own in-flight marker.
- Successful ordinary login/session restoration advances the auth version; successful refresh of that same session keeps it. No service role key or Auth policy has changed.

## Verification

`tests/auth.test.cjs` adds regression tests that hold refresh and logout responses, prove old credentials never return after logout, prevent duplicate logout calls and verify normal concurrent refresh rotation. The isolated workflow `.github/workflows/auth-session-race-qa.yml` checks Node syntax, targeted Auth + cloud-session tests, full build/Node suite, original photo/camera review provenance and the production-release veto.

GitHub Actions exact-head results must be checked before treating this coding priority as verified. Browser simulator results cannot prove external email inbox delivery or physical phone behavior.

## Still required before external pilot

**Not done by this PR:** verify the canonical hosted domain vs Auth redirect allowlist; configure and validate sender/SMTP and real signup/recovery email in supported inboxes; execute separate physical Android/iPhone tests; owner approval of staged Supabase security changes; independently reviewed garment masks and figure licensing. Do not merge or deploy this draft without separate release approval.
