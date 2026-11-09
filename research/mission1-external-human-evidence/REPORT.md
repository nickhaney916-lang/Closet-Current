# Mission 1 — external human masks and actual instance diagnostics

Family Alpha HOLD #255. Isolated research only; no merge/deploy or hosted changes. Mission 1 remains incomplete and Mission 2 has not begun.

## Integration and source evidence

Direct base is own verified PR #763 head `97717108fecab965de4605baf1cf3b026a0b629e`. Imports four source/benchmark/test files verbatim from Parallel 66 exact `7a933a6ccd461fc722bf3de18ef977c0233023d3` (PR #761): six-photo Fashionpedia manifest, source downloader, baseline browser benchmark and source test. Does not integrate or alter P66's 3D/cap work, P196, production public app or hosted Supabase. The original 59-source frozen splits remain unchanged.

The separate evidence archive `mission1-real-photo-evidence.zip` was read in its current form. It confirms the other mission stream ran the real FashionCLIP worker on 59 licensed photos, with 4/47 unsafe automatic subtype assignments against existing provisional labels. Those diagnostic labels are not independent human adjudication. These sources and the six Fashionpedia photographs are now development/exploratory evidence, not an untouched holdout.

The imported six photographs carry the publisher's recorded Pexels license, with original per-photo photographer pages unavailable. The full original archive and annotation snapshot are verified by the donor downloader; photo originals stay runtime inputs and are not committed. This preserves the donor's documented rights/provenance limitation and does not imply independent legal adjudication. Published polygon annotations are independent of this agent's predictions; they do not establish the project's two-reviewer protocol, owner approval, primary color or exact app subtype truth.

The separate PR763 queue of 153 CC BY 2.0 candidate records is preserved unchanged and is not promoted. These six Pexels records are a distinct intake scope.

## Measurement defects addressed

The donor's semantic union score considers only human-present classes. It cannot establish instance separation and does not count hallucinated classes absent from a photo's human annotations. The extended benchmark preserves its 13 human-present region results and additionally reports mean IoU across all active supported semantic classes (including predicted-only classes), predicted-only class counts, and one-to-one mask matching.

Predictions are the existing actual `visibleGarmentGroups24` outputs from the pinned SegFormer worker, including its confidence cutoff, component filter, shoe-pair behavior and 24-group cap. A single read-only selected-mask serialization field is instrumented into the served public-research worker response. No stored worker, model inference, logits conversion or grouping code changes. Source and instrumented worker SHA-256 receipts are recorded, and Node independently rehashes every returned proposal mask before scoring. This is measurement instrumentation, not a model improvement.

Human polygons are individually rasterized at the actual output resolution (alpha >=128). Maximum-cardinality bipartite matching requires the same supported semantic family and IoU >=0.5. Every unmatched human instance is a false negative; every unmatched proposal, including wrong/absent classes, is a false positive. One merged proposal cannot be credited for two human instances. This is a bounded model-raster diagnostic, not official COCO/Fashionpedia AP, exact garment category/subtype accuracy, or a validated acceptance threshold. Confidence cutoffs are inherited, not tuned on this cohort.

Publisher annotations treat each shoe as an instance, whereas the app can pair shoes. All 16 instances stay in the all-instance totals; a separately named non-footwear diagnostic reports the other 12 without quietly changing the main denominator. Neither statistic should be called universal application-level pair-of-shoes accuracy.

## Local observed results before final CI

Actual Chromium inference completed on all six original photographs. The descriptive run measured 8 TP, 5 FP, 8 FN over 16 published instances: precision 8/13 (61.54%), recall 8/16 (50%), F1 55.17%. Non-footwear: 7 TP, 5 FP, 5 FN, precision/recall/F1 58.33%. The 13 human-present semantic unions retain donor macro IoU 0.554032 and mean exterior boundary F1 0.671750. Two predicted-only semantic regions lower the all-active mean IoU to 0.480161 across 15 active regions. These are exploratory six-photo findings, not broad recognition acceptance.

Actual local overlay views examined include dress 9029, occluded/low-light apparel 11321 and distant full outfit 12042. The dress mask largely follows the photographed contour; the occluded/low-light example omits substantial lower/upper garment pixels, and distant footwear/upper regions are missed or tiny. These observations are consistent with the numeric failures. Raw pixels and human contours are genuine; no original image is edited. Blue proposal boxes in the final harness indicate actual grouped-pixel extents, not ground-truth garment geometry.

Five new matching regressions cover merged instances, maximum-cardinality versus greedy matching, wrong/absent classes, missing outputs, duplicates/empty/malformed rasters and invalid thresholds. Full regression results, exact final SHA, Chromium/WebKit outcomes and six SHA-verified screenshots per engine are recorded in the PR after completed CI. Local WebKit dependencies are unavailable; hosted Ubuntu installs them explicitly. No physical-device, camera/private-closet or new 3D acceptance is claimed by this benchmark.

## Reproduction and next acceptance gate

Run `python scripts/fetch-fashionpedia-66.py`, `node scripts/build.mjs`, `node --test --test-concurrency=1 tests/*.cjs tests/*.mjs`, then `MULTI16_RELAY_MODEL=1 MISSION1_ENGINE=chromium node scripts/test-mission1-external-human-evidence-browser.mjs` (and `webkit`). Browser artifacts contain source/model/worker/mask receipts, per-photo matched/unmatched IDs, both semantic denominators and screenshots. The no-deploy workflow checks the exact PR head.

Next: use these failures for development, repair or replace instance-aware segmentation with appropriate model/license/performance checks, and obtain a genuinely unexposed rights-cleared representative held-out cohort with independently supplied labels/masks and color/subtype evidence. Preserve source photos, authentication, private ownership and original-photo/2D fallbacks. Do not certify the mission from a green software suite or reuse this cohort as unseen acceptance.

Annotation attribution: Fashionpedia Consortium; Jia et al., *Fashionpedia: Ontology, Segmentation, and an Attribute Localization Dataset*, ECCV 2020; https://arxiv.org/abs/2004.12276 ; official distribution https://github.com/cvdfoundation/fashionpedia ; CC BY 4.0 annotation terms https://fashionpedia.github.io/home/data_license.html . The annotation excerpt is unchanged from P66; new raster diagnostic code and reporting are Closet Current additions.
