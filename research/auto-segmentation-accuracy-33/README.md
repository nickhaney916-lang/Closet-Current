# AUTO-SEGMENTATION-ACCURACY-33 — Source-locked real-model falsification experiment (Parallel #27)

**RESEARCH ONLY — NOT FOR MERGE OR DEPLOY. Family Alpha Issue #255 remains HOLD.**

Base: PR #589 `SCENE-CLASS-TRUST-32`, exact SHA `79e957719bd90f7f1cd1ae71ec4bde5ff14ae93c`, previously passing no-deploy Actions #41918745343. This branch never updates source application files, production, staging, storage, authentication, or fitted 3D garments.

## Precise hypothesis / intervention

The pinned SegFormer B0 clothing semantic model has genuine failures on overlapping shirts (0/2 category-aware box matches, shirt pixels mislabeled skirt) and flat-lay clothing (0/3, wrong dress fragments). Human-gated PR #589 prevents unsafe prefill but cannot fix pixels. This experiment **does not substitute a fabricated instance model**: it independently tests whether the already-implemented, deterministic, bounded pixel-contrast detector can add useful **UNCLASSIFIED review rectangles** on the original source photographs, without altering a single model pixel. It is a complementary foreground **localization** hypothesis, not recognition or automatic garment classification.

- `contrast-rescue-33.mjs`: requires externally SHA-verified unchanged original JPEG provenance and in-memory bounded decoded pixels; calls the existing flat-lay detector; suppresses only essentially identical crop rectangles (IoU >0.85); returns review-only rectangles explicitly set to Uncategorized, Unknown, blank color, unconfirmed, unreviewed, unsaved; never calls network, camera roll, owner-private storage, or user model. It cannot guess touching garment instances or unseen garment surfaces.
- `scoreReviewLocalization33`: maximum-cardinality one-to-one **class-agnostic** IoU >=0.5; outputs null for semantic accuracy or independently verified pixel IoU. A wrong skirt/dress class label cannot be credited as a correct garment classification.
- `verify-auto-segmentation-33.mjs`: reproduces the actual PINNED `Xenova/segformer_b0_clothes` ONNX model revision `a2489ea8e7ec1ee912190546bad31a4906ccca76` with Transformers.js 3.8.1, real Chromium/WebKit, six actual model runs (three original JPEGs × two engines) via the unchanged PR #588 model worker and browser runner. Downloads the exact locked original source with original width, height, byte length, SHA-256 and license; bounded analysis JPEG is derived in memory. Node sharp decodes the genuine verified original independently to a <=512px RGB raster for contrast proposals, and source identity remains unchanged. Browser screenshot overlays: actual global SegFormer pixel-label map, reference annotation boxes (single researcher), old/new shoe-grouping, plus yellow dashed **unclassified** contrast rectangles on right panel. All masks and crop paths are source-linked and unsaved.

## Evaluation limitations (not a holdout)

The three genuine licensed photographs `commons-0021`, `two-shirts`, and `flatlay-outfit` were already used in PR #588 and PR #575. Their original JPEG sources, license, dimensions, bytes and SHA are in `research/multi-review-triage-28/frozen-photo-annotations-16.json`. The existing reference rectangles have **one researcher**, not two independent blinded annotators. No independent pixel-level masks exist.

We measure: source-verified original/JPEG/model-mask hash, class-aware baseline and post-shoe-group scores (both real SegFormer), class-free model localization vs union of genuine model and contrast proposals, total false proposals, and elapsed inference and host-runner RSS (not equivalent to GPU/WebKit memory). Every case, including zero-proposal negatives, remains in the report. No synthetic boxes or hand-drawn masks are used to claim real-model improvement. Unit tests use synthetic arrays strictly to verify safety invariants; real photograph results are separately labeled.

This experiment cannot establish class/color accuracy, overlap instance separation, true IoU against human pixel masks, independent unseen-cohort generalization, physical-phone acceptance, or any right to auto-save. Even if extra regions improve box localization on this sample, **scientific verdict remains NEEDS REWORK**, not Family Alpha PASS.

## Reproduce / acceptance

On the isolated branch, the new `auto-segmentation-accuracy-33-no-deploy.yml` requires exact source ancestry and a 4-path research allowlist; runs inherited application build and all Node regressions; demands actual model download+inference in real Chromium and WebKit; tests six mobile viewport screenshots (320/390/430 across two engines) plus two hard cases at 390 each, verifies every original SHA/model-map SHA/screenshot SHA and no unauthorized browser network writes, and uploads public licensed original photo comparison screenshots with sanitized report. Missing original/model/assets/browser checks **fail** the CI job rather than silently count as success.

