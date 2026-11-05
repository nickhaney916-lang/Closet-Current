# AUTO-SEGMENTATION-REAL-MODEL-53 — SegFormer real-model evidence

**Research only.** Branch starts from Priority #52 commit `05107691cee5bbf7429b824aa0b1444fcb70ae5b` (draft PR #610). Family Alpha Issue #255 remains HOLD. No production or staging access, deployment, merge, account login, cloud write, or personal photograph was used.

## What was tested

The existing Closet Current `outfit-worker.mjs` loads `Xenova/segformer_b0_clothes` at pinned revision `a2489ea8e7ec1ee912190546bad31a4906ccca76` using Transformers.js 3.8.1 and ONNX/WASM. Its model config declares `SegformerForSemanticSegmentation` and maps broad labels such as upper clothes, pants, dresses, and shoes ([pinned model family](https://huggingface.co/Xenova/segformer_b0_clothes)). Its output is **semantic clothing-class segmentation**, not learned per-garment instance segmentation. Instance segmentation instead produces separate masks for individual objects, including overlapping instances ([Hugging Face task definition](https://huggingface.co/docs/transformers/tasks/instance_segmentation)). The garment grouping code finds connected components within class masks, with a conservative same-family shoe grouping rule. Separated, disconnected same-class pieces can become separate proposals; two touching pieces assigned the same semantic class remain one uncertain proposal. No compatible instance model was added or used.

The research browser fetches only pinned model/library resources through the existing explicit relay. The relay was needed because this local browser sandbox cannot access those assets directly. It does not weaken the application network policy. Model output, labels, and source pixels stay in the browser; this benchmark never invokes the closet, storage, account, backup, or restore APIs.

The run uses the 15 fixture images shared by the frozen single-reviewer photo annotations and `benchmark/locked-photo-sources.json`. Each **downsampled fixture derivative** is verified against its own SHA-256, dimensions, and license attribution before model execution. The higher-resolution JPEG referenced by the annotation file was not the inference input. The historical `development` and `held-out` tags are reported, but they are not a newly blinded or guaranteed locked evaluation split: several source photos have appeared in earlier research. There is no separate validation set, independent adjudicator, per-pixel mask ground truth, negative-control cohort, subtype/color truth, or confusion adjudication.

## Local Chromium result

On the exact SHA-locked fixtures, the real pinned model completed 15 ONNX inferences over 24 annotated garment boxes. Old and new proposals were matched one-to-one by semantic family at bounding-box IoU ≥ 0.50. This is only a box-detection proxy; it is not mask IoU or instance accuracy.

| Grouping | Proposals | Correct matches | Unmatched proposals | Missed garments | Precision | Recall |
|---|---:|---:|---:|---:|---:|---:|
| Before shoe grouping | 46 | 9 | 37 | 15 | 19.6% | 37.5% |
| Current shoe grouping | 45 | 10 | 35 | 14 | 22.2% | 41.7% |

The changed shoe rule improves this small historical cohort by one match and preserves every source class-mask pixel, but the result is still far below the requested accuracy. False proposals and missed clothes remain common. Some photos receive multiple boxes for a single annotated object; most annotated objects in this cohort were missed by the conservative proposal path.

In the local Chromium run, the cold load took **18.0 s**; per-image inference ranged from **832 ms to 1,404 ms** (median **888 ms**). Six pinned JS/model requests totaled **37,730,517 bytes**. Chromium's `performance.memory.usedJSHeapSize` returned exactly **10,000,000 bytes** before and after every image, so it did not provide useful model-memory attribution. No WASM/native process or physical device memory reading was available. The WebKit/browser CI run is required before reporting its corresponding numbers.

## Classification and application integration

This priority does not report category, subtype, or color accuracy: SegFormer semantic labels and one-reviewer coarse boxes cannot establish those results. FashionCLIP remains the existing separate classifier. The full source-to-closet flow, private persistence, backup/restore, duplicate rejection, and account separation were **not exercised in the diagnostic browser harness**. The inherited 622 Node tests cover app safeguards, but do not substitute for that end-to-end acceptance. Model failures leave the original photo/manual review controls intact in the current app code; actual browser failure-recovery was not re-exercised here.

The 90 planned screenshots (Chromium and WebKit, 15 inputs × 320/390/430 CSS px) show the diagnostic overlay, not the complete Closet Current app, and are browser viewport emulation rather than physical phones. SHA-256 and image dimensions are audited in CI. Selected visual samples are reviewed manually; screenshot integrity does not establish detection correctness.

## Verdict and release blockers

- **Engineering verdict: NEEDS REWORK.** Source-level tests pass, but the requested full application browser journey, browser model-failure recovery, WebKit measurements, account isolation, backup/restore, and physical-device performance were not verified in this assignment run.
- **Scientific verdict: NEEDS REWORK.** The measured 22.2% precision and 41.7% recall do not meet targets; instance separation, true mask IoU, subtype/color accuracy, and an independently adjudicated locked set remain unmeasured.
- Keep every candidate region review-only. Do not treat these semantic masks as verified garment identity or 3D readiness.
- Highest-value next step: evaluate an actual compatible instance-segmentation model against a newly collected and independently adjudicated garment dataset, while retaining manual crop fallback and the existing private-save guards.
