# Closet Current — Main Priority #146 / NATIVE-OWNER-REVIEWED-CLOUD-UI-146

**RESEARCH ONLY · Family Alpha Issue #255 HOLD · DRAFT UNMERGED · NO PRODUCTION, EXISTING STAGING, LIVE SUPABASE MODIFICATION OR DEPLOYMENT.**

## Provenance

- **Parent:** independently verified P145 [draft PR #699](https://github.com/nickhaney916-lang/Closet-Current/pull/699), exact HEAD `c69dc9ef9b264759e99a028f549569111e5efb06`, [green no-deploy CI #42406701702](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42406701702).
- **Protected research modules, unchanged:** P134 `createLocalRemoteFence134` (owner-approved remote backup, local+remote SHA/source snapshot consent) and P137 `createCloudRestoreGuard137` (owner-reviewed atomic local restore and source/manifest revision checks), delegating to existing P129/P128/P126 original+cutout SHA and IndexedDB guarantees.
- **Why:** P142's actual cross-browser recovery UI worked only as a standalone research HTML page. P143 composed the improved app and recovery source. P145 proved an exact-flag, loopback-only legacy cloud writer HOLD. The actual existing Closet Current account menu had not been wired to the protected cloud research services.

## Implemented real app integration

- `public/cloud-backup-bridge.js` now invokes an ESM adapter **only** for exact `?ownerReview145=research&ownerReview146=research` on loopback HTTP (`localhost`, `127.0.0.1`, `[::1]`).
- The existing `public/cloud-backup.js` P145 controller is paused and confirmed to return `{paused:true}` **before** the new research bridge mounts. The normal site code and older hosted sync remain unchanged in all other modes.
- `research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs` dynamically installs *functional* Compare, Back Up and Restore buttons in the **actual app's** My Account menu, plus an accessible cancel/confirm modal and live privacy-safe count-only status. Unlike P142, this is an opt-in integration of the ordinary app's account UI and its owner-specific IndexedDB, not a separate HTML prototype.
- The adapter calls the unchanged real P134 + P137 protected cloud methods, not a fake reimplementation of their acceptance logic.
- Enforces **synthetic unsigned token prefix** `p146-synthetic-local-only-`. A real account JWT is refused; fetch is restricted to loopback same-origin fake private HTTP endpoints, without credentials or redirects.
- The actual app rehydrates clothing records, saved outfits and inspiration state after verified atomic restore; owner session lock/pagehide revokes pending approval and removes controls. Error/status messages exclude photos, clothing descriptions, hashes, raw JWTs and object paths.
- No private personal photos are used. Browser harness loads SHA-pinned, independently licensed Commons JPEG `commons-0002` plus a separately reencoded cutout, with the source-review fields previously accepted by P142.

## Independent tests

- Node gating tests cover exact loopback flags, nonlocal/HTTPS refusal, and default app path preserved; P145 legacy controller hold tests retained.
- New `scripts/test-native-owner-reviewed-cloud-ui-146-browser.mjs` mounts the **real** `public/index.html` scripts (synthetic auth interception) with a disposable local private Storage/revision-CAS HTTP server in genuine Chromium and WebKit at 320/390/430 CSS px.
- Per viewport: actual account menu count-only preview without JPEG fetch, create-only backup storing two immutable owner SHA JPEGs, cancel restore preserving local color/saved outfit, approved P137 atomic restore restoring photo source/color/saved outfit, remote revision mutation during owner backup confirmation refused, unrelated synthetic account denied private object, account logout revocation at 320, six labeled screenshots. No live signed auth and no third-party network.
- Strict dedicated no-deploy GitHub Actions ensures exact P145 parent and exactly six approved path changes, syntax, focused and full Node regression suite, app build and six real mobile-width browser scenarios. Machine-readable results and genuine screenshots must be archived.

## Release limits and next independent gates

This is the highest-value **actual app research integration** of protected owner-reviewed cloud functionality, but it is only a *synthetic local-cloud* research mode. It deliberately refuses a real Supabase JWT and cannot be deployed as a shipping feature.

**Unverified:** hosted signer-backed two-account JWT/RLS/Storage acceptance; real internet/cloud account transitions, real physical Android/iPhone camera/PWA; memory stability with 1,000 genuine owner garments; full automatic model recognition accuracy; arbitrary photographed garment photorealistic fitting. A local fake HTTP CAS service is not a hosted RLS policy and there is no cross-system distributed atomic commit guarantee.

Family Alpha Issue #255 remains **HOLD**. P146 is verified **only** if dedicated exact-head no-deploy CI completes successfully. Never merge or deploy without separate authorization.
