# Original high-resolution photograph first — indexing and review contract

**Updated:** October 18, 2026 Pacific. Research branch for draft PR #10 only; not merged into PR #7 or `main`.

## Required source order

1. Capture and retain the **original high-quality JPEG RGB photograph**. `outfit-capture.js` keeps the complete original in `originalPhoto.image` for each separated candidate. `outfit-worker.mjs` processes the **whole original scene first**, with a semantic segmentation model. Original scene context is used to locate masks and detect conflicting clothing regions; a whole-outfit scene must never be classified as though it were one garment.
2. For **each candidate item**, cut a **narrow, unmasked, original-RGB recognition crop** using coordinates from the original scene mask. Keep it separate in `recognitionPhoto.image`. This crop retains actual original threads, color, sleeves and nearby boundaries without letting the background dominate a whole-scene item classifier.
3. Classify and index **only from the original-RGB recognition crop**, not a cleaned, white-matted, reconstructed, rendered, display-only, or AI-try-on image. `recognitionSourcePhoto(item)` returns the unmasked crop for an outfit; for a single-item original capture, it can use the unaltered `image`. If an outfit was restored without the source crop, **return null and require review**—never silently fall back to its display image. The capture worker validates JPEG source-crop messages before creating candidates.
4. Apply original-scene mask/source constraints **before automatic save**. A clipped, fragmented, uncertain dress-vs-layer, or no-person region must stay review-only. Mandatory category/color are never inferred from a generated image. Background memory review also uses `recognitionSourcePhoto`; missing outfit crops skip that item instead of learning from cleaned imagery.
5. Display cleaned/normalized photos and optional AI previews **after classification**, keeping them visual-only. In the clothing editor, a collapsed **View original outfit** image exposes the full scene for optional human confirmation without changing classification input or adding a tab.
6. Verify source metadata **when queued IndexedDB save actually begins**, rather than snapshotting it before async queue delay. This prevents stale pre-queue category/color values from being written when a garment is adjusted mid-queue.

## Verified engineering evidence

- Automatic scanner, editor and background memory review refuse to substitute a display cutout for a missing original outfit crop; original RGB garment crop remains the classifier input.
- Tests for manual original-scene viewer, missing original crop, source capture fidelity, and delayed-change category/color metadata.
- [Camera/indexing GitHub run 39201508202](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39201508202) passed after original-source editor updates.
- Prior real-worker licensed-photo runs [39198452629](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39198452629) and [39200134000](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39200134000) established zero false automatic saves for uncertain worn and flat-lay images, but did not establish good automatic classification of layered garments.

## Known limitations and honest status

- Full-photo context is currently the **segmentation/scene analysis** input. Item categorization uses a focused, raw original-photo crop to avoid conflating several pieces. This is intentionally a **two-scale original-source workflow**, not passing generated/corrected imagery to a classifier.
- Existing research segmentation does **not** correctly isolate worn shirt, blazer, skirt and shoes as separate physical garments on the layered photo. Zero auto-saves in that example is a safety result, not successful recognition.
- An original-format classifier's exact category/color/IoU/instance recall for real whole outfits remains **unknown** until independent two-human, full-scene outlines are available.
- Physical Android and iPhone photo capture, storage, restore, and timing remain unverified by emulated viewport tests.
- This work does not alter Drive Duel, enable paid models/services, activate production AI or authorize merges.

**Next validation gate:** have independently drawn, genuinely reviewed ten-photo inventory and masks, then evaluate the two-scale original-source pipeline against alternative model candidates using held-out full-scene photos with one-to-one physical garment matching.
