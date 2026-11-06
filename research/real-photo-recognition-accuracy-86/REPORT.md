# Priority #86 — REAL-PHOTO-RECOGNITION-ACCURACY-86

**RESEARCH ONLY / Family Alpha Issue #255 HOLD / NO DEPLOY.** Starting commit: Priority #85 exact HEAD `b5167567d4a47e2ce720ccd3727647c037974b3a`, with successful exact-HEAD [Actions run #42137903494](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42137903494). The isolated branch starts directly at that commit.

## Source audit

- `public/local-worker.mjs` executes the immutable `ff13/fashion-clip@0f99955d944c39bfd9d035a02ac273c7a44a406b` vision model as q8 ONNX/WASM through Transformers.js 3.8.1. It scores a large prompt-vector catalog, reruns alternate image framings, applies fixed thresholds, asks an independent framing pass to corroborate, and may abstain. Scores are similarity scores, not calibrated probabilities. The code preserves uncertain outcomes and does not let model suggestions authorize a closet save.
- `public/outfit-worker.mjs` executes `Xenova/segformer_b0_clothes@a2489ea8e7ec1ee912190546bad31a4906ccca76` as fp32 ONNX/WASM. `public/outfit-segmentation.mjs` groups connected semantic label regions. The model labels clothing classes, not persistent garment identities. Overlapping or touching same-class items can merge, and separated objects do not establish an instance mask. The UI requires a person to inspect, crop/correct, categorize, color and confirm every record.
- The pinned converted SegFormer model repository declares no license. Its use remains a release blocker until license compatibility is independently confirmed. Exact model revisions, weight sizes and repository-published LFS identities are in `model-assets.json`.
- Priority #85's edge/center warning remains a conservative background-risk heuristic. It is neither learned classification nor segmentation. Color estimates are unverified suggestions and manual review remains required.

## Dataset and truth status

The inherited source collection is 59 unique SHA-pinned licensed JPEGs: 32 development, 11 validation and 16 locked-evaluation records, including three provisional non-garment controls. Those classifications are visually reviewed historical labels from one source, not two-person independent adjudications. There are no adjudicated primary or secondary color labels. There are no independently annotated instance masks for a representative held-out dataset. The inherited RECOG60 gate therefore remains **NEEDS REWORK** and must report zero independent human labels. Prior results 9/13 broad-category and 4/13 exact-subtype remain historical provisional counts, never current or independent model accuracy.

This priority adds no fabricated labels and does not retune thresholds against the locked subset. Its no-deploy workflow runs the real pinned models on genuine originals, preserves source hashes and partitions, records runtime failures and latency, evaluates the legacy labels only as exploratory provisional comparisons, and archives outputs without original photos. Model execution, software integration and scientific acceptance are distinct verdicts.

## Known gaps

1. At least 100 appropriately licensed images and independently adjudicated labels are not present. Two distinct reviewers plus a third-person disagreement adjudicator are required, all bound to original-photo SHA; no automated review or current single-review labels substitute.
2. No independent locked-evaluation primary/secondary color truth or instance-level detection/mask truth exists. Do not report color or segmentation accuracy percentages from pixel agreement, provisional labels or model confidence.
3. The only currently integrated classifier candidate is FashionCLIP. No alternate licensed model has been independently executed and compared here.
4. The local headless browser could not load the model JavaScript CDN in this environment (`ERR_EMPTY_RESPONSE` / proxy 502). The pinned model execution is therefore delegated to the dedicated GitHub Actions browser runner; this local environment failure is not represented as a model pass.
5. No physical Android or iPhone camera run was performed.

**Expected verdicts:** code and conservative human-review integration can pass engineering checks; scientific acceptance remains **NEEDS REWORK** until source-bound independent labels, untouched representative test data, licensing confirmation, and defined model metrics are satisfied. No model confidence threshold or green software suite clears Family Alpha HOLD.
