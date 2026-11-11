# Closet Current Mission 1 P827 — one-pass frozen B0 threshold sensitivity and stalled model diagnosis

**FAMILY ALPHA HOLD #255 — DRAFT / UNMERGED / UNDEPLOYED. MISSION 1 NOT COMPLETE.**

## Strict scope and parent

This is a five-path isolated research follow-on to P821 draft PR #852 exact HEAD `b57939f6acee91bde387cf9bdd87b4996efe1679`, **which is NOT verified**. P821's complete app Node regression/build job passed, but the real original-model job failed after an actual model timeout on BOTH the initial and one retried workflow attempt. The pinned model therefore supplied **no trustworthy complete ten-photo/five-threshold results**. This branch is independent from the main Mission 1 owner-safe native photo-to-closet P826 green research branch [PR #864](https://github.com/nickhaney916-lang/Closet-Current/pull/864). Do not merge either unreviewed stack.

P827 modifies only `research/mission1-real-source-threshold-profiles-821/profile-map.mjs`, `tests/mission1-source-threshold-profiles-821.test.mjs`, the existing research-only actual browser worker test harness, this report and an isolated no-deploy workflow. No changes to `public/`, model weights, default runtime clothing thresholds, owner photos, cloud auth, SUPABASE, staging, production or release.

## Observed blocker and engineering hypothesis

P817 genuinely ran original pinned SegFormer B0 in Chromium and WebKit against ten **already development-exposed publisher original photos**, with 23 publisher garment polygons. Native grouping matched **10/23** in Chromium and **9/23** in WebKit at >=0.5 instance IoU, with many false positives. Naive automatic component splitting made results worse. P821 attempted five fixed confidence/margin research gates (70/15 native, 65/12, 60/10, 55/08, 80/20) but called an independent full softmax map computation five times per source; repeated extra processing is one plausible contributor, not a proved explanation. The actual P821 failure says *model timeout* without reporting which worker phase was active, so the root cause could instead be pinned CDN asset retrieval, ONNX model initialization, WASM memory/CPU, on-device inference, an external environment problem or instrumentation. A timeout is NOT a low-score evaluation and must not produce substitute metrics.

## Research-only P827 algorithm

`clothingLabelMapsFused827` evaluates exact original fixed eighteen-class ONNX logits with a **single shared per-pixel, Float64 grouped softmax calculation**, retaining the native class 10 → 9 shoe merge, native body/person gate, original 18-class model raster, and exact five pre-registered thresholds. It allocates separate typed output masks and per-profile body counts, never promotes a class/category, never predicts subtype/color or auto-saves. The original `clothingLabelMapThreshold821` remains intact as an **independent reference**. Synthetic deterministic logit tests exercise close ties, class merging, multiple raster shapes, high and low gates; P827 outputs must match all FIVE reference masks, typed confidences and personDetected flags byte-for-byte, and the first profile must match native `clothingLabelMap` exactly.

Actual real-model harness now uses the fused maps from the SAME unchanged logits. This branch also relays bounded, numeric/public-source-only worker progress (loading, inference start, inference returned, threshold map start/end). If a model still times out, the error records the last observed stage, not a guessed score. No original JPEG data is recorded in progress traces; CI still excludes photos and screenshot artifacts and uploads only source/metrics receipts.

## Acceptance and containment

The P827 no-deploy workflow uses the precise unverified P821 parent and a five-file diff allowlist, unchanged source SHA and exposure quarantine checks, app build/full Node regression, and a full pinned frozen SegFormer B0 attempt on **all ten original publisher JPEGs and 23 polygons in Chromium and WebKit**. It rejects incomplete source lists, missing profile maps, changed native label maps, impossible counts or any unauthorized release. Only if the exact final P827 commit receives success for both jobs and the original publisher source scoring can the five **development-set** profile scores be reported. A CI timeout is an honest unresolved infrastructure/performance blocker, not "no improvement."

The source material is NOT an independently rights-cleared blinded human held-out benchmark. The next true Mission 1 accuracy gate remains acquiring legally usable original photographs with an appropriately documented source license and a genuinely prospective disjoint test set, two distinct blinded human annotators with adjudication, predeclared category/type/color/instance/boundary metrics, measured physical iPhone Safari and Android Chrome inference/memory, and hosted signed owner-private cloud review. The original Family Alpha HOLD #255 stays OPEN, no merges/deployments.

**MISSION 1 NOT COMPLETE — independent original-photo model performance still unknown for P821/P827 until exact-head actual-model CI successfully finishes.**


## P827 first exact-head diagnostic outcome and follow-up repair

The first P827 workflow [Actions #43076048939](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43076048939) was **NOT green**: the exact-parent build and 1,696 Node tests passed (one optional skip), but the Chromium original-photo model job timed out after 390 seconds on its first source, reporting `last stage=no-worker-progress`—**not even the worker's pre-network loading event**. Thus the original browser worker may have failed to load/parse before entering its message handler, and the five-threshold fused computation may never have executed; there are NO new real-source scores. This is not evidence of poor score or a successful fused performance gain.

P827 now validates the exact dynamically generated instrumented worker source with Node `vm.Script` before any browser starts; it fails immediately with a `M1_P827_WORKER_BOOTSTRAP_SYNTAX` receipt instead of waiting 390 seconds if malformed. The actual browser also catches `Worker.onerror`, `Worker.onmessageerror`, and page errors with bounded no-original-byte diagnostics. Only genuine returning original model results can be scored. These bootstrap diagnostics do not weaken original SHA, model version, mask verification, dataset quarantine or no-release constraints.

**Exact final commit after this change requires new CI. The earlier 1/2 job P827 failure is not overridden by Node green status.**
