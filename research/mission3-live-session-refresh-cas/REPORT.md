# Closet Current — Mission 3 in-session refresh token compare-and-swap (HOLD)

**Compatible baseline**: verified Mission 3 PR #949 exact HEAD `b9c8ac17b4ec866b4edc0b7c2450f8924ec3f9f9`. **Research branch only, no deployment.** Family Alpha HOLD #255 stays OPEN.

## Newly identified account/session risk

An authenticated owner can request a token through `closetAuth.getAccessToken({force:true})` during cloud backup or owner-reviewed restore. Previously, the in-session refresh path awaited a remote Auth response and checked only the local **epoch** and returned user ID. Two same-origin tabs can rotate the same signed account's refresh token without changing the epoch. A slower earlier refresh could then write an older token pair over a newer session in localStorage, breaking the still-valid account and possibly causing a later private-wardrobe cross-tab logout. A definitively invalid/revoked refresh (401 or `invalid_grant`) also left the existing authenticated local app shell unlocked without requiring re-login.

## Isolated runtime implementation

- `stillCurrent()` now requires both the original login epoch and an **exact-match serialized credential snapshot** (`storedSession`) in same-origin localStorage. An externally rotated/replaced token, including one with an unchanged account ID and epoch, revokes the prior tab's authority at its next event/owner check; no stale refresh may mutate the newer tab's login.
- At in-session refresh start, capture the exact expected owner ID, serialized credential and refresh token before awaiting the network. Once the request returns, reassert owner, auth object, and unchanged credential bytes before `showUser()`; accept only the verified original user and a new access and refresh token. No refresh result may overwrite a newer snapshot.
- On confirmed invalid/revoked refresh (401 or explicit invalid grant/invalid refresh token), delete the credential **only if this tab still owns the unchanged exact snapshot**, lock the app shell and trigger existing owner-private cancellation/IndexedDB cleanup. A cross-tab credential mutation is protected from deletion.
- On temporary network errors, preserve an existing verified in-memory owner and its unchanged credential, with no fabricated successful token update. Subsequent valid refresh may recover as normal.
- Existing offline boot recovery from PR #949 remains fail-closed; no offline sign-in bypass and no hosting/production changes. Other tabs may require a fresh verified reload after token rotation, which is intentionally safer than sharing stale refresh tokens.

## Verification and scope

`tests/mission3-live-session-refresh-cas.test.cjs` runs actual source `public/auth.js` in a synthetic browser VM, with explicit delayed responses. It measures concurrent one-request refresh, exact-session CAS, same-owner same-epoch storage change, wrong-owner response, 401/invalid_grant, rejection after newer tab writes, transient disconnection, missing new token, and valid subsequent rotation.

`scripts/test-mission3-live-session-refresh-cas-browser.mjs` launches **actual Chromium and WebKit at 320/390/430 widths** and an origin-sharing second tab. It uses a native owner-private IndexedDB synthetic original JPEG whose SHA-256 remains stable while the first tab's held refresh response is overtaken by the second tab's same-epoch token rotation. It verifies no old overwrite, app shell lock, invalid 401 lock/removal, temporary network failure retained session and successful re-verification. Auth endpoint is route-stubbed locally; all other external requests are blocked. Screenshots and SHA receipts are synthetic, not physical device or live Supabase evidence.

New **five-path exact-parent no-deploy CI** runs these tests, full serial Node suite and all inherited Mission 3 browser/RLS tests. **Do not claim this milestone complete until exact-head CI passes.**

## Release blockers remain

No physical Android Chrome/iPhone Safari installed PWA testing, authorized hosted two-account Supabase Auth/Storage acceptance, independent real-photo recognition accuracy, independently verified photo-to-3D fidelity or final owner-approved branch integration is claimed. Do NOT merge PR, modify `main`/production/staging/private wardrobes, or lift Family Alpha HOLD #255.
