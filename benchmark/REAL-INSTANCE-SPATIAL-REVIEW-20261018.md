# Spatially disconnected garment proposals — experimental real-photo audit

**Scope:** draft PR #7, research-only DeepFashion2 experiment on ten
SHA-verified, licensed original photographs. No customer code or production
model changes. Source photographs remain RGB and unchanged.

## Problem

A DeepFashion mask can capture a jacket sleeve, another sleeve, or a separate
trouser leg as **multiple non-overlapping proposal masks**. The existing
pairwise-overlap warning catches some duplicate/layer conflicts but misses
these disjoint pairs. Simply counting or unioning them can fabricate several
closet items from one physical garment or combine truly different garments.
Neither an empty model output nor a low distance is an item count.

## New evidence

`benchmark/instance-spatial-review.mjs` analyzes **actual model-produced**
binary proposal masks, never approved ground-truth annotations:

- Verifies exact source image name, source SHA-256, candidate IDs,
  unapproved prediction status, non-customer saving status and matching mask
  dimensions.
- Records exact model-to-model foreground overlap / IoU at original
  proposal resolution, and a bounded 96×96 coarse-grid Manhattan gap for
  **nearby masks that do not overlap**.
- Highlights nearby same-broad-category masks as possible **panels of one
  garment**, while preserving the possibility of two distinct nearby items.
  Overlapping proposals with different categories require layer or
  classification review, not automatic reassignment.
- Lists separated, distant same-category masks without guessing whether they
  are distinct physical garments.
- Writes `individual-instance-spatial-review.json` in the pinned DeepFashion
  GitHub Actions artifact, beside the original-photo review queue and
  individual seed masks. The ten-photo run validates that every reported
  source has null model accuracy and zero approved masks or customer saves.

The proximity grid is a **review-priority approximation**, not an
original-resolution mask comparison, not a geometric merge instruction,
and not a measure of accuracy, recall or foreground contamination.
Exact model-to-model IoU measures model disagreement, **not IoU against a
human reference**. Class hints may be wrong.

## Human review priorities

Inspect disjoint same-category pairs on the exact originals, particularly
`validation-0017` trousers and `commons-0065` jacket, plus the dress
panels at `commons-0049` and worn layers at `validation-0031`.
Two independent humans must identify every real physical article from the
full source and approve individual garment-only outlines, including missed
pieces, before computing physical instance recall or trusting any union.

The project already supplies the independent annotation editor and offline
complete-inventory builder. Do **not** use this spatial JSON to generate
approved references, alter segmentation thresholds, enable auto-saving,
change colors or categories, or call paid AI models.
