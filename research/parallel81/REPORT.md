# Parallel #81 — source-bound cross-model arbitration

**Family Alpha HOLD #255 OPEN. DRAFT / UNMERGED / UNDEPLOYED. Release recommendation: NO GO.**

Pinned Mission 1 parent: `bb7dfc69c6d11ef0daaa2c72a8ca90ab2cf78c34`, PR #1019. This branch changes neither the camera/app, native worker, recognition engine, existing model assets, storage, account logic nor any sibling branch. Exact final HEAD and observed CI status belong in the draft PR receipt; this report does not invent a self-referential commit hash.

## Implemented recognition integration

`public/model-arbitration-81.mjs` adapts complete 47-label outputs from the existing FashionCLIP and the independently trained FashionSigLIP encoders. A versioned instance schema binds source/input JPEG SHA, owner session, photo/crop/mask/unit revisions and instance ID. Registered model revision, source-code hash, text-vector hash and latency accompany each observation. Missing labels, invalid scores, swapped sources, stale sessions, changed revisions and mixed-photo/owner instance batches are rejected. External observations are declarations, not authenticated proof of inference; independent scorer custody remains necessary for promotion.

The arbiter counts **model families**, not views. Repeating FashionCLIP cannot manufacture independent support. Within-family disagreements also veto agreement. It combines reciprocal ordinal ranks to display competing alternatives without averaging incompatible softmax and cosine scores. Agreement supplies a tentative broad-category hypothesis only; machine subtype is always Unknown, color Unknown, and footwear association remains owner review. Model disagreement, nonclothing evidence, ties, missing independent evidence or quality flags abstain. No approval capability, save, learning label, merge, duplicate bypass or pair certification is created. No weights are trained and no thresholds are tuned on these sources.

The 0..N instance adapter requires each supplied region's own pixel binding. Whole-frame observations cannot be reused for a different shoe or garment instance. It does not invent masks or convert connected semantic regions into physical items. The existing #68 detector, #70 pair reconciliation, #76 color and #77 duplicate workflow retain ownership. This is an executable research integration, not a live camera rollout.

## Actual inference and before/after diagnostic

`node scripts/p81-real-model-comparison.mjs` ran both genuine q8 ONNX vision encoders on **48 SHA-verified public original JPEGs** (32 historical reviewed development photos + 16 development-exposed diagnostic photos). It reconstructs the native worker's whole/center, skirt/coat, original recovery scorer callbacks and P766 subtype-review rule for the baseline. Node decodes grayscale originals into RGB before applying the unchanged photo preprocessing. Original file SHA is checked before and after inference. The source index retains per-photo publisher attribution and licenses; images are never committed or uploaded. Full numeric output is a CI artifact, and the compact local receipt is `development-results.json`.

Model pins:

| Encoder | Exact revision | Vision q8 SHA-256 |
|---|---|---|
| ff13/fashion-clip | 0f99955d944c39bfd9d035a02ac273c7a44a406b | c6d61df38ae56329347400dc42a285a4233d0c681744fb37f52129b5fe248952 |
| Marqo/marqo-fashionSigLIP | 782eaf7a0b95411ac96893d2300d1a61a2bcb757 | f1009cfce0eedd409f601e8351eedab72e8529641105eee6517821a9a634a2f4 |

Publisher model cards identify MIT and Apache-2.0 respectively: https://huggingface.co/ff13/fashion-clip and https://huggingface.co/Marqo/marqo-fashionSigLIP. The split text/vision SigLIP API follows the publisher example and #67's demonstrated implementation. Text encoding is performed locally once; its exact normalized-vector hash is recorded. Existing FashionCLIP text vectors remain unchanged and are SHA verified. This comparison uses native FashionCLIP framing and SigLIP's original-image processor; it is a **pipeline comparison**, not a weights-only causal experiment or measured phone performance.

| Development-only metric | 32 photos | 16 photos | Total |
|---|---:|---:|---:|
| FashionCLIP raw first rank exact historical subtype string | 21 | 5 | 26/48 |
| FashionSigLIP raw first rank exact historical subtype string | 22 | 5 | 27/48 |
| Fused first displayed hint exact historical subtype string | 22 | 7 | 29/48 |
| Cross-family hypothesis status | 29 | 6 | 35/48 |
| Native baseline strong results after existing review guard | 19 | 3 | 22/48 |

These are **different metrics**, not interchangeable acceptance rates. Fused first-hint exact matches increased by three against FashionCLIP's raw first rank on this exposed cohort. That is an exploratory ranking improvement, **not independently verified recognition accuracy or fewer wrong saves**. Historical generic Dress/Boots labels cannot establish fine dress/boot correctness, and are not relabeled to manufacture matches. Broad-category raw matches were FashionCLIP 43/48, SigLIP 42/48. Both stages retain all 48 results; the arbiter abstains on 13. Actual wardrobe admissions: zero in this research path.

FashionSigLIP gains vs FashionCLIP: `commons-0035` (Shorts), `commons-0003` (T-shirt), `commons-0036` (Skirt), `commons-0062` (Jacket). Losses: `commons-0040` (Skirt), `commons-0046` and `commons-0090` (negative examples). All three negative photos cause cross-model abstention. This explicitly rejects replacing the native model on the strength of garment-only gains.

