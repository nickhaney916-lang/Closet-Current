# GARMENT-CLASSIFICATION-ACCURACY-48 — research only

**Parent:** Priority #47 exact SHA `5c55e8fe462af19fbae31618a2e587175260f68c`. **Family Alpha remains HOLD (#255). Never merge, deploy, change production, or update existing staging.**

## Question and approach

The pinned runtime is `ff13/fashion-clip` at revision `0f99955d944c39bfd9d035a02ac273c7a44a406b`, with Transformers.js 3.8.1, Q8 ONNX vision, 512-dimensional vectors and local-only image inference. The current classifier uses category-specific candidate queries, complete-vocabulary checks, a centered confirmation view, and further recoveries for select conflicts. PR #599's small original-photo benchmark recorded only 8/13 broad categories and 4/13 correct subtypes; three accepted errors were T-shirt→Sweatshirt, Blouse→Tunic, Sneakers→Ankle boots. Existing SUBTYPE47 handles those examples with a manual-review gate; it does not improve the underlying ranking.

This research tests one predeclared, local-only candidate: average four text descriptions per target class in the existing frozen FashionCLIP text-embedding space, with 75% ensemble vector / 25% canonical-label vector. The descriptions call out visible construction cues (fabric weight, cuffs, hood, leg openings, hem length, ankle-covering shaft, woven versus denim, and one-piece construction). Candidate rows cover 16 taxonomy labels spanning the 10 requested confusion families. No image labels or locked-test outcomes were used to create/tune this candidate. Text embeddings were generated using the repository-pinned model revision and exported ONNX text encoder via `scripts/rebuild-recognition-vectors.py`; image photos stay in the browser.

No newer model was adopted. A model card search identified `Styld/marqo-fashionSigLIP` (Apache-2.0) as a credible alternative, but the available card describes fashion e-commerce retrieval, not a validated drop-in garment classifier; its Transformers.js/ONNX packaging and mobile load/memory budget have not been demonstrated. It remains research-only until a separately versioned mobile inference benchmark proves compatibility. The model alternatives are compared in `model-investigation.md`.

## Partitions and limits

Use the repository's existing 32-photo reviewed development set, 11-photo fresh validation set, and 16-photo locked evaluation set. Their manifests and labels are immutable in this branch. The 16-photo evaluation has 13 garments plus 3 non-garment controls; total unique source photos across partitions is 59. The rights/hash audit is reproducible with `scripts/audit-classification-accuracy-48-dataset.mjs`. Each image is matched to `benchmark/locked-photo-sources.json`, and duplicate SHA-256 photos fail closed.

Current annotations carry a prior single-file visual-review flag. Repository evidence does not document two independent human labelers or adjudication. Ground truth is therefore **provisional**, not independently certified. The collection is below the requested 100–200 images, does not represent actual phone-camera wardrobe conditions comprehensively, and cannot certify 95% targets. No input is removed from a partition after looking at its result.

## Runtime integration

The default model assets, default behavior, privacy handling, the SUBTYPE47 confusion guard and user confirmation behavior are preserved. A `classificationAccuracy48=research` app query flag or `recognitionProfile=accuracy48` benchmark flag opts into the alternate text vectors. Worker output labels the model profile. Only text vectors are added (~2.3 MB); no image request or new per-photo service is added. A model inference always remains a suggestion; no score can confirm a garment or overwrite a user's correction.

The full browser benchmark compares baseline and candidate on each identical photograph. It records category accuracy and coverage, exact subtype accuracy and coverage, automatic precision and coverage, high-confidence errors, negative rejection, confusion matrices, latency, model-load duration, Chromium heap readings when available, and ONNX resource timing where the browser exposes it. Browser emulation is not a physical Android/iPhone test. WebKit has no portable JS heap measurement; missing measurements must remain null.

## Verification

The dedicated workflow checks exact parent ancestry and changed-file scope, builds the app, audits original images, runs inherited Node tests, runs actual Chromium/WASM baseline and candidate inference on all 59 identical photos, compares each split, and exercises the candidate through actual Chromium and WebKit owner-private mobile-width browser flows with manual corrections, source SHA, duplicate rejection, outfits, and backup/restore. No deploy permissions are granted. The pinned Playwright container uses its system Python with `python3-pip` and `python3-venv` installed from its distribution packages; the pinned recognition requirements are installed into an isolated venv before regenerating candidate vectors. Artifact verdict is independent of CI engineering status: scientific acceptance remains NEEDS REWORK whenever the sample/labels or target metrics fail.
