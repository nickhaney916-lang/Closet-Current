# Closet Current — Mission 1 Priority #771: independently reviewed multi-garment outfit annotations

**FAMILY ALPHA HOLD #255. Research-only, draft, unmerged and undeployed.**

## The defect

The existing independent-photo ground-truth contract P768/P770 had a single category, subtype and color at the *whole-photograph* level. This worked for single-piece benchmarks but could not represent a real outfit containing garments of different categories/colors. A blue blouse + brown jeans could be incorrectly scored against one aggregated type/color. Two blinded human reviewers also needed to provide one-to-one per-garment category, subtype, color and mask evidence even when their local IDs and polygon order differ.

## What this research adds

- New strict mixed photograph label contract: `category:'Multiple'`, `subtype:'Multiple'`, `primaryColor:'Multicolor'`, plus 2–20 human-reviewed source-mask instances. **Every instance independently requires** source-raster RLE, category, subtype, and primaryColor. Missing/Unknown actual human subtype or color is invalid, not silently treated as correct.
- Reuses P768 immutable original JPEG and model SHA, signed pre-inference registration, two Ed25519 blind reviewer receipts, distinct signing key registry and signed third adjudication on genuine disagreement.
- Independently prepared reviewer IDs and order DO NOT need to match. Human consensus requires one-to-one maximum-cardinality IoU >= 0.85 **plus equal corresponding category, subtype and color**. No duplicate near-identical masks with different IDs. A discrepancy in shape, garment type, category or color still demands independently signed adjudication.
- Actual model results can contain a list of separate source masks and per-instance category, subtype, and observed color. The evaluator associates masks geometrically, so a model-predicted wrong category is still scored wrong against the matched garment, rather than disappearing. Class-aware IoU >= 0.5 controls true positive/false positive/false negative segmentation counts; missing masks count toward the denominator ONLY where actual instance predictions are available, and absent evidence keeps segmentation/color percentages `null`.
- Complete denominators separately record mixed photos, actual human garment instances, proposed model instances, spatially matched items, correct per-item categories/types/colors, and incorrect automatic model additions. A whole-outfit `strong`/single-garment auto-index result is refused; no simulated owner approval can bypass review. Existing single-piece and negative-image score behavior is preserved.
- 10 new adversarial signed synthetic-source regressions include two different garments and colors, independent reversed IDs and order, missing pants (50% recall), wrong garment category despite correct geometric overlap, absent model color, missing model masks (null, not invented 0/100), signed human color conflict and separate adjudicator, missing human subtype/color, invalid aggregated label, strong whole-outfit auto-index refusal, hallucinated extra garment, and invalid mask boundaries.

## Limitations and handoff

This is **evaluation plumbing** for real multi-piece photo annotations. None of the test labels or Ed25519 signatures come from new genuine independently verified humans; test JPEGs are plainly artificial, not new held-out photo evidence. The real owner-facing recognition worker has **not** magically gained multi-garment separation, color classification, or 3D garment fidelity. Integration and actual human labeled multi-outfit photos are still missing; do not count CI fixtures toward real accuracy.

The P769 fingerprint comparison must screen each proposed original against all 65 previously exposed public images before P768's sealed registration. A genuine new independent cohort requires real licensed photos, two truly distinct blinded annotators, original JPEG bytes, per-item polygons, colors and types, and a model inference run with unchanged source/model. No candidate is admitted merely because image hashes do not match. Physical-phone, private closet, authenticated cloud and further 3D fidelity remain separate.

No development configuration, shipping `public/` app, cloud schema, production, staging or hosted Supabase has been modified. Research is directly stacked on verified P770 SHA `65023b1dfcdf7e46a0aa38b92dd5f90b8303acd0`. Family Alpha HOLD #255 persists, and this **does not complete Mission 1 or authorize progression to Mission 2**.
