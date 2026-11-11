# Closet Current — Mission 1 P828: verified, source-specific garment recognition failure audit

**FAMILY ALPHA HOLD #255 — RESEARCH-ONLY, DRAFT, UNMERGED, UNDEPLOYED. MISSION 1 NOT COMPLETE.**

## Pinned model evidence and research scope

Independent base: verified P827 draft [PR #865](https://github.com/nickhaney916-lang/Closet-Current/pull/865), exact final head `37f15715fc32fef6922c3beb42089b8bebe2c6c5`, successful 2/2 original source model + complete app jobs in [GitHub Actions #43078347613](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43078347613). Full Node 1,697 PASS / 1 optional SKIP, frozen model actually ran all ten publisher originals and 23 annotated garment instances on Chromium and WebKit.

P828 derives a **deterministic numeric-only failure attribution** from the SHA-pinned artifact `mission1-P827-fused-original-B0-source-threshold-profiles-23-masks-NO-RELEASE`, ID `13884805320`. The source artifact has `manifest.json`, `chromium/results.json`, `webkit/results.json`, no actual JPEG bytes or masks. All three exact file byte-level SHA-256 are hard pinned in the independent audit module, along with model ID/revision and immutable P827 run/head. The workflow retrieves only this already verified artifact by exact run ID, hashes each member, and rejects changed bytes even when JSON appears plausible.

Five predeclared thresholds, all ten unique source IDs/SHA, all 23 human publisher polygons, one-to-one IoU >=0.50 matches, exact TP/FP/FN conservation per image/profile/browser, matching ground-truth region, no duplicate prediction masks, complete missed truth IDs and aggregate counters are independently validated before emitting the smaller report. It rejects missing originals, missing labels, manipulated model provenance or postselected thresholds. Public publisher polygons are pre-existing annotations, NOT a genuine prospective two-blind-human validation set, not model-license clearance or actual labeler authorization.

## Actual observed P827 errors (already exposed developer research originals)

The verified P827 numeric results show **13 of 23 original garment annotations missed in BOTH browsers** at native 70/15. Nine instances matched in both; Chromium alone additionally matched one upper-garment annotation near the 0.50 IoU threshold. The native model matched 10/23 Chromium (9 false positives) and 9/23 WebKit (10 false positives).

Of the six multi-garment photos (19 publisher garment instances), only **9/19 matched in either browser**; the four single-garment photos matched 1/4 Chromium and 0/4 WebKit. This is not a garment classification score, merely model raster instance matching.

| Semantic family | Publisher instance truth | Chromium matched | WebKit matched |
| --- | ---: | ---: | ---: |
| Upper garments (including publisher blouse/jacket/top categories) | 12 | 6 | 5 |
| Skirts | 2 | 0 | 0 |
| Bottoms | 4 | 3 | 3 |
| Dresses | 1 | 0 | 0 |
| Footwear | 4 | 1 | 1 |

The original image IDs and annotated polygon IDs are retained only as **public publisher identifiers**, not account identities or original photo downloads. A 10-photo development set is far too small to infer universal per-category probabilities. No auto-promotion, new app inference threshold or model release is justified.

## Engineering next move — not speculative thresholds

The failed profiles show that moving the softmax gates alone does not recover the missing instance count: native 10/9 matched, 65/12 9/9, 60/10 8/8, 55/08 7/6, 80/20 6/6 (Chromium/WebKit). The persistent failures in skirts, dress and footwear versus comparatively stronger bottoms and upper garments justify investigating real source-class confusion, small-object coverage, instance boundary/occlusion, camera diversity and model-family suitability. **Do not assert new recognition accuracy until a different algorithm is measured on genuine, non-exposed rights-cleared annotated photos with independent two-blind-human review.**

This work supplies an independent gate and more specific error attribution, NOT model retraining or confirmed new true positives. A future signed human cohort of at least 100 unique source photos, 30 genuinely heldout garments plus ten negatives, original-mask/type/color independent two-labeler audit, original-photo source rights, mobile performance on physical Chrome/Safari, authenticated owner-private end-to-end verification and release consent remain unavailable.

## Acceptance

P828 only changes four research/test/report/CI paths after exact green P827. Dedicated no-deploy CI must successfully (a) compile/check Node tests, build app and full Node regressions (b) retrieve exact P827 numeric artifact, reject changed SHA, independently recompute source and family counters and output a read-only numeric-only receipt. Do not call verified until exact final-head 2/2 CI success. No production/staging merge, RLS policy, source images, model weights or deployment.

**FAMILY ALPHA HOLD #255 remains OPEN. MISSION 1 NOT COMPLETE.**
