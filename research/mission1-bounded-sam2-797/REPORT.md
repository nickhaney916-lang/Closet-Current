# Closet Current Mission 1 — P797 bounded-memory original-photo SAM2 model research

**Family Alpha HOLD #255; DRAFT, UNMERGED, UNDEPLOYED.** Branch is stacked on exact independently verified P796 HEAD `64fdfb398ccfaf9966f0ac1fa64223d33fe9518a`; PR #795. This work reduces avoidable memory pressure for the actual ONNX/source-JPEG research runner and enables a chat-driven compact handoff. It does **not** increase ChatGPT's context/memory quota or unlock an exhausted Work-session workspace. Work stays in GitHub Actions, not an assistant background process.

## Root problem: unnecessary research runtime memory allocation

The genuine P796 SAM 2.1 Hiera-tiny ONNX benchmark ran actual 109.5 MB encoder + 20.7 MB decoder and publisher-original photographs. Before P797, `download_pinned()` buffered each entire checkpoint into a Python `bytes` object while writing its disk copy; `source_truth()` opened and decoded the same high-resolution source JPEG again for each of 23 garment instances. ONNX Runtime's CPU memory arena and pattern cache were left at defaults. None of these allocations improves mask quality. CI isn't evidence that the user Work workspace itself can support a different memory limit; P797 addresses **test runner memory efficiency**.

## Actual implemented bounded-memory corrections

- `research/mission1-bounded-sam2-797/bounded_source_io.py` streams HTTPS Hugging Face checkpoint downloads **1 MiB at a time** into an **atomic temporary file** with incremental SHA-256, a 175 MiB encoder cap and a 40 MiB decoder cap. Rejects unapproved redirects, wrong digests and content-length or streamed-size cap violations. A partially downloaded model is erased rather than accepted/cached. Existing cached files are checked by a streamed file hash, never read in full solely to verify the cached SHA.
- The exact pinned public model bytes, third-party conversion and Meta SAM 2.1 legal caution are unchanged. The original P796 binary evidence remains the comparison standard.
- Each exact SHA-verified real publisher **original JPEG is decoded once per photo**, and that same RGB array is passed to all its publisher garment mask/prompt evaluations. The encoder still runs once per photo, decoder once per garment, and all **23/23** original publisher polygon instances are scored with the same deterministic publisher-label-derived oracle points; no difficult garment, false positive or failed example is discarded.
- The ONNX CPU session is configured with `enable_mem_pattern=False` and `enable_cpu_mem_arena=False` to reduce retained allocator/pattern cache between photos. It explicitly discards the image feature tensors, decoded image reference and per-annotation logits between originals and calls `gc.collect()`.
- On each original it records measured **Linux process RSS and high-watermark RSS** in MB as numerical research evidence. Real source masks, weights, image bytes, raw model feature tensors and private owner data are **not** included in the artifact. The exact actual peak will be reported after the CI run, with no invented reduction percentage or device-memory claim.
- Targeted synthetic unit tests cover streaming small chunks, bound overrun before and after headers, corrupt existing weights, source SHA mismatch, model CDN redirect refusal, invalid hash, atomic cleanup and measured-RSS receipt. They are *not* proof of real trained model accuracy or independent human owner acceptance.

## Why a compact GitHub controller checkpoint matters

`research/mission1-controller/CURRENT.md` stores the latest independently tested baseline, current branch, actual negative and partial-positive model accuracy, mission blockers, release restrictions and resume instructions. A new or continued message from this **single ChatGPT conversation** can inspect this one tiny file and exact GitHub PR head without loading hours of earlier chat or exhausting a separate Work workspace. Checkpoints are in GitHub source control, not new secret memory settings. GitHub Actions performs bounded expensive inference as a separate job and erases source/weight bytes before attaching only numeric evidence. The controller does not merge unverified research PRs, change GitHub production or claim async work between turns.

## Verification and limits

Dedicated `.github/workflows/mission1-bounded-memory-sam2-797-no-deploy.yml` must prove an exact pinned P796 ancestor, only six research/test/report/checkpoint/workflow changes, full Node app/3D/cloud/recognition regressions, Python memory/stream source-math tests and a fresh actual 10-photo / 23-publisher-garment ONNX execution. It must verify each source original SHA, actual 23 mask receipt completeness and compare stable threshold-level results with P796 (15/23 source IoU>=0.50, 0.600273 mean) without filtering cases. It must report measured peak RSS as observed rather than guessing. No automatic garment detection, no native owner-click flow, no cloud backend or physical phone tests have been completed by this optimization.

**Entire Mission 1 is NOT 100%.** P792 frozen automatic segmentation matched only 8/23 real published garments with 15 missed and 17–20 false detections; P794 unseeded automatic candidates added 11/11 false extra masks. Prompted SAM2 P796 scored 15/23 publisher polygons with label-derived oracle points, but eight failed, no actual human click and no exact clothing color/subtype recognition. Still missing independent commercially cleared and training-disjoint new photos, two genuine independent blind human mask/type/color reviewers, acceptable trained model accuracy, physical Android Chrome/iPhone Safari signed two-owner private-cloud testing, and explicit owner approval. Family Alpha HOLD #255 remains.

## Exact head CI

Only report final verified exact-head GH Actions run ID, tests, model results and RSS after its completion. Prior results do not prove the new P797 memory configuration is identical until measured.
