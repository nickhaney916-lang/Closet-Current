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

## Initial genuine browser evidence, not a matched performance A/B

An independent hosted push workflow at exact SHA `15c24cea8ed963de0dce053f6c870bebd5c885b4`, [Actions #43264435975](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43264435975), processed 32 reviewed + 16 holdout + 11 fresh legally locked originals in real Linux headless Chromium with zero runtime errors. Matching prior main SHA `8c3355350303399e9edc2e98beaf9de15d601282` [Actions #42658717637](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42658717637) yielded 0/59 changes in category, subtype, strength, review flag, reason, details and sleeve length. Both artifact ZIP SHA-256 digests validated (`438460556141786d9d6bb043dff3f33235cc9c6845dbf709c6901ba2f6959ab7` and `d4879ab15df8389ad5f4ee4c754fc500aaa77a410434155e6e2e4957c6e44a00`). Held-out accuracy deficits remain unchanged.

Candidate hosted Linux Chromium wall-clock worker samples:
- Reviewed32: worker inference p50 461 ms, p95 1145 ms; total worker p50 520, p95 1182 ms; cold worker load 3059 ms.
- Holdout16: inference p50 460, p95 902 ms; total worker p50 501, p95 1000 ms; cold load 2916 ms.
- Fresh11: inference p50 463, p95 1032 ms; total worker p50 502, p95 1093 ms; cold load 2977 ms.

Browser-level elapsed p50/p95 was 670/2587 ms (reviewed), 610/1356 (holdout), 594/1462 (fresh), versus 432/1691, 385/928, 372/856 on the prior main run. **These are separate hosted machines/dates, so the apparent slowdown is only an uncontrolled observation, NOT a justified before/after speed claim.** The new paired 11-photo A–B–B–A headless Chromium workflow compares the exact same baseline and candidate workers on one runner, sharing verified images/model version and app content, and fails on output parity differences. It is still desktop CI, NOT mobile device acceptance.

Software-level zero recognition-output changes is not proof of 10/10 garment accuracy. Pending genuinely paired browser results, memory peak instrumentation, Android/iPhone hardware stress.