**Integration recommendation:** keep the app source unchanged. Do not add automatic foreground boxes to the user experience unless a separate genuinely new, independently annotated sample demonstrates useful precision and an operator can verify multiple overlaps versus one object. Follow-on priority is clothing-specific **instance segmentation model and human-reviewed pixel masks** on a prospective untouched photo set, then calibrated class/color recognition and category corrections. Family Alpha HOLD.

## Actually observed independent rerun — exact reference run #41920713079 (before visual-presentation cleanup)

The predecessor evidence run [41920713079](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41920713079) at exact commit `dd1f3975a8a4076fe8979877199354512e4fe98a` passed **533/533 Node tests**, full application build, six original-source pinned SegFormer ONNX runs (3 inputs × Chromium/WebKit), exact original JPEG and actual pixel-map SHA checks, and all 10 SHA-verified PNGs (320/390/430 for jeans/shoes in each engine, plus overlapping shirts and flat-lay at 390 in both). The same original/photo/model results are consistent between engines.

**One-to-one category-aware IoU ≥0.5 — pinned real model only**, counted separately from contrast boxes:

| Test original | Existing (paired-shoe) correct / expected | New foreground candidate correct *categories* / expected |
| --- | ---: | ---: |
| Worn jeans / sneaker pair | 3 / 3 | **3 / 3 (UNCHANGED)** |
| Two touching/overlapping shirts | **0 / 2** | **0 / 2 (UNCHANGED)** |
| Flat-lay white shirt, trousers, boots | **0 / 3** | **0 / 3 (UNCHANGED)** |
| **All three originals, either engine** | **3 / 8** | **3 / 8 (UNCHANGED)** |

Existing paired-shoe model proposals: 7 suggestions, 3 true positives, 4 false positives, 5 missed garments, precision 42.9%, recall 37.5%. That comparison is relative to previously single-researcher box annotations, not independent pixel masks. Older pre-pair proposals (the original MASK-31 baseline): 8 suggestions, 2 true positives, 6 false positives and 6 misses, precision 25.0%, recall 25.0%.

**Separate class-agnostic localization comparison (NOT category accuracy):** Existing model boxes localized 5 of 8 visible annotated objects. Adding six unclassified original-pixel contrast boxes localized 7 of 8. Of the six added rectangles, only two increased correct localization; net unmatched localization proposals increased by four. The flat-lay improved from 1/3 to 3/3 boxes, with five extra rectangles and several spurious candidates including accessories. Overlapping shirts remained 1/2 *localized* and 0/2 correctly classified; contrast abstained because the corners were not consistent enough. Same outcomes in both engines. This cannot be described as reliable garment detection, calibrated recognition or correctly separated instances.

**Observed execution measurements:** Chrome overall model-run elapsed ms per photo 4,690 / 1,957 / 1,794; WebKit 63,013 / 2,716 / 2,735. The first WebKit run includes model loading and network initialization; these are not model-only latencies. Instrumented Node orchestrator RSS ranged about 310–388 MB; **this is not browser GPU or physical-phone memory.** The source was never saved to cloud and the evaluation used no real customer accounts. Screenshot evidence was independently opened: genuine source and label pixel overlays confirmed skirt-like masks on blue shirt, false dress-like mask on flat-lay white shirt, and yellow unclassified contrast rectangles. A screenshot legend was duplicated on successive photo navigations; the subsequent research-only patch removes the repetition and independently asserts exactly one legend.

These are retrospective, previously used single-reviewer images. **No genuine new image cohort, no independent second human reviewer, no source-accurate pixel IoU, no 95% color/category accuracy, and no release authorization.**

## Highest-impact next experiment (not integrated here)

Train or evaluate an actual **clothing instance-aware** detector, using a clean prospective cohort with verified image rights and blinded manual per-instance annotations. Fashionpedia explicitly defines instance masks and attribute labels ([dataset](https://fashionpedia.github.io/home/index.html)); DeepFashion2 has clothing-specific per-item masks and an occlusion benchmark ([paper](https://openaccess.thecvf.com/content_CVPR_2019/html/Ge_DeepFashion2_A_Versatile_Benchmark_for_Detection_Pose_Estimation_Segmentation_and_CVPR_2019_paper.html)). SAM 2.1 provides promptable object masks with Apache 2.0 code/weights ([official release](https://ai.meta.com/research/sam2/)), but **SAM alone does not label garment types, and mobile runtime must be measured**. Do not assume rights to any dataset's *photographs* solely from its annotation license. Keep current app category review gate and original JPEG intact until blinded performance proves value.
