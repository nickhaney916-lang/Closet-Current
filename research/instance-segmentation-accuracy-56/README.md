# Instance segmentation accuracy 56 — research only

## Scope and decision

This branch starts at the verified Priority #55 safety commit `77af898d0cf67f963d13f487da1ecfe2e96fe035`. It evaluates one materially different approach from SegFormer: an exported fashion-specific YOLO instance segmentation model with per-instance boxes, mask coefficients, and mask prototypes. The candidate executed genuine ONNX inference on CPU for 15 existing licensed benchmark photos. This is a pilot, not an independent acceptance benchmark.

**Verdict: ENGINEERING NEEDS REWORK; SCIENTIFIC NEEDS REWORK.** The model's pilot box precision was higher than the prior SegFormer run, but recall was lower, all masks lack independent pixel ground truth, candidate provenance and license metadata conflict, and the model is not integrated into Closet Current or tested in Chromium/WebKit. No automatic result is accepted or saved by this work.

## Candidate model and provenance

- Hugging Face model: [`HasanKabir23/Yolov26s-DeepFashion2`](https://huggingface.co/HasanKabir23/Yolov26s-DeepFashion2)
- Immutable repository revision: `670bd8b4a9a94c687c85df0b1376497c40a3759b`
- Asset: `best.onnx`, 10,994,299 bytes, SHA-256 `485bc106721febbd82fe24297e12a9fb49a435a552afff1e6b76308716555f76`
- Actual ONNX input: `images`, float32 `[1,3,416,416]`
- Actual outputs: `output0` float32 `[1,300,38]`; `output1` float32 `[1,32,104,104]`
- The 38 output values decode as box, confidence, class, and 32 mask coefficients. The prototype tensor produced non-empty, per-proposal masks during real inference.
- Classes cover 13 DeepFashion2 categories: top/outwear/vest/sling, shorts/trousers/skirt, and four dress types. Shoes, bags, and accessories have no class.
- The model card claims YOLO26s-seg, Apache-2.0, 416 input, and DeepFashion2 training. The exported ONNX metadata instead reports **YOLO26n-seg** and **AGPL-3.0**. This discrepancy is unresolved. The model card's reported mAP/precision/recall are unverified claims and were not used as results.
- DeepFashion2's official maintainers state the dataset is limited to non-commercial research and that a commercial license is not available. Consequently, neither model nor weights have cleared Closet Current's product-use licensing review.
- Model weights are not copied into this repository. The evaluator fetches only the immutable SHA-pinned ONNX artifact to `/tmp` and verifies its SHA-256 before use.

The detected architecture is true instance segmentation (each detection has separate mask coefficients against shared prototypes); it differs from the semantic SegFormer plus connected-components grouping previously measured. Model-provided confidence is not calibrated garment accuracy.

## Pilot method and measured results

Run `python research/instance-segmentation-accuracy-56/evaluate_yolo26_candidate.py` with Python packages `onnxruntime`, `onnx`, `numpy`, and `Pillow`. The runner loads the frozen photo annotations from Priority #28 and the 15 corresponding existing `benchmark/fixtures` JPEGs. It records the actual fixture SHA-256 and the source-photo SHA associated with each annotation. It preserves historical split tags, uses the model's 416-square input with letterbox padding, and accepts proposals at the model-card-recommended confidence threshold of 0.50. No confidence threshold was tuned on these images; the ONNX model emits its own end-to-end detections and no second NMS pass is applied.

One-to-one matching is greedy by confidence and requires category-family agreement and normalized bounding-box IoU >= 0.50. Existing annotations provide 24 coarse garment boxes. They were labeled once in earlier research, were not independently adjudicated or blinded for this candidate, and some model input fixtures are resized JPEG derivatives. The dataset is not a locked test set. Shoes remain in the ground-truth count despite the model having no shoe class, because absent category coverage is a real product failure.

| Metric | Pilot result |
|---|---:|
| Photos / labeled boxes | 15 / 24 |
| Proposals / true positives | 28 / 9 |
| False positives / false negatives | 19 / 15 |
| Precision / recall / F1 | 32.1% / 37.5% / 34.6% |
| Mean matched box IoU | 0.893 (9 matches only) |
| Pixel-mask IoU | Not measured; no pixel-mask ground truth |
| Category / subtype / color accuracy | Not measured; labels do not support independent adjudication |
| Same-class instance separation | Not measured; no qualifying independently labeled same-class pair in this cohort |
| Host CPU session creation / mean warm inference | 107 ms / 30 ms; model download is excluded and these are not mobile timings |
| Chromium WASM cold model load / warm inference | 1,060 ms / 369, 201, 206 ms over three photos |
| WebKit WASM | Not locally run; WebKit's Linux system libraries are unavailable in this workspace |

The previous SegFormer cohort reported 10/45 matches, 35 false proposals and 14 missed boxes: 22.2% precision and 41.7% recall. This pilot has fewer proposals and higher precision, with one fewer true positive, one additional miss, and lower recall. These comparisons are descriptive only because both runs use the same weak historical annotation cohort and neither establishes learned-mask accuracy.

An actual Chromium run used ONNX Runtime Web's WASM provider on three SHA-recorded fixture JPEGs at 320, 390, and 430 CSS pixels. It loaded the model in about 1.06 seconds, produced 5, 6, and 1 proposals, and captured three dimension/hash-audited screenshots. Two of 12 proposals had empty decoded masks. This is model-harness evidence, not app-flow or mobile-device acceptance. The local browser environment could not launch WebKit because required GTK/GStreamer libraries are missing; the dedicated hosted workflow is configured to run both engines in the pinned Playwright container.

`pilot-report.json` contains per-photo input hashes, proposal classes/confidences/boxes, per-instance binary mask fingerprints, match details, timing, and limitations. It does not include original source photos or model weights.

## Model selection findings

| Candidate | Instance behavior | Browser/mobile fit | Main blocker |
|---|---|---|---|
| SegFormer B0 clothes from prior #35 | Semantic labels; component grouping cannot reliably separate touching same-class garments | Existing Transformers.js/WASM execution | Prior pilot: 22.2% precision, 41.7% recall; no actual instance output |
| Fashion YOLO26 DeepFashion2 ONNX evaluated here | Actual per-instance box and prototype mask output; 13 garment classes | 11 MB ONNX is technically plausible for ONNX Runtime Web, but not yet run in browser/device | 32.1% / 37.5% pilot box P/R; no shoes/accessories; weak labels; metadata/license conflict; DeepFashion2 non-commercial terms |
| Official Fashionpedia Attribute Mask R-CNN | Fashion-specific per-instance masks, 27 top-level apparel categories and localized attributes | Detectron2/PyTorch baseline; no browser-ready pinned export verified in this assignment | Need verify a distributable pretrained checkpoint and export path; dataset images and model checkpoint rights must be checked separately |
| Generic COCO YOLO segmentation / SAM2 | Generic objects or prompted masks, not reliable garment-instance discovery/classification | Export paths exist, but SAM2 is much heavier | Fashion coverage/discovery is unproven; SAM2 does not tell which proposals are garments |

Fashionpedia is the most promising next data/model direction because its official project supplies instance segmentation annotations and an Attribute Mask R-CNN baseline, and its annotations/ontology have a CC BY 4.0 license. This does not automatically license source images or an unverified checkpoint. Obtain and review checkpoint, dataset-image, and export/runtime rights before product integration.

## Application and safety status

- Existing Priority #55 safety baseline remains the parent. Its explicit crop review and category/type/color confirmation guards were not changed.
- This pilot does not feed predictions to the native review UI, save closet items, or alter persistence, owner isolation, atomic save, duplicate rejection, backup/restore, or Outfit Builder.
- No private/customer photos, account credentials, production systems, or staging were accessed.
- Chromium/WebKit model-load, 320/390/430 browser, app-flow, account isolation, backup/restore, and physical-device checks were not completed. No screenshot evidence of this candidate is claimed.
- Family Alpha remains HOLD (Issue #255). No merge or deployment.

## Files

- `evaluate_yolo26_candidate.py` — deterministic pinned-artifact CPU pilot runner.
- `pilot-report.json` — actual per-image pilot metrics and instance-mask fingerprints.
- `../../benchmark/instance-segmentation-accuracy-56/browser-report.json` — actual Chromium WASM inference details and screenshots; hosted workflow adds WebKit if successful.
- `../../benchmark/instance-segmentation-accuracy-56/*.png` — actual 320/390/430 CSS width Chromium screenshots.
- `README.md` — candidate decision, method, licensing, limitations, and next steps.

## Next step for the main controller

Keep this branch and model out of production. The next research priority should establish a license-clean Fashionpedia checkpoint with exact source and weights provenance, then collect a new 100+ photo test set with two independent box-and-mask annotators, including same-class pairs, overlaps, negative controls, shoes, and garments worn by people. Freeze labels before threshold or post-processing changes. Only if the model passes instance-level and mask benchmarks should a separate change integrate it behind the existing explicit human-review/save guards and execute the full two-account private closet flow in Chromium, WebKit, and physical mobile browsers.
