# Parallel #82 — actual opt-in browser dual-model owner review

**Family Alpha HOLD #255 OPEN. DRAFT / UNMERGED / UNDEPLOYED. Engineering candidate only; release NO GO.**

## Immutable inputs and scope

Final parent: Mission 1 P864 / PR #1030, `bdb1b535fba9ec8b0177b9020b9dc657c2f945a8`; controller compatibility update in #1027 and dedicated no-deploy CI #43485842897 independently checked. Original checkpoint P863 / PR #1024 was `312b1c7545e201d831db8fa654a120005c280974`. This isolated branch was carried forward onto the verified original-retention safeguard; the controller and donor branches were not changed. Donor #81 / PR #1023, `cdd8efd0f52d32fe55cdc0922a9934b7e66ffef3`, CI #43483847767 SUCCESS. `public/model-arbitration-81.mjs` is consumed **byte-for-byte**, with a CI assertion, not modified on this or its donor branch. Exact #67 text builder and scoring module come from `ce598346005d236a3d044bd10af84e3f8c0b8526` (precomputed text milestone); no new text prompts, model training or labels are introduced.

The complete #1027 assignment and #81/#1024 interfaces were read. Inherited P863 classifiers and P864 accepted-original retention, local/outfit workers, model vectors, mask advice, color, physical-unit pairing, duplicate/account/cloud paths and review-first policy remain unchanged. Only a URL-opt-in pending-owner Adjust hook is added to app.js, with extra owner/source checks around its save. Sibling branches, protected main, hosted services, real private accounts/wardrobes and private family photos are untouched.

## Delivered browser workflow

1. The normal camera `snap()`/`candidate()` or import path creates its existing unsaved photo draft. Default scanner is unchanged relative to P864: accepted blank/featureless and recognition-discovered exact-duplicate originals remain pending for owner review, not auto-deleted.
2. In **pending, signed-owner** Adjust only, `?dual82=1` adds an optional local comparison. Guest, already-saved and default views do not mount it. The owner must explicitly consent to the model download and declare that one garment and its distinguishing details are visible. No checkbox is preselected.
3. Existing P80 JPEG/source/owner/crop/mask/unit evidence binds the request. A browser worker checks both actual original/input JPEG digests before model loading. Unverified segmented/paired transforms fall back to the existing grouping/manual flow; they are not certified by two-model agreement. This preserves #68/#70 rather than fabricating mask/physical-item truth.
4. The worker runs **genuine pinned FashionCLIP q8 and FashionSigLIP q8 WASM**, sequentially, disposing each model. Native FashionCLIP whole/center/recovery scorers, risk guard and full 47-label catalog are retained for a real baseline. SigLIP uses the unchanged #67 precomputed 47x768 q8 text embeddings and original-image preprocessing. This is the same candidate family pairing as #81, now executed by an actual browser worker.
5. Complete scores enter the unchanged #81 arbitration module. Rank fusion exposes alternatives without averaging softmax and cosine scores. Disagreement/negative evidence abstains. Every machine subtype remains Unknown; all outputs remain suggestion-only and require owner confirmation. Category/subtype/color/pairing/learning are never automatically accepted.
6. An explicit photo-comparison acknowledgment permits **one** candidate application to the **unsaved** editor fields. Cross-category application uses the real existing category/type controls. The ordinary photo-review checkbox is cleared and remains mandatory before Save changes. The panel never calls a wardrobe save or creates a pair/duplicate link. Normal owner-selected color is untouched.

Request UUID, owner session, photo revision, original/input JPEG SHA, crop/mask/unit descriptors, model revision/license, vision-weight SHA, text-vector SHA and complete runner-source SHA are bound. Responses must match the current request, source and asset provenance, contain both pinned families, and be younger than 60 seconds. The consumer recomputes arbitration instead of trusting a returned decision flag. Single-use local choice state, epoch revocation, owner object/ID checks, item revision checks and the existing save lease reject reused/stale/changed evidence. Save rechecks the panel scope before the existing storage call. Closing the dialog cancels the worker. A per-document busy lease prevents concurrent heavy workers; cancellation/deadlines terminate the worker. Unavailable/failed/unsupported paths preserve the original and manual editor.

### Model delivery, privacy and default-build boundary

`p82-prepare-models.mjs` materializes fixed public pretrained assets under **benchmark/p82-model-assets**, outside public and the ordinary PWA cache/build. The research HTTP server alone maps these to same-origin `/_dual82/`. Approximately **208,158,336 bytes** of fixed runtime/model/vector/config assets are described in the reviewed lock. Vision-encoder weights are not committed or uploaded as artifacts. A frozen 144,384-byte public text-embedding bundle (base64 JSON, no photographs or owner content) is committed for identical inference inputs across hosts. No default user downloads either new model.

