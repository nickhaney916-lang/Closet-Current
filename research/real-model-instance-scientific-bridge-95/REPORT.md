# Closet Current — Priority #95: actual P86 model evidence to P94 per-garment independent-mask scientific gate

**Research-only / Family Alpha Issue #255 HOLD / Never modify, merge or deploy production or existing staging.**

**Exact parent:** Priority #94 [draft PR #649](https://github.com/nickhaney916-lang/Closet-Current/pull/649), SHA `af45582557104fc435703c90de26e19b52e9eace`. Independent source-only [CI #42155120960](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42155120960) SUCCESS: 869 Node tests, six actual Chromium/WebKit mobile original-photo annotation UI cases at 320/390/430, 20 SHA-audited screenshots, 59 original-licensed JPEGs. #94 has **zero actual independent human instance masks**, and this priority must not invent any.

## Audited prior actual AI model evidence, not a new AI improvement

Read original Priority #86 [research draft PR #642](https://github.com/nickhaney916-lang/Closet-Current/pull/642), commit `51aeeacdff675175f89a17dd64c1281e0aa7cee8`, actual [GitHub Actions #42143014654](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42143014654), artifact **#13469256263** (original ZIP SHA `65f72decb1ed6f62d4c45079520c7337c5fce643a4679a3eeb34ff9bd36c6c3b`). Its full archived real inference files were inspected to extract a restricted deterministic **photo-level** classification snapshot; the source records, run ID, exact model weights/revisions and original JSON SHA digests remain pinned. No raw embedding vectors, private images or unverified historic expected-category labels are transferred.

- **59 actual FashionCLIP q8 ONNX/WASM whole-photo inferences** across frozen original development 32, validation 11, locked 16, including original abstentions and unsupported Accessories/Scarf photo. Model outputs are source-photo suggestions, not person-confirmed garments or independent category/color truth.
- **Six actual SegFormer B0 ONNX/WASM semantic clothing-class maps** on three earlier inspected original photos in Chromium and WebKit. Each genuine model label-map SHA is preserved. Connected clothing regions and mask-grouping counts are **not independent individual garment masks**; boxes must NEVER be promoted into polygons. The pinned converted SegFormer repository's license remains **UNSPECIFIED — RELEASE BLOCKED**.
- **All 59 original licensed JPEG bytes** independently SHA-256 verified in the new evaluation job. Cross-check current full source manifest, frozen 32/11/16 partitions, and separately licensed overlapping-shirts/flat-lay semantic samples, preventing source/partition swaps.

## Actual engineering integration

- The new `model-instance-gate.mjs` makes model provenance explicit and only permits actual source-bound **native learned-instance-identity polygon** candidates through a separate schema. It rejects FashionCLIP photo-labels, SegFormer semantic box proxies, false per-mask category/color claims, unpinned foreign original source hashes, duplicate/missing locked records and invalid normalized polygons.
- It composes existing #94 independently sourced A/B/C polygon adjudication and true mask IoU/precision/recall scoring **only** when both source-bound human claims and genuine per-instance predictions are supplied. Self-attested reviewer identity or a JSON model-execution flag cannot prove actual independence, so resulting numbers remain **EXPLORATORY**, never scientific or release-authorized without out-of-band human/process validation.
- Existing 59-photo corpus is insufficient for #60's scientific minimums: >=100 unique originals, >=30 locked garments, >=10 locked negatives, at least five per category, independent A/B/C review and genuine unmodified holdout model predictions.
- Without human masks or true instance model predictions, the acceptance artifact deliberately reports **null** instance precision, recall, IoU, category/subtype/primary/secondary color accuracy; never convert unknown into 0% or 100%.
- Strict research-only exact-parent no-deploy Actions; inherited Node+browser research safety checks remain unchanged. No production app, staging, AI model worker, user photos, 3D mesh or cloud writes.

**Scientific verdict:** NEEDS REWORK. **Engineering verdict:** PENDING exact-head GitHub Actions. Family Alpha HOLD. Parallel Work #90's 3D realism remains isolated.
