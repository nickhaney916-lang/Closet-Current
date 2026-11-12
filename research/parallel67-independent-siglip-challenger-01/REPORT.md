# Closet Current — Parallel #67, Milestone 1
## Actually running an independent recognition model: frozen SigLIP vs FashionCLIP

**STATUS: EXPERIMENT / NOT RELEASED. Family Alpha HOLD #255.**
Assignment: [GitHub #892](https://github.com/nickhaney916-lang/Closet-Current/issues/892).
Research branch starts from independently pinned **main HEAD `8c3355350303399e9edc2e98beaf9de15d601282`**. No source code change to production recognition, owner camera, account, private wardrobes, CSS, cloud, deployment, model weights or defaults. This is an INDEPENDENT parallel research stream, not stacked on Mission 1's branches.

### What we are genuinely comparing
- Current: **ff13/fashion-clip** frozen image encoder, private original recognition vector catalog, conservative category/subtype checks. Verified P834 baseline [Actions #43144750475](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43144750475), all 16 publicly licensed SHA-reviewed originals in Chromium and WebKit. In that small development-exposed set, correct accepted category 8/13 Chromium, 7/13 WebKit, three wrong automatic subtypes in both browsers, 3/3 negatives rejected. These are NOT population estimates.
- New challenger: **Google SigLIP**, hosted as [Xenova/siglip-base-patch16-224](https://huggingface.co/Xenova/siglip-base-patch16-224), ONNX Transformers.js v3.8.1; pin **revision `4649052661e53c7000355844105f8a1792088239`**, with CPU int8 (`q8`) inference via `@huggingface/transformers` **running locally** (not any hosted remote image inference). The upstream Google model is [Apache-2.0](https://huggingface.co/google/siglip-base-patch16-224). Verify ONNX port's individual redistributable/license metadata **before future commercial deployment**; this research does not bundle the model weights in Closet Current.
- Original photo content and labels: exactly `benchmark/manifest-holdout-16.json` and SHA-256 verified Commons originals `benchmark/locked-photo-sources.json`. Those labels are historical developer-exposed, not new blind acceptance; preserving all original IDs and source hashes matters. All scoring labels come from existing `public/local-catalog.mjs`, not source-specific prompts.

### Implemented
- New offline source-photo **SigLIP pipeline** `scripts/parallel67-run-siglip-real16.mjs` loads 16 SHA-confirmed photos from local CI disk; never posts them to a hosted recognition API. Pinned `q8` model artifacts are downloaded once from Hugging Face. Every original gets a ranked all-catalog prediction, local elapsed time and safe source-ID-only receipt.
- Distinct pure integrity/scoring module `scripts/parallel67-independent-siglip-scoring.mjs` enforces complete 46? (derive actual count from catalog) unique candidate labels, scores in [0,1], frozen human source order, no unverified additional annotations, no auto admission.
- SigLIP applies sigmoid scores; these values are **NOT calibrated class probabilities or safe confidence estimates**. We report **forced top-1** broad-category/type rankings plus negatives and errors only. Cannot compare forced top-1 directly with the prior FashionCLIP **accepted-only** rates or count a manually reviewed garment as correctly auto recognized.
- Adversarial tests reject fabricated sources, inconsistent labels, duplicate/missing candidate labels, malicious notes, invalid confidences and any attempt to turn an independent model ranking into a private closet save.
- Zero production or staging deploy; exact-source no-deploy CI and numeric-only artifact. **A green software test alone is not model accuracy improvement.**

### Acceptance and rejection protocol
1. Exact HEAD no-deploy CI app regressions and SigLIP actual model download/inference over all 16 source originals; output numeric-only source matrix with true top1 counts, latency/load and model revision. Explicitly fail on missing sources or model load failures. Do not hide failures or invent new ground truth.
2. Inspect whether independent model makes the SAME false top-1 predictions on T-shirt, blouse and sneakers, and whether it recognizes either of the two dresses. Reject the candidate if it worsens key confusions, negative false positives or exceeds viable mobile size/latency.
3. If competitive, proceed to a genuinely **new, independently labeled** larger multi-category photo cohort and physical Android/iOS model performance validation before designing an arbiter in a separately reviewed draft PR. No future source ID tuned thresholds, no unreviewed auto-labels or color fabrication.
4. Real segmentation requires an independently tested garment-instance model; different single-garment classification is NOT segmentation improvement.
5. Family Alpha HOLD #255 remains OPEN and family preview is not yet hosted or approved.

**Honesty boundary:** At this milestone, real new-model testing may or may not outperform the baseline. Do not say recognition has improved or that the wife can use a finished closet until source evidence exists and a protected HTTPS preview is approved.
