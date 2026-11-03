# AUTH-EPOCH-01 — Native Closet Current auth to owner-private 3D session lease

**Isolated MAIN-CONTROLLER research, DRAFT/HOLD, no production deployment, no live RLS claim.**

## Verified parent and integration gap

- Starting exact SHA: E2E PR #547 `e3dce3658d570bc555e8027cc75c13793b857c7b`, dedicated browser Actions #41718209162 SUCCESS.
- Independent original donor PR #541 exact SHA `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`.
- Real existing `public/auth.js` exposes `window.closetAuth.ready`, `.user` and `.getAccessToken` but NOT `.getSessionGeneration()`.
- Source owner 3D controller in PR #541 refuses missing monotonic generation; previous E2E research #547 uses explicit **simulated** epoch for two test accounts, not production authenticated state.
- Original native logout awaits remote request BEFORE full-page reload. Pending owner read/3D operations can remain in flight until page reload. This research adapter revokes immediately on logout click capture, pagehide, origin-local cross-tab storage event, changed native token, changed owner, expired/malformed native storage, or sign-in gate reset.

## Implementation

`native-session-epoch.mjs` creates an independent, deliberately narrow object for existing donor 3D auth: `{ready, user, getSessionGeneration(), getAccessToken()}`. **No modification, replacement, monkey-patch, third-party call, cloud schema/storage write, or source change** to native `window.closetAuth`. Native auth must first establish its `ready` user and return its own access token; user ID, localStorage native access/refresh tokens and expiry must match before admission. The adapter only exposes a monotonic generation counter; token values stay in private closures, are never logged or sent elsewhere.

A token refresh for the SAME owner intentionally revokes the prior generation; a fresh deliberate `attest()` and independent donor controller `refresh()` is required before any subsequent private outfit read/write. This favors fail-closed behavior over silently continuing with a stale outfit and does not promise seamless UX on every token refresh.

`mount-real-native-e2e.mjs` passes the delegated research auth contract into the **unchanged** E2E PR #547 adapter, behind explicit `?authEpoch01=after&captureProof01=after&index04=after` and donor-asset availability. This is NOT attached to production HTML.

## Real browser test

Loads the **actual** `public/index.html` and **actual unchanged** `public/auth.js`, executes actual native log in, native refresh and native log out, and opens actual `closet-current-user-fixture-native-A/B` IndexedDB via the exact PR #541 `createOwnerOutfit3DController` + existing `createExistingClosetOutfitIO`. The HTTP authentication endpoint is **fully intercepted** with clearly labeled synthetic accounts (not a fake native auth object, but **NOT live Supabase**). Six cases: Chromium + WebKit at widths 320/390/430. 7 authentic screen states per case = 42 browser PNG screenshots, six independently SHA-verified contact sheets.

The assertions require proper read after native login, token refresh invalidation of all old 3D/private data leases, actual independent re-attestation, owner spoof failure, instant actual native logout invalidation before async response, native login to B with separate owner DB, and pagehide revocation. No requests go to real Supabase or other third parties. The existing PR #547 full E2E 163-bone browser suite already passed and is the immutable research parent; this branch specifically closes the authentic client-side session-epoch contract.

## No false acceptance

- Synthetic HTTP auth responses do **not** demonstrate a genuinely verified Supabase account or row-level-security rules, authorization token revocation by the remote backend, real cross-device sync, or live production browser session.
- `localStorage` is native to the existing app; new code never writes it. These checks enforce app-client stale-session invalidation, not server authorization.
- This research does not verify physical Android/iPhone cameras, offline token expiration, full WebKit GPU clothing accuracy, garment-source inference, arbitrary user garment 3D fitting, realtime render physics or human 10/10 photorealism.
- No staging/production publish, no merge, no default-enabled feature, no auth, source-photo, E2E #547, recognition, footage or parallel #17 footwear modifications.
- Family Alpha #255 remains **HOLD**.

## Definition of done

Dedicated exact-SHA GitHub Actions SUCCESS, all inherited app tests green, genuine six-browser donor account evidence, all 42 image SHA checks and six sheets, PR body with verified SHA/artifact, and honest release blockers. No weakening of owner, generation or privacy tests.
