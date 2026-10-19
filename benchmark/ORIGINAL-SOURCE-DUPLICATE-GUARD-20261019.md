# Original-photo-aware garment duplicate protection — Oct 19, 2026

## Confirmed problem
A display-only garment JPEG can be exactly equal to another display preview for **different physical garments** (for example two white-matted previews produced from a captured outfit, distinct shirt and jacket layers, or a captured garment resembling an already saved standalone photo). Previously `candidate()` and `recognizeItem()` suppressed the later candidate using **display JPEG equality alone**. This could silently discard a legitimate article before the user could identify or review it.

## Implemented
- `exactlyRepeatedCapturedItem(existing,proposed)` checks the preserved original RGB outfit scene plus source group, independently cropped region bounds, and semantic garment/layer hints. A truly repeated source region, or identical original recaptured under another ID, still suppresses a duplicate.
- Distinct source originals, **different crop rectangles within one scene**, or competing underlayer/outerlayer semantic hints cannot be proven identical from the display JPEG alone; both pieces are kept in Photo results for review.
- A single photo and an outfit-derived candidate with the same display pixels are also kept separately for review regardless of worker completion order.
- Exactly equal display previews deliberately trigger `possibleDuplicate`; they do **not** automatically approve a second save or imply two real physical garments.
- Existing single-item repeated photo suppression, user edits, source photo preservation and original RGB classification stay intact.
- This is a **conservative source-identity/data-loss fix**, not a new segmentation model or proof of higher real-photo mask accuracy.

## Verified
[GitHub camera/indexing CI 39266435062](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39266435062) passed: **837 tests passed, 0 failed, 3 skipped**.
- `tests/automatic-indexing.test.cjs` tests identical previews with distinct original rectangles, second source originals, standalone-versus-outfit queue order, and true source repetition.
- `tests/outfit-capture.test.cjs` uses the actual source-identity predicate in the complete simulated worker event handoff, including identical thumbnails, distinct source rectangles, overlapping garment layers and repeated-region suppression.
- All test JPEGs in these checks are synthetic or simulated worker messages; the test result does not establish independent mask/physical-garment recall.

## Release blockers unchanged
Real layered outfit `validation-0031` still has **two ambiguous review regions, zero automatically saved** on the last actual pinned-model run. The independent reviewed-mask ten-photo benchmark and actual physical Android/iPhone testing are incomplete. Measured garment precision/recall and pixel IoU remain **unknown/null**.

This remains on isolated research PR #10, targeting the PR #7 development branch. The separate AI-try-on Work session can continue independently. **No merge, deployment, paid-service activation, production data or Drive Duel modification.**


## Cross-capture source identity hardening and touch-browser verification

A further source-level problem was found: a new capture-group ID formerly triggered "repeat" on the **same full original JPEG** before comparing the garment's semantic layer role or original-source rectangle. That could delete a newly discovered jacket, underlayer, or different garment after reprocessing an old outfit. The helper now checks the actual layer identity and photo region even across capture groups. If two groups have unverifiable rectangles, both remain available for duplicate review rather than treating the shared photo alone as proof of the same physical item. Matching originals with the same verified region and identity are still suppressed.

- [Full Node CI 39270732719](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39270732719): **839 passed, 0 failed, 3 skipped**. Regresses same-original, new-group, different overlapping layer; same-source different rectangle; genuine repeat across group IDs; unknown rectangle requires review; single-item+outfit display collision.
- [Touch-browser CI 39271116167](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39271116167): passed the 390×844 **emulated Chromium touch UI** and existing captured-outfit review/style/save/reload tests. A deterministic **synthetic** original scene produced 3 separately reviewable candidates with identical display JPEGs, 1 verified duplicate rejected, 0 automatic saves, 0 browser errors, unchanged original photos. The separate existing outfit handoff simulated three garment instances and confirmed owned-only styling and state restore.
- New script: `scripts/test-original-source-duplicate-mobile.mjs`; CI workflow `.github/workflows/research-original-source-duplicate-mobile.yml`.
- **Not proof** of independent real garment masks, measured accuracy, real Android/iPhone performance or live AI inference. Real layered-shirt/blazer/skirt segmentation and genuine two-human original-scene mask approval remain open.

All changes remain **unmerged, undeployed** in draft PR #10; no paid service or Drive Duel changes.
