# Parallel #67 — a working external recognition reference

**FAMILY ALPHA HOLD #255. Draft research only; no merge, deployment, account activation or private family photos. Mission remains incomplete.**

## Outcome

The published Grounded SAM 2 architecture supplies a concrete, independently inspectable direction for garment separation. On a fixed eight-image Fashionpedia validation subset with **38 original human garment-instance polygons**, the port's detection + generated-caption grounding + SAM2 masks matched **26/38 instances at original-resolution mask IoU >=0.5**, versus **11/38 for the unchanged native SegFormer pipeline**. Instance recall increased **28.9% -> 68.4%**, while precision increased **55.0% -> 86.7%**. This is a genuine reference-cohort separation improvement, not a subtype-classification or production-readiness claim.

| Method | Matched / human instances | Predicted masks | Recall | Precision |
|---|---:|---:|---:|---:|
| Native SegFormer, original grouping | 11/38 | 20 | 28.9% | 55.0% |
| Published OD-to-SAM pattern port | 22/38 | 25 | 57.9% | 88.0% |
| OD plus caption-grounding extension | 26/38 | 30 | 68.4% | 86.7% |

Both class-agnostic and broad-category-compatible matching gave the same counts on this subset. Compatibility allows the original native upper-garment hint to mean either Tops or Outerwear; it must not be described as precise category accuracy. Each shoe annotation remains a separate instance. Maximum-cardinality bipartite matching prevents one combined mask from claiming two shoes. Predicted SAM IoU scores are never used as measured annotation IoU or to select the mask best fitting ground truth.

| Broad category | Native matched / total | Extended reference matched / total |
|---|---:|---:|
| Shoes | 0/14 | 10/14 |
| Dresses | 2/3 | 3/3 |
| Bottoms | 4/5 | 5/5 |
| Tops | 1/4 | 2/4 |
| Outerwear | 2/2 | 2/2 |
| Accessories | 2/10 | 4/10 |

All eight images contribute to the aggregate. The visual sheet automatically selects the strongest and weakest per-photo recall changes; the inspector includes all eight. Human annotations, original photos, native masks and reference masks are separately displayed. The reference still misses 12 instances and produces four unmatched masks.

## What was reproduced