The five known legacy boot cases `commons-0088/0089/0092/0093/0094` reproduced **baseline subtype Unknown**. Both raw models suggest Ankle boots, and the fused hint exposes that alternative; final machine subtype remains Unknown. The fifth case is category/type review rather than the same reason as the other four. This does **not** repair or waive the legacy subtype gate. Human visual confirmation is still required. Both models continue to agree on some wrong/confusing garment ranks (including blouse/tunic); agreement alone is not truth.

Local observed total model stage elapsed 17.311 s for 48 photos with cached downloads; FashionCLIP load 654 ms, SigLIP load 3010 ms. Per-photo latencies are in the receipt. CPU samples include baseline engine detail/recovery calls for FashionCLIP and one SigLIP image encoding, so they are not comparable per-encoder speed claims. Initial failed model fetch and grayscale decoder mismatch were corrected before the complete reported run. Partial attempts were not counted.

## Coordination and research reviewed

- #67 / #892: independent model reports and open research branches, including split fashion SigLIP #896 and precomputed-vector work; supervised challenger #905 was worse (9/13 category, 6/13 subtype vs 12/13 and 8/13) and was rejected. Current #67 report on #68's inherited tree also documents framing-dependent results, negative failure, boot/heels and dress/tunic errors. No training or donor branch edits.
- #68 / #909: instance/color branch `a8d90ae54fe312a08bb175555143c05f32cf9ee3`, semantic-component outputs and acceptance guards. Multiple disconnected garment regions are not independently confirmed physical items; no unapproved masks/colors are promoted here. Numeric files alone are not accepted as new human truth.
- #69 / #920: runtime report and branch read. Retained model sessions, request-scoped diagnostics and tensor disposal belong there. This integration does not alter worker internals or claim physical performance.
- #70 / #925: existing P840/P846 component/pair admission interface and browser scenarios retained; no pair merge.
- #71 / #929: independent evidence report and sealed evaluation ownership respected. No new blind truth supplied.
- #72 / #934: owner-learning source bindings retained; no model agreement becomes learning consent.
- #73 / #940: photo-quality uncertainty can veto an arbitration proposal; no new blur/mask detector.
- #74 / #945: review queue brief read; no blanket approval or storage flow changes.
- #75 / #950 and #79 / #979: provenance/quarantine and human annotation contracts retained. Zero new independently human-reviewed sources accessed.
- #76 / #954 and #77 / #959: mask-aware color and duplicate protections retained, no automatic color or garment identity assignment.
- #78 / #970: desktop emulation is not physical hardware acceptance.
- #80 / #983, #990/#1016 and Mission 1 #1019: full-score evidence, owner-confirmation capabilities and risky subtype guard retained. No subtype evidence ownership or blind scorer duplicated.

## Verification and reproduction

```sh
npm install --no-save --no-package-lock @huggingface/transformers@3.8.1 playwright@1.56.1 sharp@0.34.3 fake-indexeddb@6.2.4 three@0.180.0 three-mesh-bvh@0.9.2 axe-core@4.10.3
npx playwright install --with-deps chromium webkit
node scripts/build.mjs
node scripts/build-m1-no-account-trial-831.mjs
P79_REQUIRE_DECODER=1 node --test --test-concurrency=1 tests/*.cjs tests/*.mjs
node scripts/test-p81-arbitration-browser.mjs
node scripts/test-parallel80-subtype-browser.mjs
# Recover the union of the frozen 32+16 IDs from locked-photo-sources.json with:
# node scripts/download-reviewed-photos.mjs benchmark/locked-photo-sources.json benchmark/photos <comma-separated IDs>
node scripts/p81-real-model-comparison.mjs
```

The dedicated workflow enforces exact parent ancestry and a research-path allowlist, runs native/build, real desktop Chromium/WebKit policy scenarios, inherited owner/pair/duplicate browser scenarios and actual CPU models. Numeric output only is uploaded; no JPEGs, weights, private sources, blind labels or account data. Local verification: **570/570 native tests**, both builds, **6/6** arbitration browser cases, **6/6** inherited subtype editor cases, **6/6** pair admission cases and **6/6** cross-capture duplicate editor cases passed under actual desktop Chromium/WebKit at 320/390/430 CSS widths. The duplicate browser fixture initially failed while loading an external Google Fonts import; its injected test CSS now omits external imports, matching the existing offline subtype harness. Shipped CSS is unchanged. Local WebKit required extracted Debian runtime libraries and an adjusted local browser launcher library search path; CI uses Playwright's normal dependency installation. These setup changes are not product modifications or phone evidence. Final observed CI results and exact commit are in the PR receipt. Synthetic policy tests are not recognition accuracy.

## Recommendation to Mission 1 controller

**Accept for review as a research adapter; NO model promotion, release or Family Alpha trial.** It demonstrably adds source-bound cross-family alternatives and catches disagreements. The exposed exact-rank improvement is too small and mixed to justify a production model switch. Keep the current review-first flow. Consume genuinely approved #75/#79 human labels through #71/#80 only after prospective candidate freeze. Require critical-confusion/per-category/negative metrics, original-photo rights, actual segmentation/overlap/physical-item truth, calibrated false-confident rate, physical Android/iPhone latency/memory and signed two-account acceptance before promotion. Independent accuracy, primary/secondary-color accuracy, multi-garment recall, original capture on physical phones and family-trial readiness remain **BLOCKED / NOT MEASURED**.
