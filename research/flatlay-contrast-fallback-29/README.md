# FLATLAY-CONTRAST-FALLBACK-29 — optional plain-background suggestions for missed garments

**Main controller research only**, based on exact prior [PR #585](https://github.com/nickhaney916-lang/Closet-Current/pull/585) SHA `8515349e536a7c612a50ba8157f3af8b4579330b`. Research feature is still opt-in (`multi24=research` with existing photo proof, private closet and lossless flags). NEVER MERGE or deploy without explicit separate approval. Production, staging, Supabase, private user accounts and other projects untouched. Family Alpha Issue #255 remains OPEN/HOLD.

## Source-grounded problem and limited improvement

The genuine independently run prior SegFormer benchmark [PR #575](https://github.com/nickhaney916-lang/Closet-Current/pull/575) observed just **10 annotated target boxes matched out of 35** across 19 original-photo inputs in app-equivalent resize mode, including near-total failure for several flat-lay arrangements. PR #585 introduced honesty-preserving *review ordering* but did not create missing regions. The current independent priority adds an **explicit opt-in** separate background-contrast candidate source for images that appear to have smooth, uniform backdrop corners. This may make missed clothing easier to mark on a plain tabletop or floor, but is **not trained garment recognition**, a semantic clothing mask or a multi-garment accuracy certification.

### What the user can do

In the existing owner-private multi-garment review, after importing an unchanged SHA-256-verified original JPEG, the user can tap **Suggest missed regions on a plain backdrop**. The app locally draws that decoded original into a bounded 512-pixel temporary analysis canvas (without modifying JPEG bytes, SHA or cloud) and tests for sufficiently uniform image corners and limited border variation. A conservative pixel-color-distance difference from background, tiny-noise suppression, and connected-component geometry creates an *unclassified list of rectangles*. Other source-verified SegFormer detections and existing manual crops remain exactly intact. Repeated clicks do not duplicate identical region source keys; overlapping existing model regions are not overwritten.

Each new region is stored **only in the temporary review UI** as `manual:true`, `flatlay29:true`, `cropReviewed:false`, `category:'Uncategorized'`, `itemType:'Unknown'`, `color:''`, `confirmed:false`, `maskApplied:false`, with a distinct stable manual key. It therefore must go through an explicit *Adjust crop/mask* user action and category/subtype/color confirmation before the pre-existing SHA/owner-bound atomic wardrobe save can accept it. No type, color, hidden surface, pair identity, person, source ownership or 3D readiness is inferred. There is no phone gallery write, external upload or auto-save. Session switch clears unsaved regions.

### Safety boundaries

Algorithm rejects invalid/non-JPEG original dimensions, photos above 48 million pixels, analysis dimensions over 512, nonuniform border colors, textured/uneven backgrounds, single large whole-image objects, tiny noise, oversized ambiguous proposals and extreme foreground occupancy. All outputs are valid normalized crop rectangles; proposals have no semantic category, model confidence or acceptance authority. A failed image simply invites the existing Add missed piece/manual crop fallback, and never adds a clothing record.

### Evidence

- `tests/flatlay-contrast-fallback-29.test.mjs`: multiple separated contrasted synthetic objects, light and dark uniform backgrounds, cluttered three-corner contamination, large image/malformed pixels, nearly-whole-scene rejection, tiny speck suppression, bounded original-source canvas reading, actual review UI human confirmation/SHA and no data upload/code side effects.
- `scripts/verify-flatlay-review-29.mjs`: real Chromium and WebKit at 320/390/430 CSS pixels, actual `mountMultiGarmentCapture24` research UI, original synthetic JPEG SHA checked, simulated SegFormer proposals explicitly UI-only, click actual plain-background candidate button, verify at least one new manual-only review proposal, never auto-save, no credential/photo uploads, owner switch clears review and six SHA-audited genuine mobile screenshot PNGs.
- `scripts/measure-flatlay-contrast-real-29.mjs`: separate **real original photograph** experiment downloads four previously SHA-locked licensed Wikimedia Commons originals, verifies each original byte count, image dimensions and SHA-256 from PR #575's original annotation manifests, then measures geometry-only IoU overlap of *unclassified* crop rectangles. These images are **not an independent new holdout** and were previously annotated by one researcher. The results are descriptive, regardless of whether the heuristic improves coverage, and do not constitute scientific precision/recall of clothing types. No original JPEG is packaged in the final artifact.

### Important limitations

Uniform-background differences might find belts, glasses, shadows, props, books or other objects that are **not clothing**, and may miss white clothing on white backgrounds or garments touching the edge. It cannot split two overlapping garments with similar color, infer individual shoes as a pair or distinguish skirts from shorts. The plain-background gate is essential; do not enable indiscriminate automatic extraction. A user must correct every proposal. Classifier and SegFormer original quality remains **NEEDS REWORK**, no independent second-annotator mask IoU, no signed hosted two-owner browser cloud E2E, no physical Android/iPhone, no real 3D source-texture proof, no release approval.

### Full acceptance

Dedicated strict no-deploy workflow pins exact PR #585 ancestry and changed-file whitelist, runs app build and ALL inherited + new Node tests, real Chromium/WebKit UI and synthetic original SHA/screenshots, downloads and SHA-checks four public originals for genuine geometry-only evidence, deletes all JPEGs before artifact publication, independently audits screenshot SHAs, and uploads sanitized metrics and mobile screenshots only. Keep PR draft and issue #255 HOLD regardless of green CI.
