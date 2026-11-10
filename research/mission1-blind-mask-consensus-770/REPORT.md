# Closet Current Mission 1 — Independent blind human mask consensus by geometry (P770)

**FAMILY ALPHA HOLD #255 — isolated draft research; no deployment.**

## The actual defect

P768 prospective image labeling already required two separately signed independent human reviews. But the agreement check paired garment-instance masks by the **annotator's own local `instanceId` string**, so two genuinely blind reviewers who identified the same garment but named their masks `shirt-1` and `garment-B` were incorrectly treated as disagreements. In multi-instance photos, merely enumerating two polygons in a different order could falsely require a third adjudicator. This creates unnecessary review work and encourages reviewers to coordinate identifiers, undermining the desired independent blinded annotation.

## Source-bound correction

- Keep the original signed, source-JPEG-SHA-bound human receipts and strict two-independent-keys check unchanged.
- Preserve the top-level source category, subtype, and primary color comparison; true category/color discrepancies still require an independent signed third adjudicator.
- Compare each reviewer's **actual complete binary garment mask pixels** on the same original source raster, with one-to-one **maximum-cardinality** assignment at >=0.85 intersection-over-union among same-category masks, **regardless of independently chosen mask IDs and enumeration order**. This reuses the already independently tested P768 optimal assignment, and prevents two overlapping real garment masks from losing an otherwise available match due to greedily pairing the wrong first polygon.
- Reject **duplicate near-identical same-category human masks** within one reviewer record when overlap >=0.99, even if they have different local IDs, so a duplicated annotation cannot inflate the denominator of true garment instances.
- All source byte, seal, model SHA, signing identity, pre-inference Git registration and independent human acceptance limitations remain intact.
- Extend the existing P768 synthetic-source review harness by **five new adversarial tests**: disjoint local reviewer IDs, swapped two-mask order, actual boundary disagreement needing a signed third adjudicator, equal pixels with conflicting category, and duplicate near-identical masks. These are unit fixtures, **not external real human review evidence**.

## Gaps not hidden

This only repairs how independently prepared polygons can be compared. The current P768 schema still attaches subtype/color at top-level and therefore is not a complete per-instance color/subtype labeling system for different garment categories in one full outfit. It does not obtain actual legally approved photos, two independently verified real humans, real physical-phone evidence, external rights/training overlap checks, or new unseen held-out model accuracy. A signed key cannot prove a distinct actual human identity, and synthetic signature tests are not human annotations.

Independent source-photo screen P769 separately flags alternate crops and JPEG encodings of 65 exposed originals. Both protections must be applied to any later truly prospective cohort. Existing developer-sample human mask results from P66/P765/P767 are already exposed and cannot be rebranded as new holdout.

**P770 completion means the documented matching defect is fixed and tested, not that Mission 1 or Closet Current release is complete. Family Alpha HOLD #255 persists. No merge/deploy/production/staging/Supabase or private family-photo modifications.**
