# GARMENT-CLASSIFICATION-ACCURACY-48 — exact-head results and handoff

**Status: NEEDS REWORK (scientific and mobile model-integration acceptance).** This is an opt-in research candidate. The default FashionCLIP pipeline and Priority #47 safety behavior remain unchanged. Family Alpha is HOLD; nothing was merged, deployed, or applied to staging.

## Reproduction and provenance

- Baseline parent: Priority #47 / PR #605, `5c55e8fe462af19fbae31618a2e587175260f68c`.
- Measurements: exact research head `ace0332949a61b687ee60bd15a308b9d7605a568`; dedicated no-deploy Actions run [#41955948986](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41955948986), success.
- Evidence bundle: Actions artifact `GARMENT-CLASSIFICATION-ACCURACY-48-exact-head-evidence` (ID `13382804184`). It contains every paired prediction, comparison, source audit, 84 screenshots, and six browser acceptance records.
- Existing model: `ff13/fashion-clip`, revision `0f99955d944c39bfd9d035a02ac273c7a44a406b`, Transformers.js 3.8.1, Q8 ONNX image encoder, ONNX Runtime Web/WASM. Candidate: `accuracy48-prompt-ensemble-v1`; same image encoder/runtime, 64 fixed text descriptions averaged over 16 existing subtype rows, 75% ensemble + 25% canonical vector. Candidate embedding file SHA-256: `f70f9c162d29f769be8e31e13c9207ceee128b628c956c301340ad3d987e2ae3`.
- Model artifacts and photographs remain local to browser inference. Candidate changes only opt-in text vectors (about 2.3 MB); it adds no per-photo paid inference. FashionCLIP is MIT licensed. The reviewed alternative FashionSigLIP is Apache-2.0, but its available model card describes retrieval, and this assignment did not establish a compatible, measured mobile ONNX package. No model swap is justified.

## Dataset and ground truth

The rights/hash audit passed: **59 unique original photographs**, all 59 hashes matched the pinned source manifest, zero duplicate hashes, and all source/license/credit fields mapped. Partitions are 32 development, 11 fresh validation, and 16 locked evaluation (13 clothing images, 3 non-clothing controls). Sources are Wikimedia Commons/Museum Rotterdam and public-domain Commons files; per-image rights and credits are in `benchmark/locked-photo-sources.json` and the generated `dataset-audit.json` in the evidence bundle.

Labels are **provisional** single-file visual reviews. No independent two-person labeling/adjudication evidence was found. The set is smaller than the requested 100–200 examples and is not broad enough to certify real household phone-photo accuracy. Do not treat these percentages as production accuracy.

## Paired results

Both profiles ran through the same pinned FashionCLIP image model on the identical photograph bytes. The candidate prompts were fixed before reading locked evaluation results; no locked examples were removed or tuned against.

| Partition | Model | Broad category | Exact subtype | Auto subtype precision | Auto subtype coverage | High-confidence wrong subtype | Non-garment rejection |
|---|---|---:|---:|---:|---:|---:|---:|
| Development (32 garments) | Baseline | 32/32 (100%) | 23/32 (71.88%) | 30/31 (96.77%) | 31/32 (96.88%) | 1 | n/a |
| Development (32 garments) | Candidate | 30/32 (93.75%) | 21/32 (65.63%) | 27/28 (96.43%) | 1 | n/a |
| Validation (11 garments) | Baseline | 11/11 (100%) | 6/11 (54.55%) | 9/9 (100%) | 9/11 (81.82%) | 0 | n/a |
| Validation (11 garments) | Candidate | 11/11 (100%) | 6/11 (54.55%) | 9/9 (100%) | 9/11 (81.82%) | 0 | n/a |
| Locked evaluation (13 garments) | Baseline | 9/13 (69.23%) | 4/13 (30.77%) | 4/7 (57.14%) | 7/13 (53.85%) | 3 | 2/3 |
| Locked evaluation (13 garments) | Candidate | 8/13 (61.54%) | 3/13 (23.08%) | 4/7 (57.14%) | 7/13 (53.85%) | 3 | 2/3 |

The candidate did not improve exact subtype accuracy, accepted-subtype precision, coverage, unsafe errors, or negative rejection on the locked set. It reduced category accuracy by one garment and exact subtype correctness by one. Development also regressed. Validation was unchanged. Thus it misses the 95% broad-category and 95% accepted-subtype targets by a large margin and is not a release candidate.

### Locked category confusion matrix — candidate

Rows are human-reviewed actual labels; entries are predicted category counts. The three negative controls are reported separately because the recognizer returns a rejection state rather than a clothing category.

| Actual | Predicted counts |
|---|---|
| Tops (3) | Tops 2; Dresses 1 |
| Bottoms (3) | Bottoms 2; Tops 1 |
| Dresses (2) | Dresses 2 |
| Outerwear (2) | Tops 2 |
| Shoes (3) | Shoes 2; Uncategorized 1 |
| Non-clothing controls (3) | Rejected 2; false positive Accessories 1 |

On baseline, Outerwear was Outerwear 1 / Tops 1; candidate changed this to Tops 2. Other category confusions were unchanged. Both profiles rejected 2/3 negative controls.

### Locked subtype confusion matrix — candidate

| Actual subtype | Candidate subtype outcomes |
|---|---|
| T-shirt (1) | Sweatshirt 1 |
| Blouse (2) | Unknown 1; Casual dress 1 |
| Jeans (1) | Jeans 1 |
| Skirt (2) | Skirt 1; abstain 1 |
| Dress (2) | Unknown 1; Casual dress 1 |
| Jacket (2) | abstain 2 |
| Sneakers (2) | Sneakers 1; Ankle boots 1 |
| Boots (1) | abstain 1 |

Three candidate high-confidence wrong predictions remain: `commons-0003` T-shirt→Sweatshirt, `commons-0016` Blouse→Casual dress (and Dresses category), and `commons-0078` Sneakers→Ankle boots. Baseline high-confidence errors were `commons-0003` T-shirt→Sweatshirt, `commons-0014` Blouse→Tunic, and `commons-0078` Sneakers→Ankle boots. A numeric confidence score is not retained in the benchmark result (`scoreEvidence: null`); `strong` is a relative acceptance flag, not a calibrated probability.

## Latency and memory

Per-photo recognition latency was similar. On the locked split, baseline median/p95 was 524/1,064 ms; candidate was 521/1,053 ms. Across the other splits, medians were 499–562 ms and p95 1,040–2,219 ms. Model load was about 2.8–3.3 seconds across fresh browser runs. The benchmark's Chromium heap field remained a constant 10,000,000-byte before/after value, and exposed no model resource byte entries; this is not a valid memory measurement. WebKit memory was not available. Memory cost is therefore **not established** beyond the known ~2.3 MB extra prompt-vector payload.

## Browser integration and source/privacy checks

The 596/596 Node tests passed. The full CI browser scenario passed 6 contexts (Chromium and WebKit × 320, 390, 430 px) and produced 84 nonblank screenshots. Independent audit confirmed every screenshot SHA-256 and viewport width; all 84 files decoded successfully and were nonblank. Representative contact sheets were visually inspected.

Across all six contexts, the unchanged original JPEG hash matched `e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff`; human corrections saved and reopened, owner-private indexing held, duplicate re-import was blocked, one owned look remained usable, and V4 backup/restore passed. There were zero unexpected non-GET requests and zero application errors. No photo was transmitted to an external model service.

**Mobile inference limitation:** these browser acceptance screens showed safe abstention (`category: null`, `itemType: null`) and preserved manual correction. The test recorded 13 failed model-asset requests to Hugging Face/CDN endpoints across those six contexts. Consequently this proves the local-review fallback, UI, save, privacy, and restore paths, but does **not** prove successful genuine FashionCLIP inference through all mobile-width application contexts. Browser-width emulation also is not physical Android or iPhone hardware acceptance.

## Recommendation

Do not merge or release the prompt ensemble. Keep the current #47 review gate and user correction authority. Next recognition priority: reproduce the category/subtype failures from source-pinned test images, instrument and verify model asset loading for both Chromium and WebKit without transmitting photos, then evaluate a separately packaged local model or a trained feature classifier against a larger, independently adjudicated set with a genuinely untouched holdout. Keep evaluation labels sealed until prompts, calibration, and model choices are frozen.