Upstream: [Grounded-SAM-2](https://github.com/IDEA-Research/Grounded-SAM-2/tree/b7a9c29f196edff0eb54dbe14588d7ae5e3dde28), specifically the image object-detection-to-segmentation and generated-caption-to-grounding examples. Exact file hashes, source links, model revisions, license evidence and actual graph/data SHA receipts are in `reference-sources.json`, `REFERENCES.md` and `results/verified-model-bytes.json`.

This is an **architecture-pattern port**, not an exact reproduction of the upstream large/GPU model configuration: the port uses Florence-2-base-ft and SAM2.1-tiny q8 ONNX with Transformers.js 3.8.1 on CPU. The published example uses larger models and CUDA. No published benchmark number was transferred to this app.

The primary measured extension first runs Florence object detection, generates a detailed caption, grounds that generated text, retains garment descriptions, suppresses same-category near-duplicate boxes at fixed box IoU >=.85, and obtains an actual SAM2 mask per region. Contradictory category regions remain visible. Specific types are proposed only when the generated description explicitly supplies one; a generic shirt or boot remains Unknown. **Every result requires review and has `automaticSave:false`.** The native public application, cloud, original-photo and wardrobe persistence files are unchanged.

The OD-only subset uses the same OD boxes/masks without additional caption-only detections; it is reported separately. Its recorded timing includes the extension's caption work, so it is not a standalone OD-only speed benchmark.

## Independent evidence and licensing

The fixed manifest SHA is `cfb7734271c0b14a95e0a826a33230eb05b67867999bf0d500763a64a19874d8`. Human polygons come unchanged from official Fashionpedia val2020. All eight photographs have matching official and current primary Flickr CC BY 2.0 receipts with named creators. Annotation/ontology permission is separately CC BY 4.0. JPEG bytes are unmodified official dataset bytes; they are not claimed to be full-resolution camera originals. See `fashionpedia/README.md` for attribution, source recovery and exclusions.

These are **public validation references, not sealed novel acceptance**. Pretraining overlap is unknown; eight permission-screened fashion photographs are not representative phone captures. Some Fashionpedia classes combine shirt/blouse or top/T-shirt/sweatshirt. It provides no fine sneaker/boot or primary-color truth. Consequently no subtype/color accuracy, population success, 95%/90% target attainment or Family Alpha release claim is made.

## Failure and runtime evidence

- Historical development diagnostics: Florence OD identified the two previously missed dresses and two separate sneakers. Caption grounding located a shirt region in the mannequin image, but did not establish T-shirt subtype. The difficult blouse produced **no garment region**; its generated caption was substantially wrong. Dress descriptions also conflicted with generic shirt descriptions. These failures remain in `results/reference-diagnostic.json` and `results/florence-diagnostic.json`.
- A list-style open-vocabulary prompt echoed the supplied label list and sometimes returned unsupported polygon output. It is retained as a rejected diagnostic and is **not** used by the measured pipeline. The working pipeline grounds its actual generated caption, as in the upstream example.
- The SAM2 export fixes its prompt group to one. Actual multi-box inference initially failed; the helper now encodes the image once and decodes each box separately with shared embeddings. One- and two-box actual smoke receipts are preserved. The selected mask maximizes the model's own three predicted-IoU outputs before upsampling, without ground-truth access.
- Concurrent full pipelines exceeded available memory and one process exited 137 after the first reference image. Checkpoint recovery, serialized execution, explicit tensor disposal and optional host garbage collection completed the cohort. This is not continuous-session or phone-memory acceptance.
- CPU median latency was **1.02 s native vs 17.93 s reference**; reference p95 **24.20 s**. The reference CPU process peak resident memory was **3,639,025,664 bytes**, versus **612,655,104 bytes** for native. These are shared-host process measurements, not phone/browser/GPU measurements. Cached stage recovery and warm model files mean these figures are not cold-start product latency. Mobile execution/backend placement remains unresolved.
- Masked pixel color is shown only as an unverified proposal. It does not echo a caption color and is not counted as independent color accuracy.

## Validation and reproduction

Local app build and all **289 native Node tests** passed, plus three region/parser safety tests and five one-to-one matching tests. Eight actual downloaded graph/data files match pinned publisher SHA-256 and byte receipts. The dedicated read-only workflow clears committed numeric results and grounding caches, recovers original dataset JPEGs, runs genuine baseline/reference inference and recalculates mask IoU; its artifacts contain numeric evidence only. Green execution does not assert the accuracy targets passed.

```sh
npm install --no-save --no-package-lock @huggingface/transformers@3.8.1 sharp@0.34.3
python -m pip install numpy==2.3.5 pycocotools==2.0.10 Pillow
python research/parallel67-reference/fashionpedia/download_reference.py
node --test research/parallel67-reference/regions.test.mjs
python research/parallel67-reference/matching.test.py
node scripts/parallel67-reference-baseline.mjs
node --expose-gc scripts/parallel67-reference-run.mjs fashionpedia
python scripts/parallel67-reference-verify-models.py
python scripts/parallel67-reference-evaluate.py
python scripts/parallel67-reference-visuals.py
```

## Integration decision

**Accept this as a promising separation research baseline; reject product promotion.** It substantially improves real instance-mask results over the original grouping on the human reference subset. It does not solve fine garment recognition, representative blind acceptance, mobile performance or privacy-reviewed hosted inference. Main controller retains integration authority. The next engineering work should use the independently detected garment regions to evaluate category/subtype recognition on original garment crops, while keeping a separate genuinely new human acceptance set and retaining the simple manual-review path.
