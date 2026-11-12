# Parallel #69 — isolated mobile recognition runtime changes (HOLD)

Tracking: [#920](https://github.com/nickhaney916-lang/Closet-Current/issues/920). Family Alpha HOLD: [#255](https://github.com/nickhaney916-lang/Closet-Current/issues/255).

## Baseline and scope

Pinned default-branch baseline: `8c3355350303399e9edc2e98beaf9de15d601282` (Nov 9, 2026). No app deployment, merge, private photographs, server credentials, hosted Supabase, or private accounts.

The current `local-worker.mjs` serializes work and retains its FashionCLIP session; `vector-scorer.mjs` already caches per-image embeddings within the job. Consequently a second image-response cache was not added (it would also require account/session/source-key isolation). The shipped SegFormer `outfit-worker.mjs` uses fp32 inference and materializes separate crop JPEGs after converting output logits to a compact label map.

## Changes

1. **Fail before expensive model download:** preflight recognizes only supported worker message types and bounded canonical JPEG data URIs; malformed, oversized (12,000,000 character limit), or unsupported messages fail prior to heavy model loading. Input budget is compatible with the existing outfit worker. The model's actual classification, threshold, labels and photo preprocessing are unchanged.
2. **Request-scoped progress and timings:** progress carries the request ID; response-only diagnostics contain measured `loadMs`, `decodeMs`, `inferenceMs` and `totalMs` where applicable. They contain no photo data, predictions, filenames, names, owner IDs, or source hashes. Timings are worker elapsed wall-clock samples, **not** proof of device speed or memory consumption.
3. **Early segmentation tensor disposal:** after a successful genuine segmentation, make the compact map, dispose the logits tensor and input pixel tensor if supported, then create crop JPEGs. Best-effort cleanup does not change the pixel map, grouping, cropping, color math, or review decisions. Exact memory savings are **unmeasured**.
4. **Reproducible comparison hooks:** browser photo benchmark exports measured worker timings and cold-loader time. `scripts/summarize-recognition-runtime.mjs` reports p50/p95 from real downloaded benchmark results and detects any prediction/review-field changes across identical image IDs; a mismatch fails closed with exit 2.

## Reproduction

```sh
node scripts/build.mjs
node --test tests/*.test.cjs tests/*.test.mjs
# With rights-cleared downloaded original photos and a browser with genuine model access:
node scripts/run-browser-photo-benchmark.mjs benchmark/manifest-reviewed-32.json benchmark/p69-before
cp benchmark/p69-before/results.json /tmp/p69-before.json
# Repeat on the candidate commit with the identical photo files/manifest/model revision:
node scripts/run-browser-photo-benchmark.mjs benchmark/manifest-reviewed-32.json benchmark/p69-after
node scripts/summarize-recognition-runtime.mjs /tmp/p69-before.json benchmark/p69-after/results.json
```

A complete paired run MUST share verified image SHA-256 digests, model revision, machine and browser runtime. Report cold-start separately from warm calls; p95 is nearest-rank. Do not interpret a small CI cohort as representative Android/iPhone hardware.

## Evidence and remaining mandatory gates

Tests exercise malformed input without model loading, numeric timings/ID-scoped progress, Tensor disposal before crop streaming, and retained safe partial crops on later errors. These tests have mocked inference and **do not demonstrate performance gain or real-image parity**.

Pending: paired baseline/optimized genuine model inference on legally verified matching photos; p50/p95, peak memory and crash counts on named platforms; load/cache/network interruption and 20–50 capture stress; Chromium and WebKit real browser evidence at 320/390/430; physical Android Chrome and iPhone Safari. Classification accuracy/thresholds were not altered, but exact model-output parity must still be demonstrated. The 10-second warm target is **NOT verified**. Do not claim mission completion until these gates are met.
