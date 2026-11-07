# Closet Current — Priority #125 / OWNER-REVIEW-LEASE-125

**RESEARCH ONLY · Family Alpha Issue #255 HOLD · draft/unmerged; never modify, merge into, or deploy production/existing staging.**

## Green source boundary

Priority #124 draft [PR #679](https://github.com/nickhaney916-lang/Closet-Current/pull/679), exact parent SHA `c7b6a5511172fa235bdd5d7db615f3a32c2a83bb`, and [successful 2/2 no-deploy CI #42328236339](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42328236339): 1,119/1,119 Node regressions, 6/6 Chromium/WebKit width 320/390/430 browser scenarios, 75 licensed-source browser screenshots. No changes to P124 source code or its draft PR; new dedicated child branch only.

## Actual independent defect and fix

The existing STYLE03 `verifiedPrivateStyleRoster03` performed SHA-256 verification of the original saved JPEG and, for P119 reviewed multi-garment cutouts, a **second real-byte JPEG SHA-256 digest**. It later checked the wardrobe fingerprint plus a subset of the final item fields. However, changes to the *same record's color, colorSource, confirmedColor, ownerReviewed, humanReviewedSource, other review metadata, or image state* could occur during the asynchronous digests while the boardFingerprint stayed unchanged and the original cutout bytes remained valid. The prior final check did not compare those review fields, and did not check the live owner session *after* the final wardrobe read.

This is a stale-source/revoked-review acceptance risk, not a cryptographic SHA collision.

The P125 fix adds the exported `sourceReviewUnchanged125(initial,current)` which checks initial vs final:
- saved row identity, owner, display name, category, subtype, color, and reviewed color provenance;
- original and source/cutout JPEG image identity, hashes, crop identity/bounds, cutout certification and single/multi-garment indicators;
- user adjustment and explicit owner/source/category/color/instance review proof;
- scan, duplicate, ownership-confirmation, saved status, photo-only and 3D readiness flags;
- previously accepted original and source-cutout SHA/byte consistency checks remain mandatory.

The final roster now **rejects** any changed source or review metadata **even when the board fingerprint is unchanged**, then rechecks both `board.status().active` and the owner+generation lease **after** obtaining the final wardrobe read. This is a fail-closed check, never a silent metadata correction, approval, outfit save, or additional copy of JPEGs.

## Independent Node tests and inherited actual-app browser acceptance

The new `tests/owner-review-lease-125.test.mjs` builds a real cutout JPEG from an already licensed original JPEG fixture, performs the **real P119 atomic IndexedDB commit of both independent byte-digested sources after owner review**, and verifies unchanged source acceptance plus more than twenty altered final-snapshot fields. It specifically injects an actual changed reviewed color while the synthetic board fingerprint remains unchanged, revokes review/instance/source proof and changes photo identity during the final snapshot, and triggers owner sign-out **inside** the final read.

The exact-head workflow on this **unmerged research child only** requires precisely four changed paths relative to P124 and runs new P125 tests, the P124 original+cutout tests, inherited complete Node suite, and the unchanged P124 real app Playwright six-scenario Chromium/WebKit 320/390/430 matrix. The browser matrix remains inherited regression coverage: it does **not** claim to independently reproduce a race in the actual app, which is tested with isolated instrumented Node scenarios.

**CI status:** Pending final exact-head verification; do not mark independent acceptance PASS until GitHub Actions finishes successfully and exact tested head SHA matches this branch.

## Limitations

Original and cutout **hashes prove actual JPEG byte identity only**; they do not prove learned segmentation, visually accurate cutout, category/subtype/color truth, unseen surfaces, autonomous 3D clothing fit, or realistic male/female humanoids. The synthetic owner IDs and review objects do not establish genuinely authenticated remote JWTs, Supabase RLS, cloud backup correctness or cross-account server privacy. Browser mobile viewports are not physical Android/iPhone sensor acceptance. Family Alpha issue #255 stays HOLD. No production, existing staging, or other projects are altered or deployed.
