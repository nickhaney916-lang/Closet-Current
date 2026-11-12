# Closet Current Parallel #67 — Milestone 3: eliminate live text-model download via frozen fashion vectors

**FAMILY ALPHA HOLD #255 — draft experimental research, UNMERGED, UNDEPLOYED. No owner, staging, production, private phone photographs, cloud or live user recognition engine is changed.**

## Verified prerequisite
[Parallel #67-02 PR #896](https://github.com/nickhaney916-lang/Closet-Current/pull/896) exact HEAD `42dd05cb3378fdb103d16408d4751460054d35e9` has independently [green 3/3 CI #43151861029](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43151861029), full 272/272 native app tests, 16/16 original publisher SHA checks and actual separate text/vision Marqo FashionSigLIP q8 ONNX inference. On a tiny previously development-exposed cohort, forced-choice broad category **12/13**, subtype **8/13**, negatives **0/3**. Uncalibrated model cosine ranking is NOT a valid automatic closet save and may never be portrayed as a blind improvement or percentage on personal clothing.

## Concrete mobile-weight opportunity
The available quantized Marqo ONNX split models are approximately **111 MB text** and **94 MB vision**; the clothing candidate strings are fixed to 47 labels. There is no need to run/download the text model for every user if its output can be built **once** using the exact pinned vocabulary, tokenizer and text ONNX model. This may save the ~111 MB text model from *client runtime delivery*, provided exact parity is demonstrated. This is not yet a real physical-phone memory/transfer measurement; the ~94 MB vision model and its runtime still require evaluation.

## Implemented
1. `scripts/parallel67-precompute-fashion-text-03.mjs` actually runs **SiglipTextModel q8** for exactly 47 frozen local catalog prompts, obtains native `text_embeds [47,768]`, exports an exact **144,384-byte** float32 vector asset, strong SHA-256 digest, strict model revision `782eaf7a0b95411ac96893d2300d1a61a2bcb757`, label hash, zero photo count and explicitly `automaticSaveAllowed:false`. Validates its own write/read roundtrip.
2. `scripts/parallel67-run-fashion-vision-only-real16-03.mjs` loads only native **SiglipVisionModel q8** and processor, plus the independently generated, pinned text vectors; refuses tampered vectors and verifies actual original publisher JPEG bytes against existing SHA source manifests. Uses the **same original cosine scoring** as PR #896 on all identical 16 original images (13 garment + 3 negative). No text ONNX model or tokenizer is loaded in the inference stage.
3. `scripts/parallel67-compare-vision-only-03.mjs` retrieves the exact original P67-02 model report artifact by GitHub run ID #43151861029, source ID/label/sha order and scores, and must verify **16/16 sourcewise top category, subtype, correctness and cosine score/margin parity within 1e-6**. Any loss, corrupt asset or runtime error fails CI.
4. `tests/parallel67-precomputed-fashion-text-03.test.mjs`: adversarial vector/manifest tamper, malicious model revision, output shape and source-order changes, changed subtype/probability and forbidden auto-save regression.
5. Four GitHub Actions jobs: exact verified parent, all original native full app regressions + new tests; actual q8 text-only model build (static no-photo artifact); genuine vision-ONLY model inference on 16 original SHA-verified public images using frozen embeddings; fail-closed exact baseline comparison and numeric-only research output. No model weights or actual source photos uploaded to artifacts.

## Release and scientific boundaries
- Model training, inference weights, color, instance segmentation, existing FashionCLIP runtime, owner cloud and app code are all unchanged. The 16 source photos are **developer-exposed**, not new independent blind labels. A successful 16-photo parity result would show same output after removing an unnecessary runtime component, NOT a new accuracy gain or a guaranteed mobile speed improvement.
- A signed model source/license review, independent ≥200-image new labeled real-photo benchmark (including non-garments), manual review, reliable non-clothing rejection, and physical Android/iOS phone memory/latency acceptance must precede any candidate advancement into the live closet.
- Safe family preview is still not deployed/approved and FAMILY ALPHA HOLD #255 remains OPEN.

**Do not call this milestone complete until exact final HEAD four-of-four CI jobs success on the same candidate.**