The worker forbids remote model fallback and browser model caching, accepts only allowlisted same-origin local asset paths and GET requests, rejects redirects, bounds body sizes, and verifies every fetched asset hash/length. Runtime module/glue hashes are checked before fixed-URL imports; execution still trusts the same-origin script host, and this is **not independent scorer custody**. No arbitrary model URL or remote image endpoint is accepted. JPEGs go only to the local worker; response/CI artifacts have numeric public-source evidence, not pixels. Original files are hashed before/after the experiments.

Vision pins are inherited from #81:

| Model | Immutable revision | q8 vision SHA-256 |
|---|---|---|
| ff13/fashion-clip (MIT model card) | 0f99955d944c39bfd9d035a02ac273c7a44a406b | c6d61df38ae56329347400dc42a285a4233d0c681744fb37f52129b5fe248952 |
| Marqo/marqo-fashionSigLIP (Apache-2.0 model card) | 782eaf7a0b95411ac96893d2300d1a61a2bcb757 | f1009cfce0eedd409f601e8351eedab72e8529641105eee6517821a9a634a2f4 |

Publisher sources: https://huggingface.co/ff13/fashion-clip and https://huggingface.co/Marqo/marqo-fashionSigLIP. Raw #67 q8 text bundle SHA: `2b9b4a71177238e0ca5e94ff2bc69748e9291a4726e108ef89774451f40c224f`. The lock covers configs and runtime bytes too. This does not upgrade quarantined photographic rights or authorize a commercial/user rollout.

## Actual local browser results — exposed development only

Both real WASM models completed on **48/48 identical SHA-verified public development JPEGs** in one desktop Chromium browser, with one terminated worker per photo. These are the historical 32+16 cohorts, not new human-reviewed blind data. No historical expected string was changed. Generic Boots/Dress expectations do not establish fine boot/dress subtype truth. Owner opt-in declarations in automated fixtures are simulated, not genuine human review.

| Metric | 32 exposed photos | 16 exposed photos | Total |
|---|---:|---:|---:|
| FashionCLIP raw first rank exact historical subtype | 20 | 7 | 27/48 |
| Combined first displayed hint exact historical subtype | 22 | 8 | 30/48 |
| Arbitration abstentions | 6 | 6 | 12/48 |

FashionSigLIP raw first rank exact matches: **28/48**. Broad category raw matches: **43/48 CLIP; 44/48 SigLIP**. The fused first hint gained `commons-0035` (Shorts), `commons-0045` (Skirt), and `commons-0062` (Jacket), with **zero previously exact-matching CLIP first hints lost on this exposed cohort**. Machine certified subtypes and automatic admissions: **0**. There are **36 hypothesis-status cases** and 12 abstentions; these statuses are not correctness measurements. Shared model mistakes remain, including T-shirt/Sweatshirt and Blouse/Tunic confusions. Negative examples and per-category counts are in summary.json.

The native baseline had 26 strong results in this browser diagnostic; this is a native classifier output count, **not a number of saved wardrobe items**. The real app still requires owner review. Historical exact first-rank matches, strong output counts, abstentions, actual saves and independent accuracy are different metrics. No reduction in genuinely wrong user saves is claimed. #81 CPU had 26/48 CLIP and 29/48 fused exact strings; those differ from browser WASM results and must not be pooled or called a weights-only gain.

All five legacy boot sources `commons-0088/0089/0092/0093/0094` retain native subtype **Unknown**. Two-model alternatives expose Ankle boots while final machine subtype remains Unknown. Existing historical 32-photo strict boot regression remains RED (ten assertions); it is neither waived nor redefined. A manually acknowledged choice is not a model fix or independent fine-boot annotation.

Observed local Chromium per-photo total p50 **8.57 s**, p95 **12.14 s**. CLIP load median 3.42 s and inference median 1.24 s; SigLIP load median 1.82 s and inference median 1.09 s. These samples include local asset delivery, verification, worker/model creation and CLIP native recovery/detail work, under concurrent development workloads. They are not comparable isolated encoder benchmarks, network-download times, physical-phone speed or a verified mobile performance target. Weight bytes are recorded separately; actual peak JS/WASM/resident memory is **NOT MEASURED**.

### Genuine browser failure and containment

Desktop WebKit completed one original, then its continuous second-photo attempt closed the page/browser process. The cause was not established; this is **not a proven OOM diagnosis**. A fresh-browser-per-photo diagnostic was attempted separately and is not continuous-session acceptance. Partial/unfinished runs are not scored as a complete 48-photo success. The dedicated CI runs four explicit WebKit hard cases in isolated browsers and labels their smaller denominator; this cannot prove reliability of a continuing iPhone session.

**The product-facing research panel therefore enables real inference only on Chromium-family browsers. WebKit/iOS and unverified engines retain the original/manual editor with an explicit unavailable message.** Desktop Chromium success does not establish Android acceptance. The raw browser runner can still execute isolated WebKit research diagnostics for #69/#78 without enabling it for an owner. This containment is a deliberate engineering result, not a claim that WebKit runtime instability was fixed.

## Actual owner-review and failure testing

