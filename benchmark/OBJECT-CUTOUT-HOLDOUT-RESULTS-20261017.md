# BiRefNet Lite independent visual holdout — October 17, 2026

**Workflow:** https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39051075491  
**Artifact:** `experimental-birefnet-independent-seven-photo-holdout` (GitHub artifact ID 12107463531).  
**Result:** Inference and output generation completed for all seven checksum-verified sources. The unit tests and CI workflow passed. This is **not** a seven-out-of-seven segmentation accuracy result.

## What the comparison images actually show

| ID | Scene | Visual finding | Release implication |
| --- | --- | --- | --- |
| validation-0001 | Person wearing printed dress | Whole person remains while background is removed | Fails clothing-only cutout |
| validation-0003 | Museum dress | Display mannequin remains | Fails clothing-only cutout |
| validation-0010 | Person in a layered dress | Person, face and legs remain | Fails clothing-only cutout |
| validation-0017 | Hanging grey jeans | Most surrounding background removed; finer boundaries unscored | Needs approved outline |
| validation-0019 | Studio sneaker pair | Product and most lace/sole shapes look visually retained; backdrop removed | Needs approved outline |
| validation-0023 | Studio high-top sneaker pair | Cleaner product backdrop, fine outlines unverified | Needs approved outline |
| validation-0024 | Metallic sneaker pair | Cleaner product backdrop, fine outlines unverified | Needs approved outline |

These are visual observations from side-by-side PNGs, not manually traced ground truth. The model is a foreground-object extractor; full-body dress photos reveal a major mismatch with Closet Current's desired *garment-only* indexing.

Inference timings on GitHub Actions Node CPU were 8,036–8,618 ms per source, excluding model loading. A user taking a photo expects a responsive, simple capture flow; emulator or CI timings do not establish real phone behavior.

## Decision

**Keep BiRefNet Lite experimental. Do not enable it in Closet Current's live crop/indexing pipeline.**

The experimental promotion checklist now fails closed if:
- the visual review is incomplete;
- person/mannequin objects are retained;
- any garment-only outline is unapproved;
- independent pixel mask references do not exist;
- real device loading and performance are unmeasured.

Next work: test a clothing-part segmentation approach capable of isolating clothing from people, mannequins and props, without losing shoe soles or thin jacket details. Compare on native-resolution approved masks and real mobile captures before changing production. Do not alter Drive Duel.
