# Closet Current — Mission 1 Priority #772: first new real publisher-polygon cohort after exposed 65-photo development

**FAMILY ALPHA HOLD #255. Independent exploratory research only — no production, staging, hosted Supabase or release.**

## Why this work matters

Previous Mission 1 testing actually ran the FashionCLIP worker on 59 licensed real JPEGs and tested SegFormer masks on **six** publisher-annotated Fashionpedia photographs, totaling 65 previously examined source originals. The existing P768/P769/P770/P771 work prevents source spoofing, repeated cropped originals, false blind reviewer agreements, and overcounting mixed-outfit labels, but **does not by itself demonstrate recognition gains on fresh real photographs**.

P772 selects a separate group of 12 actual Fashionpedia *validation-set* original JPEGs with publisher human polygon annotations, **without consulting model results**. The frozen, deterministic salted image-ID selection assigns 12 distinct photos across eight eligible supported semantic garment categories (shirt/blouse, top/T-shirt, jacket, pants, shorts, skirt, dress and shoes), with a second independently selected photo for shirt/blouse, jacket, pants and dress. Only images marked with publisher Pexels license ID 8 and readable human polygons are eligible. Previous six P66 image IDs and their SHA identities, plus historical 59 JPEG original byte SHAs, are excluded. Publisher annotation JSON itself is locked to SHA-256 `f831f415edad12d52acde8b138fe7ebd1592b57bf0dcd6a3b63ba8cabd208223`.

## Genuine-source and independent-score procedure

1. **Before running the model**, use the committed deterministic selection algorithm in `scripts/select-publisher-mask-holdout-772.py` and an exact annotation SHA. Fetch the original Pexels-dataset JPEG members from the published Fashionpedia validation archive and SHA-check each selected source. Keep original JPEGs out of GitHub commits.
2. Reproduce all previous six publisher source-byte digests and 59 historical originals. Run P769's **65 real-source seven-window perceptual overlap check** against all 12 new originals. Any overlap flag is retained and requires independent image/source review; a clean difference hash does NOT prove independence or model pretraining exclusion.
3. Reuse the *unchanged* P66 original SegFormer ONNX/WASM + browser evidence runner from its pinned donor SHA. Infer on all twelve images in real headless Chromium and WebKit at 390 CSS pixels, with publisher human polygons independently drawn before our selection and model inference. Measure semantic-region IoU and visible exterior boundary F1, including misses; independently SHA-verify rendered overlay screenshots.
4. Publish each original photo ID/SHA, publisher human polygon count, actual model region metrics, screenshot SHA, and exact final commit in a public-source-only research artifact. Do not drop bad samples, retune thresholds based on the selected cohort, or replace actual failed predictions with mock masks. Preserve model revision and source SHA for every row.
5. Check full Node regressions, the build, and six Python selection tests in a NO DEPLOY GitHub Actions job.

## Limitations that remain explicit

- Fashionpedia is a **publisher-generated annotation source**, not two distinct independently blinded reviewers signing the P768/P771 source-category/subtype/color/mask record. No owner photo or private wardrobe is used.
- Fashionpedia polygons support segmentation/semantic category comparisons, **not reliable exact garment subtype, human primary-color ground truth, owner confirmation, actual independent per-instance separation for same-category garments, or 3D photorealism acceptance**.
- Publisher reports Pexels license ID 8 but **does not expose original per-photo source pages or independent original photographer rights verification**; use is limited to isolated research pending rights review.
- Public validation photos can have appeared in pretrained models. Our deterministic precommitted selection and disjoint source SHA/perceptual screening establish this is a *new research evaluation cohort for this project*, **not a guaranteed globally unseen independent generalization benchmark**.
- These twelve photos become **exposed development examples immediately after inference**. They must be added to the future held-out exclusion ledger and never be scored again as unseen after tuning to their results.
- Even a green CI and positive real-image metrics cannot authorize auto-indexing, completion of the complete Mission 1 independent-humans test, the shift to broader photo-to-3D Mission 2, or lifting Family Alpha HOLD #255.

**Scope:** exactly four paths from verified P771 `cb58762f2fde0b4907c6742b540d735a9705742a`: Python selector, six synthetic metadata unit tests, this report, and NO DEPLOY CI. All browser donor/source testing happens in an ephemeral runner, never writes permanent application or cloud paths.
