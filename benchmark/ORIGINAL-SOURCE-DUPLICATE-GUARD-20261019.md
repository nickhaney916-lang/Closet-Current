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
