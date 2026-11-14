# MAIN1054 Mission 4 M16 — Refuse stale original-photo JPEG display after same-owner login replacement

## Proven starting point
Verified M15 [draft #1118](https://github.com/nickhaney916-lang/Closet-Current/pull/1118) exact immutable HEAD `8f9b6975b48e27833b32d6b2b3a17eab60a231ec` passed [2/2 no-deploy GitHub Actions #43544200929](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43544200929): 16/16 C61 real-source-numeric 3D NO-GO test fixtures, 32/32 private source-to-outfit, 8/8 native M3 auth lease, 2,003/2,003 inherited Node, 54/54 native P880 owner-review Chromium/WebKit, 12/12 signed original JPEG 2D browser. Mission 2 actual C61 mesh-strain quality still fails; 3D remains NO-GO.

M14 already imported the exact independent Mission 3 #1100 `currentPhotoOwnerSession167()` provider with **authRef, privateDbRef and operationEpoch**. But M15 `research/main-thread-integration-1054/native-2d-preview.mjs` STILL compared only owner ID, persisted token epoch and DB name **after the verified original JPEGs were displayed**. If a same-ID login replaced the actual auth object, or the owner-private IndexedDB connection changed without a synchronous `closet:session-locked` redraw, a `focus`/visibility status check could consider the stale original JPEGs current. This is a source-identified privacy contract gap, **not** proof that real accounts leaked data.

## Narrow source fix
- Use the **existing authentic M14/M3 provider refs**: verify signed owner, exact auth object, exact private DB connection, exact capture-generation number, matching DB name, current auth `user.id`, and callable synchronous `authRef.assertCurrent()` at each real source-to-viewer lease check. Read-only comparison only; refs never appear in DOM, return JSON, model scores or public logs.
- Wrap the current owner-session provider in a fail-closed guard for expired tokens or thrown auth assertion; old image pixels are removed rather than raising an uncaught focus event.
- Recheck exact session **before native board async read**, after every original SHA and private data read, before displaying the original JPEGs and on focus/visibility/status polling. A same-user relogin with identical stored strings is *not* the same session.
- Maintain original 2D fallback and C61 explicit `renderAuthorized3D:false`, `releaseAuthorized:false`. Do not remove user photos, delete their private wardrobe, break manual recognition correction or introduce a new model.
- 15 synthetic SOURCE-EXECUTED native original-photo preview tests: already-visible old photo revoked on same-ID auth/DB replacement and capture-epoch increment, no lock event required; token revoked/throwing currentness, no-focus status polling, cancelled in-flight SHA/private reads, hidden page, pagehide, guest refusal, stable legitimate login, 3D always blocked. Actual native `cleanOutfitBoard`, `preflightOwnedOutfit1054` and original JPEG SHA digests are called; synthetic JPEG fixture bytes are not actual clothing photographs.
- Re-run M15 C61 gate 16/16, source/board 32/32, native M3 lease 8/8, full inherited Node, authentic native signed original-photo 2D Chromium/WebKit 12/12 and native P880 owner policy 54/54 under a strict exact-parent 4-file NO DEPLOY workflow. Real physical phones and hosted owner RLS remain BLOCKED.

## Scope and release disposition
Exactly four paths allowed from M15 HEAD: `native-2d-preview.mjs`, `native-2d-display-lease16.test.mjs`, this report and its no-deploy workflow. No `public/`, garment photos, model weights, 3D source geometry, cloud, hosted Supabase, production, staging, main or sibling mission branches touched.

Keep Family Alpha [#255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) OPEN/HOLD; PR **DRAFT and UNMERGED/UNDEPLOYED**. Independent blind 10/10 recognition, actual photographed multilayer 3D drape, physical iPhone/Android and hosted signed two-owner cloud/backup release acceptance are not established. C61 original body-contact baseline still 196 strict witnesses and trial source triangle deformation fails; do not infer release.

**Final exact-head CI remains PENDING until both jobs finish at the same committed SHA.**
