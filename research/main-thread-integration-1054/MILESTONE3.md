# Closet Current Mission 4, Milestone 3 — Source-locked Mission 3 owner safety convergence (HOLD)

Tracking: [main coordination #1054](https://github.com/nickhaney916-lang/Closet-Current/issues/1054). Research only, NEVER merge or deploy without separate authorization. Family Alpha [#255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) is still OPEN/HOLD.

## Immutably pinned incoming sources

- Parent Mission 4 Milestone 2 [draft #1063](https://github.com/nickhaney916-lang/Closet-Current/pull/1063), `f704a3b00e6c5d47e8cafd0f0243c7494a0a86cc`, [exact-head CI PASS](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43516400105) 1,908/1,908 inherited; 17/17 original-owner source tests, 12/12 browser cases, 6 synthetic screenshots.
- Mission 3 owner Review/Discard/Refresh [#1067](https://github.com/nickhaney916-lang/Closet-Current/pull/1067), `fb582cc42388117701ad96f25d47f1166e15a212`; the change to `public/app.js` compared to exact PR base `6952312cc8ce37447452143abddc12a60baec729` is only **one 45-line source patch**, not an app replacement.
- Mission 3 signed-owner Board actions [#1069](https://github.com/nickhaney916-lang/Closet-Current/pull/1069), `9a8a5fe8de82dd7ecaf8437e2a6f343cc1915066`, with **five exact source patch hunks** against the original `outfit-board.js`; individual hunk preimages checked for exact unique match in the M4 target before application.
- Mission 3 completed Owner-verified generated-outfit safety controller from [#1067](https://github.com/nickhaney916-lang/Closet-Current/pull/1067) `public/closet-stylist.js` blob `3c83551bbaa15655b4302cc038bfeb23e26b00de`, integrated with no other app source rewrite.
- Mission 1's separately evolving dual-model work [#1071](https://github.com/nickhaney916-lang/Closet-Current/pull/1071) `ad60fa300146f0ed469c1367180e75c4fc55b20c` is **not incorporated** by this milestone: source `public/app.js` is an older, divergent model implementation (approx. 1,047 lines vs this M4 branch's 2,600+); the actual `dual-core-82.mjs`, `dual-panel-82.mjs` and `subtype-review-80.mjs` are absent in this candidate. Copying the whole app would delete extensive M3 source/backup/owner verification. The correct future reconciliation is feature-by-feature original-review dialog adaptation and explicit opt-in.
- Mission 2 [#1070](https://github.com/nickhaney916-lang/Closet-Current/pull/1070) `f1cff6acaa550b355e706887e7466ab4a0efccef` remains separately licensed 163-bone dress source topology/pose research, not generic user-photograph 3D clothing geometry. This branch preserves the 2D-only fallback and `renderAuthorized3D:false`.

## Applied actual native runtime changes

1. `public/app.js`: owner-lease binds pending Photo Review Discard and Refresh at each await; exact original batch snapshots and duplicate-ID checks; never replay an old-session deletion into a new session UI.
2. `public/closet-stylist.js`: integrated full owner-bound generated outfits controller, including async request serial, signed-owner DB/session lease, result IDs, protected Save/Adjust/focus and stale error suppression. The original M4 original-photo preview stays intact.
3. `public/outfit-board.js`: owner-bound queued Save/Retry/Load/Refresh and autosave finalizers from M3 #1069, preserving M4's opt-in verified-original 2D preview and all existing private transactions; no writes outside authenticated owned stores.
4. Copied genuine source-executed owner-lease tests and browser synthetic account race harnesses for each relevant M3 acceptance branch. Updated the inherited draft conflict/resilience fixtures using exact two small M3 test patches; no relaxation of live safety policies.

## Reproducible no-deploy acceptance

`.github/workflows/main-thread-crossmission-graft-1054-no-deploy.yml` validates immutable ancestor, a narrow allowed-file set, no change to `auth.js`, `cloud-backup.js`, `index.html`, original-photo SHA/index modules, and original 2D-only source boundary. It builds offline, runs Mission4 source tests, genuine M3 source-extracted owner tests, original native 2D owner-photo browser scenarios, M3 Chromium/WebKit photo-review and board action owner races, and **all inherited native Node tests**. Synthetic browser auth/garments; no hosted cloud or external secrets; workflow has `contents:read` permission and no deployment.

**CI result is NOT established until an exact-final-head successful run is observed.** The current branch is a draft research candidate, not a complete combined app and not a production release.

## Remaining Mission 4 acceptance blockers

- Mission 1 genuine FashionCLIP + FashionSigLIP continuous WebKit inference crash, accuracy and isolated owner-approval integration into THIS native app; no unproven accuracy claims.
- Mission 2 independent fully photographed layered real clothing fitting and avatar collision validation with authentic source, both rigs and real photo ground truth. Arbitrary clothing needs original-photo 2D fallback.
- Real hardware (iPhone Safari and Android Chrome); authorized hosted Supabase signed A/B and true original/v4 restore; independent human-reviewed real-photo 10/10, photorealism and performance.
- Fully compatible combined deployment candidate, merge decision, explicit owner Family Alpha permission. All remain BLOCKED; no merge or deploy.
