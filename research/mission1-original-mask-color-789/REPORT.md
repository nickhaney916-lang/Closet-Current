# Closet Current P789 — genuine model-masked source color diagnostic

**Purpose:** Test whether genuine frozen B0 garment-region mask sampling of actual source pixels reduces background-color contamination compared with existing `PhotoColor.estimate` whole-center sampling. **Research only, draft/unmerged/undeployed; FAMILY ALPHA HOLD #255.**

## Frozen observed materials and limited reference standard
Five source-original Wikimedia photographs already in `benchmark/locked-photo-sources.json`, with byte-identical SHA-256, published source URL, author/license provenance and descriptive color terms in the **source file titles** (red shirt, black shirt, blue jeans, orange shorts, gray jeans). These 5 were already in the exposed development pool of 73; **not a newly sealed, untouched, training-disjoint holdout**. A descriptive filename color is a WEAK publisher proxy, **not** actual separately masked garment color, human-adjudicated primary color or precise label truth. In some original pictures multiple garments and colors may coexist.

Actual frozen `Xenova/segformer_b0_clothes@a2489ea8e7ec1ee912190546bad31a4906ccca76` ONNX runs in the real mobile-sized Chromium and WebKit browser, with immutable allowed model assets only. SHA-bound source JPEGs (downloaded by existing repository hash verifier) are decoded, optionally resized only IN MEMORY for inference. The original decoded image is sampled at the real segmentation mask raster; SHA-verified real B0 semantic model labels select source pixels. `PhotoColor.maskedPalette` returns a **review-only candidate color**, while the same source RGB without the model mask goes through the original `PhotoColor.estimate` heuristic. This is an observational exploratory comparison, **not** a change to production thresholds, photo storage, segmentation or classifier.

**Sample selection precommitted in runner before any real execution:**
- `commons-0002` — publisher title *Rood t-shirt*; Red; upper-garment class 4.
- `commons-0003` — *Zwart shirt*; Black; upper-garment class 4.
- `commons-0023` — *Blauwe jeans*; Blue; bottom classes 5 or 6.
- `commons-0033` — *Old Bull Lee - Orange* shorts; Orange; bottom classes 5 or 6.
- `validation-0017` — *Grey Jeans*; Gray; bottom classes 5 or 6.

The raw masks may be misleading, e.g., class 4 spans both tops and outerwear and could be a part of a dress. No results are interpreted as independently labeled color accuracy. No confidence or human review is fabricated.

## Fail-closed data and behavioral contract
`research/mission1-original-mask-color-789/source-color-evidence.mjs` checks original source SHA syntax, exact model mask map SHA, only frozen 18-class model label IDs, exact RGBA dimensions, bounded model mask resolution and known semantic groups. It never mutates the source RGBA and masks out all rejected pixels; fewer than 64 or 0.5% selected pixels, or mask covering over 85% of the photo, yield **no color**. Every result always says `candidateNeedsConfirmation:true`, `autoSaveAllowed:false`, `independentHumanColorVerified:false`, `modelPromotionAuthorized:false`. Six/seven negative synthetic regression tests cover misleading backgrounds, source SHA transplant, wrong semantic group, malformed image/map, abnormal near-entire frame, successful dress-source mask and immutable photo pixels. These prove only validation and math.

## Engineering acceptance and limits
Dedicated GitHub Actions `.github/workflows/mission1-original-mask-color-789-no-deploy.yml` must pass 5-path exact parent `1c9b326428051161094ec8bed28f30a8985ebb18`, full Node suite and original-photo in-browser pinned B0 inference, then upload **JSON receipts only**; no original JPEG/model weights or private data. CI success verifies evidence collection, not a claim that mask-based colors beat whole-image colors, and should preserve negative results. Even a favorable title comparison cannot support launch: original photos are already exposed, weak color proxies, not independently human-labeled, and mask quality is known to be inadequate.

**No shipping `public/` files changed, model rights not expanded, no automatic source color acceptance or release.** The remaining Mission 1 blockers are independently rights-cleared *new* original photo cohort, two actually separate blind audited human annotators for category/subtype/boundary/color, actual model improvements on their heldout annotations and verified signed two-owner physical iOS/Android private-cloud acceptance. No authorization to merge/deploy.
