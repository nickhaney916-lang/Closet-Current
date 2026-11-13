# Mission 4 / MAIN1054 — Milestone 2: Native signed-owner outfit-photo preview (HOLD)

**Release:** Family Alpha #255 OPEN/HOLD. RESEARCH, DRAFT, NO MERGE, NO DEPLOY. No hosted Supabase, staging, production, private customer data, paid AI or 3D claims.

## Parent and current mission coordination

- Exact parent: [Mission4 milestone1 PR #1056](https://github.com/nickhaney916-lang/Closet-Current/pull/1056) `d27afa641eb0fabd2ade28504c8f5975d27abe9a`; inherited 16/16 dedicated tests and 1,908/1,908 native regression PASS at [Actions #43511534193](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43511534193).
- It itself descends from Mission3 verified #1049 SHA `12472bab696ca3ec006dc05a54f230982798b695`.
- Mission1 latest inspected #1057 `5e181dcbd090ea79aa998bbb2aa2dbbe48047883`, still distinct dual-model recognition.
- Mission2 latest inspected #1058 `e00737ff07d1902248345f58068630f93b7194d3`, source-mesh diagnostics; no arbitrary multi-piece photographed reconstruction.
- Mission3 independent #1055 `302ad8172416587494b684704e4daa347a9e9140` and #1059 `6f116c8293f4e98ddfb3c71cefc8fc009eec5d98` require further owner-controller conflict reconciliation, not cherry-picking.

## New source-verified defect and fix

Real native `public/auth.js` stores `closet-current-auth-v1.epoch` as `crypto.randomUUID()` (opaque string), while the earlier synthetic Mission4 preflight accepted only numeric epochs. That means the old preflight could never accept true signed owner sessions. The preflight now validates a bounded nonblank opaque string epoch, preserves numeric synthetic fixtures, and rechecks the exact epoch across every asynchronous owner read and SHA digest. Added a deterministic native-epoch replacement/invalidated-token test.

## Research opt-in app handoff

An isolated `public/outfit-board.js` change, behind the **exact opt-in** `?mission4Preview=research`, presents a single read-only button inside the genuine native Outfit Builder. It uses:
- real `currentPhotoOwnerSession167()` from native signed auth + private DB;
- actual `signedOwnerSavedRows167()` for the current authenticated owner;
- real `currentBoard.slots` or active native lossless board, verified against `cleanOutfitBoard`;
- new `native-2d-preview.mjs`: verifies owner's saved originals / matching SHA-256, again checks row identity and owner, displays original data-URL JPEGs as *clearly 2D-only un-fitted photo cards*, never a synthetic 3D mesh or source-derived cloth claim.

All photos are in owner-private DOM only, never emitted in returned summaries, logs or network calls. The mount requires explicit click. The viewer clears on owner/session revocation, pagehide, page invisibility or outfit rerender. A dress + coat silently normalized away, unreviewed AI suggestion, foreign owner, missing/tampered JPEG or duplicate physical item is refused. No mutation of the original JPEG, photo review, outfit board, backup/restore, public auth, model weights or protected app settings.

Default app behavior has no new UI or requests without the query flag; the research module is outside the deployed `dist/` build and is intentionally unavailable to normal production users. Do not merge or deploy this branch; release must be separately approved.

## Evidence: pending exact final-head CI

`scripts/test-main1054-native-preview-browser.mjs` opens **actual `public/index.html`, original `auth.js`, original `outfit-board.js`, actual private IndexedDB** and intercepts *only* the real Supabase HTTP authentication response with **synthetic fixture accounts**. Synthetic decodable JPEG color panels are intentionally **not clothing photographs** or category-accuracy ground truth. Test matrix: Chromium and WebKit desktop browser engines at 320, 390 and 430 px; each renders 3 originally saved JPEG photo cards; revokes on session lock; refuses tampered source SHA; captures 6 visual PNGs and result receipts. These are desktop mobile-viewport tests, **not physical Android/iPhone acceptance**.

Dedicated no-deploy workflow verifies exact-parent SHA and narrow changed-file allowlist, installs same pinned Mission3 dependencies, runs Node tests and inherited full serial suite, offline PWA build, and the native authentic UI browsers. **Do not claim passing browser or exact-HEAD CI until observed.**

## Still blocking Mission 4 full completion

- Genuine compatibility integration of latest Mission1 dual-model research into same M3 app candidate without weakening owner confirmation.
- Genuine Mission2 photo-derived, fully fitted, multi-piece 3D representation on anatomical rigs, independent collision and renderer proof.
- Real owner photo end-to-end with owner-reviewed accuracy, signing, mobile native capture and cloud restore on physical phones.
- Authenticated hosted two-account Supabase JWT/RLS/private storage tests with authorized disposable accounts.
- Release acceptance and explicit owner authorization. Family Alpha #255 remains HOLD.

**Exit:** Source-honest native owner-photo 2D handoff can advance research, but this is *not* complete 3-way app release integration, no user-photo-to-real-3D claim.