- Actual app `snap()` and `candidate()` executed against Chromium's explicitly virtual webcam: a JPEG entered the unsaved batch, zero writes. No physical camera or clothing truth was inferred from the generated video.
- Actual app Adjust + actual dual worker + **real public clothing photo commons-0035** completed two-model inference. Explicitly choosing Shorts updated the unsaved type, normal photo acknowledgment stayed required, and only explicit normal Save made one **mock-storage** write. Original JPEG bytes and pre-existing color field matched exactly. This is not a real signed account or owner trial.
- A second actual-model public photo, `commons-0062`, exercised real cross-category controls from Bottoms to Outerwear/Jacket without saving.
- Actual offline and hash-corrupt model asset delivery returned manual fallback, zero writes, original retained.
- Actual-source synthetic policy tests in desktop Chromium/WebKit at **320/390/430** cover default-off/guest/saved exclusions, consent, no implicit field edit/save, single explicit save, seven owner/source/crop/mask/unit changes, canceled requests, and WebKit manual fallback. A synthetic worker transport also covers concurrent request rejection, deadline termination, abort and simulated allocation/constructor failure. These last failures are **simulations, not measured OOM or device memory tests**.
- Native regressions and both builds, inherited #80 editor and footwear owner-unit browser cases are retained. Final exact-head CI and counts are reported in the draft PR, not inferred from a donor or partial run.

## Reproduce safely

```sh
npm install --no-save --no-package-lock @huggingface/transformers@3.8.1 playwright@1.56.1 sharp@0.34.3 fake-indexeddb@6.2.4 three@0.180.0 three-mesh-bvh@0.9.2 axe-core@4.10.3
npx playwright install --with-deps chromium webkit
node scripts/build.mjs
node scripts/build-m1-no-account-trial-831.mjs
P79_REQUIRE_DECODER=1 node --test --test-concurrency=1 tests/*.cjs tests/*.mjs
node scripts/test-p82-review-browser.mjs
# Recover the fixed 32+16 public IDs with the existing SHA-locked downloader:
# node scripts/download-reviewed-photos.mjs benchmark/locked-photo-sources.json benchmark/photos <48 comma-separated IDs>
node scripts/p82-prepare-models.mjs --check
node scripts/p82-real-browser.mjs chromium
node scripts/p82-summarize.mjs benchmark/p82-chromium/results.json benchmark/p82-chromium
P82_ISOLATED=1 P82_IDS=commons-0035,commons-0078,commons-0003,commons-0059 node scripts/p82-real-browser.mjs webkit benchmark/p82-webkit-hard4
node scripts/test-p82-real-review.mjs
```

The preparation step downloads only fixed public model assets and restores the exact frozen #67 text-vector bytes; it does not train, deploy or access an owner's wardrobe. Its output is served by the local research fixture server used by the scripts. The shipped app hook is `?dual82=1` on pending owner Adjust; no production preview or real account setup was performed. Supplying those assets to a hosted/private environment requires separate main-controller acceptance; Family Alpha is still HOLD.

The dedicated NO DEPLOY workflow pins P864 ancestry, verifies the unchanged donor arbitration blob, enforces a strict changed-path allowlist, verifies original model/worker/cloud files unchanged, runs full native/build, six owner-review browser profiles plus inherited tests, actual full-48 Chromium, four isolated WebKit cases and actual-model owner review/offline/corrupt delivery. Only public-source numeric JSON is uploaded. Initial CI exposed shallow-checkout history assumptions and host-dependent q8 text encoder floating-point differences (CI recomputation SHA 1e8a7ce6… vs the experiment bundle 2b9b4a71…). Native scope tests now compare independently pinned content hashes, while dedicated CI still checks ancestry and the donor Git blob. The exact public text-encoding artifact is frozen and validated against the unchanged #67 packager; --rebuild-text is available for explicit regeneration but cross-host bit equality is not claimed. No text vectors or labels are silently retuned to pass CI.

The final commit/PR/verified CI receipt is maintained in the PR body; no self-referential commit hash is invented here.

## Controller recommendation and acceptance blockers

**GO for review of the opt-in Chromium research integration; NO GO for model promotion, release, family trial or WebKit/iOS real inference.** Engineering integration is delivered with executable real-model owner-review tests. No generalized accuracy or physical-device target is met by synthetic tests or exposed photos.

Still required: #75/#79 lawful source-disjoint 60+ photos and distinct independent human subtype/instance/color review; #71/#80 signed heterogeneous score custody (the current signed verifier is FashionCLIP/two-view-specific); prospective candidate freeze and per-category/critical-confusion false-confident/coverage scoring; #68 approved overlapping-garment masks and physical-item truth; #69/#78 continuous WebKit/iOS stability, startup/latency/peak memory and physical Android/iPhone camera acceptance; real signed two-owner/cloud backup/session acceptance and owner release authorization. All independent blind accuracy is **BLOCKED**. Existing explicit photo review, original preservation, private ownership, pairing, duplicate safeguards and Family Alpha HOLD remain in force.
