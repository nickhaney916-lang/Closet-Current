# MAIN1054 M53 — Actual native consumer merge feasibility, without merging

**Exact-source risk and readiness audit, not a release or a stitched app. Family Alpha #255 OPEN/HOLD.**

M52 passed 18/18 real-donor module source-admission tests plus 2,744/2,744 existing application regressions in isolated no-deploy research. Those tests established *admission contract consistency*, not combined app code. This M53 evaluates real Git three-way merge conflicts between the original verified M51 native app and the latest independent development heads.

## Exact source heads

- M51 actual native application original-photo 2D safe baseline: `22f3db9f9d5dd34ff2d1323e59d3848935e65f4f` (#1196, full CI 3/3 success).
- M52 completed exact-donor admission test: `c4d425076fe853e876cf7d0a34b1b83623f90b85` (#1200, CI #43673066936 completed SUCCESS, 18 combined tests + 8 original-private-photo tests + 2,744 full Node tests passed).
- Current parallel Mission #88 draft: `85d92141717d7131c5d724a15e26df3b6d734678` (#1175); newer commits changed its blind-evaluation handoff/test/report only. Original source adapter blob `6324d8eda33024f166311f424392ed83363e4942` was *unchanged* from the pinned M52 #88 head `a5d21d55390449f75a35c95463a9e5700b51d4e3`.
- Current parallel Mission #89 draft: `a0bb1eaf872394dc9e9f19e218aecb4af292c1c5` (#1177); newer commits changed actual skirt/shoulder source and simulation. Original source admission module blob `9995203e9d83fbfc3e6222f771e750a47db15faf` was *unchanged* from pinned M52 #89 head `ebcada11357caaf3ba3aa53a1b5df7f6e2b7a289`. **New skirt features are not tested by M52**.
- Parallel avatar viewer Mission #90: `1b6fb1a2019e9b1e8e5ed55cc1f847809460ced9` (#1178, dedicated native viewer Chromium+WebKit success). Three older combined integration workflow jobs on that head failed strict scope due inherited `.github/workflows/allowlisted-review-snapshot-78-no-deploy.yml` relative to older ancestors; this is a **prerequisite incompatibility**, not a tested pass for the consumer integration.

## Why the native consumer merge needs more than a green research source contract

Read-only Git source inspection identified materially different native consumer files on independent ancestry:

| Consumer source | M51 source bytes | Mission #88 source bytes | Consequence |
|---|---:|---:|---|
| `public/app.js` | 168,227 | 100,121 | #88 adds opt-in mask/crop review protection, but a file-level replacement would drop M51's other private photo/source owner flows |
| `public/outfit-capture.js` | 13,292 | 29,466 | #88 adds unit segmentation, owner/SHA review and stale-photo constraints, but overriding the native app capture would alter unrelated existing multi24 and source proof logic |
| `public/outfit-instance-review-840.mjs` | No file at M51 | 3,870 | A bounded explicit donor adapter must be evaluated and integrated without treating a segmentation proposal as a saved owner garment |

Raw byte-length differences are **not** a merge conflict count. The new Git three-way program records actual tree conflicts without merge commits or source modifications.

## Executable non-release audit

`scripts/audit-main53-consumer-merge-tree.mjs` invokes Git's original `merge-tree --write-tree --name-only --no-messages` against **each** exact donor and the verified M51 parent. It compares true merge-base SHAs and report paths, including native app.js, outfit-capture.js, outfit-board.js, outfit-instance-review-840 and native 3D bridge source. Exit 1 means a true unresolved three-way conflict; exit 0 only means textual merge feasibility, **not compatible runtime, correct owner isolation, verified 3D, or release readiness**. It never calls `git merge`, changes branch refs or working files, handles family photos, or attempts hosted data access.

The dedicated no-deploy workflow limits changed paths to this audit, workflow, and report; it also runs the same unchanged app build, original licensed-photo private 2D regression and full inherited Node suite. Only a source-safe JSON conflict tree/path count is uploaded. If three-way Git conflict analysis is red or erroring, do not replace a protected source file or weaken permissions to make a report pass.

**CI status at creation:** Pending. No conflict counts claimed before actual CI; no prior unrelated green CI inherited for this commit.

## Next practical consumer engineering priority

Once conflicts are measured, target **the smallest source-safe integration seam** for Mission #88's unresolved same-category mask guard into the M51 opt-in multi-garment owner-review flow—not a wholesale replacement of app.js/outfit-capture.js. Verify genuine source JPEG and mask identity, owner-only explicit approval, and rejection of unseen or uncertain item count and wrong subtype/color before any private saved row. Test actual native Chromium and WebKit with an original public outfit image and simulated signed accounts. Keep original-photo 2D fallback; never admit garment 3D solely because source hashes match. Mission #89 owns physically valid cloth surfaces and #90 owns viewer integration, with genuine real-world release acceptance deferred.

Separate independent signed human/photographer-disjoint ground truth remains required: on the historical **previously exposed** cohort, 23/53 broad-category-matched regions and 8/13 accessory bbox matches are not a 10/10 accuracy claim. A successful git conflict report cannot substitute for that evidence, actual signed hosted two-user RLS, physical Android+iPhone, or tested full four-user Family Alpha. HOLD #255 remains OPEN; no merge/deploy.


## November 14 finish-line continuation — native MULTI24 → Outfit Builder exact contract blocker

On the **existing M53 draft**, a new **read-only runtime source-contract witness** was appended to `scripts/audit-main53-consumer-merge-tree.mjs`. It imports the actual `verifiedRecord24` MULTI24 atomic save record constructor, actual native `buildOwnerWardrobeIndex`, and actual Mission 4 `preflightOwnedOutfit1054`; all come from this single frozen M53 source tree. It uses the real **locked licensed Commons-0003 original JPEG bytes** with full source SHA manifest agreement, and deliberately synthetic owner/category confirmation/crop pixels. It does not read any family data or claim that a human or model correctly found an individual garment.

**Deterministic source-level gap (new CI execution pending):**
- A successfully manually reviewed MULTI24 record has `extractionReview:'human-confirmed'`, `sourceCropReviewed:true`, `sourceHashVerified:true`, owner-bound original SHA and `photoOnly:true`; crucially it correctly retains `singleGarmentVerified:false`, `threeDReady:false` and has no separately attested `cutoutSHA256`, `ownerReviewed` or `sourcePhotoOriginal`.
- Native `buildOwnerWardrobeIndex` must therefore label this as `sourceKind:'ambiguous-source'` and `reviewReasons:['shared-source-needs-cutout-proof',…]`.
- The current M51 `preflightOwnedOutfit1054` accepts only `verified-single` or `verified-cutout` plus its stronger owner and source-original confirmation evidence. It **must reject** the MULTI24 row, even though the crop/category/color were explicitly confirmed by a *synthetic test owner*. An unsafe quick fix would be to set `singleGarmentVerified:true` or `segmentHint.verified:true` merely to pass the board.
- The M53 runtime witness now demands that rejection and emits `sourceToOutfitContract.nativePreflightRejectedSafely:true` and `sourcePhoto2DFallbackReconciled:false`. A GREEN audit proves **safe denial**, not end-to-end outfit integration.

**Required finishing change in the primary Mission 4 integration lane:** design an **explicit photo-only, owner-sourced 2D presentation contract for reviewed but uncertain physical garment-unit identity**, separate from the existing verified-single/cutout admission and always refusing 3D. It must keep the stored ambiguity and zero-silent-save protections, refuse duplicated/competing owner/source/slot identities, verify original JPEG SHA and current owner/private DB/session across async reads, and represent unknown garment-unit proof visibly rather than silently asserting a true standalone garment. Then run the actual native positive review → saved photo-only card → outfit swap → original-photo 2D → restore/logout in Chromium/WebKit at 320/390/430 **on one exact compatible head**, preserving all negative tests. Without a source-supported individual garment boundary, arbitrary per-piece dressed avatar placement remains **BLOCKED**, not magically verified by a good photo hash.

**CI status:** This appendix and witness do **not** claim a completed exact-head run until the new M53 workflow finishes successfully. Existing M53 Git merge-tree and full native regression checks are inherited unchanged. No consumer `public/`, source JPEG, production, stage, hosted Supabase, independent mission branch, 3D geometry, merge or deployment changed. All work remains on existing DRAFT #1202; Family Alpha #255 remains OPEN/HOLD.
