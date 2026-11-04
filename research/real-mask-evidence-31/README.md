# REAL-SEGFORMER-PIXEL-MASK-31 — actual source-image model rerun, not a crop-box proxy

**Main controller, RESEARCH ONLY.** Source parent [PR #587](https://github.com/nickhaney916-lang/Closet-Current/pull/587) exact `7cd43be5e2cdb7be7473ab029a595d6b81e725ee`. Family Alpha Issue #255 remains OPEN/HOLD. No merges, deployments, staging/production changes, user media, authentication, cloud accounts, private wardrobe data, local gallery changes or other projects.

## What this priority resolves

PR #587 conservatively grouped two separated shoe suggestions and improved **a retrospective bounding-box union proxy** on previously analyzed photos from 10/35 annotations matched to 11/35, but the archived SegFormer artifact contained crop boxes rather than exact per-pixel model masks. The proxy could not establish whether the actual SegFormer logits produce consistent grouped masks, whether original class pixel membership is unchanged, or whether the behavior generalizes even across Chromium and WebKit. This independent source-locked model run closes the **first two evidence gaps** with the real pinned model and actual label pixels, and explicitly does *not* claim new-image generalization.

## Genuine original-photo evidence cohort

Three unchanged, licensed, already inspected original JPEGs from the PR #575 locked source manifest, verified **byte-for-byte SHA-256, bytes and dimensions before inference**:

- `commons-0021`: public-domain jeans/sneakers photo, 564×628, source SHA `04c0ca5bed1bee26e83be98b9a992619b0777811a7fb8a99fe955939334bbd8c`. The specific separated-footwear source.
- `two-shirts`: CC BY-SA 2.0 overlapping shirt photo, 3264×2448, source SHA `4608661009cc84c365cbbc8349ca119b214553daa6f76ecd9edab345f5859cc4`.
- `flatlay-outfit`: CC0 1.0 garment flat-lay photo, 4773×3182, source SHA `adb60164c269198e15276bc3a9d5e4fb970676fe00a46d38fd7ea755b27cf360`.

Original photos remain external source-locked research inputs and are never committed to Git, uploaded to user cloud or retained in GitHub Actions artifacts. License attribution is shown on every genuine browser diagnostic view.

## Actual model and before/after isolation

`research/real-mask-evidence-31/worker.mjs` invokes the **actual** Transformers.js 3.8.1 `Xenova/segformer_b0_clothes` model at pinned revision `a2489ea8e7ec1ee912190546bad31a4906ccca76` via WASM/ONNX in genuine Chrome and WebKit, on the bounded in-memory analysis JPEG. The full-resolution original remains unchanged for review/overlay. From the very same real output logits, it decodes the existing `clothingLabelMap`, then calls:

- `research/real-mask-evidence-31/legacy-visible-groups.mjs`: an exact copy of the pre-PR587 original grouping source from PR #586 (source Git blob `9cbf76a6b37441c60f554a012749782664964fbb`).
- `research/multi-garment-capture-01/visible-groups.mjs`: the **current source** implementing PR #587 shoe pairing.

For each grouped garment candidate it hashes the original exact selected-pixel model mask, records exact connected pixel counts, original-pixel normalized crop geometry and review-only status. It independently SHA-256 fingerprints the complete class label map, checks a per-class pixel union before=after and fails closed if even one accepted class pixel changes from grouping. It returns a base64-encoded **actual model label map only to the research browser**, displays the true pixel colors translucently over the same original for visual inspection, and verifies the model-mask SHA again in the browser. Raw label pixels and original JPEGs are not included in final shareable report JSON.

`scripts/verify-real-segformer-masks-31.mjs` runs genuine ONNX model inference **three times in each engine** (six actual model executions), retaining the model per engine for reduced memory/network overhead. It records real outputs on these same three previously analyzed photos, compares one-to-one same-category crop-box IoU against previously single-reviewer annotation boxes, saves actual before/after real-model proposal counts and 10 source-locked screenshots (3 widths for footwear + 390 for two shirts and flat-lay in each engine). Actual mask pixels are from the model, not synthetic reconstructions. The benchmark has **no independent second-human pixel-mask labels**, so it cannot produce validated pixel-level garment IoU or independently certify any true segmentation precision on unseen photos. It can reveal the observed actual-mask behavior and accurately constrain any PR #587 gain.

## Tests, artifacts, limits

`tests/real-segformer-mask-31.test.mjs` checks exact original/current mask pixel conservation for hand-constructed garment labels, true logits-to-masks parsing, no fabricated split for physically connected same-class shirts, unrelated shoe rejection, source JPEG identity and honest evaluation labels. The dedicated GitHub Actions workflow locks exact PR587 ancestry and allows only research source additions and one new no-deploy CI file. It builds the actual app, runs ALL inherited and new Node tests and then executes the real Chromium/WebKit model and screenshot SHA audits. A missing model/download, inconsistent source SHA, runtime failure or altered mask identity is a failing CI outcome—not a green badge. The resulting PR remains **draft, unmerged and un-deployed**.

**Scientifically unresolved:** True multi-garment automatic detection accuracy across genuinely new, blinded, independently human annotated sources (including overlapping shirts, pale garments, flat-lay scenes) remains NEEDS REWORK, as do category/color accuracy, true per-pixel mask human IoU, photographed-realistic clothing on 3D humanoids, hosted signed browser-to-cloud E2E and physical phones. A green technical research rerun never clears Family Alpha Issue #255 or its nine formal pilot gates.
