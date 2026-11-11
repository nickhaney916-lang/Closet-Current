# Mission 1 P821 — actual frozen SegFormer B0 source-logit threshold sensitivity on ten genuine publisher originals

**FAMILY ALPHA HOLD #255 — DRAFT, UNMERGED, UNDEPLOYED. MISSION 1 NOT COMPLETE.** Direct independently green P820 exact source HEAD `3f1d13cd2916ffd67d6ed8102675963a513125aa` ([Actions #42969638458](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42969638458), native build and 1,691 Node tests PASS / 1 optional SKIP / 0 FAIL). Five research-only paths: frozen-source experimental map, its unit tests, instrumented existing 10-original model-scoring harness, dedicated no-deploy CI, and this report. No app, trained-model weights, private original photographs, main, staging, production, cloud or release changes.

## Objective

P817 proved the existing default normal native semantic-mask grouping only matched **10 of 23** real publisher garment polygons in Chromium (9 false positives and 13 missed), and **9 of 23** in WebKit (10 false positives and 14 missed). Naively splitting the model's source components performed **worse**, so it is not a usable automatic segmentation fix. We now need to determine whether `clothingLabelMap` itself discards recoverable true garment pixels by requiring **>=70% top-class probability and >=15% relative softmax first/second margin**, or if relaxing these native class gates only produces more false masks. This is a **developer research diagnostic**, NOT a trained-model improvement or a fresh blinded accuracy test.

## Predeclared fixed original-logit arms

The SAME unchanged frozen `Xenova/segformer_b0_clothes` ONNX version runs on all ten exact SHA-registered already-DEVELOPMENT-EXPOSED publisher original JPEGs, in genuine Chromium and WebKit. No new source images or owner cloud data are imported. From the SAME model logits, the research-only postprocessing compares five predetermined softmax score thresholds:

| Profile | Top probability | Relative top-second probability margin |
| --- | ---: | ---: |
| `native-70-15` | 0.70 | 0.15 |
| `exploratory-65-12` | 0.65 | 0.12 |
| `exploratory-60-10` | 0.60 | 0.10 |
| `exploratory-55-08` | 0.55 | 0.08 |
| `strict-80-20` | 0.80 | 0.20 |

All five use the exact native `clothingMaskGroups` semantic source grouping and its existing confidence/area rules and **person-detected gate**, with no automatic source splitting, new class/subtype/color assignment or changed model weights. The research `native-70-15` logits map MUST exactly match existing unmodified application `clothingLabelMap` labels, confidence array and person detection on genuine model outputs; CI fails otherwise. Lowering an input threshold does not change the additional native component acceptance logic.

Each profile is independently scored against ALL **23 publisher-original labeled garment instances** at model raster one-to-one same-semantic-family IoU >= 0.50. Every false prediction and missed original mask is counted. No single image or category is removed after observing the result. Per-source 23-mask denominators, total FP/FN, per-profile precision/recall/F1 and actual SHA of source labels are retained in research numeric-only receipts. These already-known publisher polygons do NOT prove independently verified commercial photo rights, disjoint pretraining data, two distinct blinded human reviewers or accurate clothing subtype/primary color.

## Safety and no-deploy workflow

Dedicated `.github/workflows/mission1-real-source-threshold-profiles-821-no-deploy.yml` checks exact verified P820 parent and just five research/test/CI paths, runs targeted exact-native label-map tests, app native build and complete Node suite, then sources exact original P792 annotation JPEGs and uses the pinned B0 model twice. It verifies original SHA registration and immutable exposure quarantine, genuine original publisher masks, all 23 positive truth items, negative predictions, and explicit `thresholdAutoPromoteAllowed:false`, `thresholdOriginalHumanMaskReviewers:0`, `newlyEnrolledBlindedHumanHoldout:false`, `releaseAuthorized:false`, `familyAlpha:'HOLD'`. Original photographic bytes and screenshots are ERASED before uploading any artifact; only source/mask SHA and metrics are retained. **Do not mark P821 complete before exact final-head CI SUCCESS.**

No threshold may be automatically adopted from this **already exposed, tiny development set**. Even if a relaxed profile appears better here, P821 does not provide unseen independent holdout metrics or pretrained weight licensing/training overlap validation. Any experimental adoption would require a new pre-registered rights-cleared source cohort, two truly different independent blinded annotators supplying original-pixel masks/category/subtype/primary color, predeclared acceptance criteria, no-source-leakage and actual original-owner privacy/mobile phone performance.

## Remaining real Mission 1 external acceptance gates

Genuine independent rights-cleared original photo acquisition and blind masks, acceptable category/type/color/instance precision-recall/IoU, actual physical Android Chrome and iPhone Safari camera/inference memory/latency and secure two-owner original-photo private sync have not been independently established. There is **no simulated ground truth or invented completion percentage**. Family Alpha HOLD #255 remains open; no code merges or deployment.
