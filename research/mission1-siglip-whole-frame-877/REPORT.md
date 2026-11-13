# Closet Current — Mission 1 P877: genuine model full-frame comparison before any recognition change

**Family Alpha HOLD #255 OPEN — RESEARCH DRAFT, UNMERGED, UNDEPLOYED. NO RECOGNITION MODEL PROMOTION.**

## Baseline and motivation
Exact immutable P876 parent [draft PR #1078](https://github.com/nickhaney916-lang/Closet-Current/pull/1078) at `f7c37c309b722a06020c837a0d47fe0f376de554`, [successful 2/2 no-deploy GitHub Actions #43521608559](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43521608559). P876 passed 584/584 native, six desktop Chromium/WebKit owner-policy profiles and genuine sequential FashionCLIP/FashionSigLIP q8 on 48 legally sourced, SHA-locked original public development JPEGs. The P876 classifier is **not 10/10**: its historically exposed strings yielded FashionCLIP 27/48, SigLIP 28/48, rank-fused first hint 30/48; 12 arbitration abstentions, no independently blind human accuracy.

The current `dual-worker-82.mjs` executes exactly one SigLIP image view with `vision(await processor(image))`, whereas the same worker already supports a full-garment, white-padded `fitWholePhoto(image,RawImage)` view for a FashionCLIP recovery diagnostic. It has not yet *measured* how preserving the entire garment silhouette in a whole-frame SigLIP input changes category and subtype rankings. Direct preprocessing and fitted white-padded preprocessing may differ; this study does not assume which is better. Previous experiments re-framing FashionCLIP failed for admission decisions, so this new view must remain **research-only**, with losses reported and no default rollout.

## Source-verified change (frozen before any real test)
- Inside the same one-shot browser Worker and pinned `Marqo/marqo-fashionSigLIP` q8 weights, an extra `fitWholePhoto224-white` embedding is computed **only if** the research-only request token `researchFrame877:'whole-224-v1'` is set. The normal SigLIP original image's full 47 scores and the unchanged FashionCLIP baseline are computed exactly as before, and remain the **only** inputs to ordinary `validateResponse82` arbitration. There is **no third independent model**, no extra ensemble vote, no change to ranking, review, default owner app or saved wardrobe. A normal owner request has no research token and receives `experiment877:null` without running a second view.
- Alternative evidence includes full 47-label score ranking, unchanged model/vector/source digest, original input JPEG source binding, mode label, explicitly `sameModelNotIndependent:true`, and incremental inference timing. The browser worker disposes the model and terminates after every photo, as in P876.
- The source-verified research browser runner injects the token only under `P877_FULL_FRAME=1`, validates original source SHA before and after the experiment, rejects unauthorized external/non-GET requests, and records original and alternative model outputs as **numeric** research artifacts without original pixel content. No live user accounts, private photos or hosted cloud.

## Pre-registered evaluation / guard against fabricated claims
- `scripts/p877-siglip-full-frame-audit.mjs` validates 48 distinct source SHA receipts, pinned q8 model metadata and source binding, complete nonduplicated 47-label rankings, same-family designation, model provenance, zero automatic admissions and intact existing reference output. It computes all first-rank **historical string matches** before/after (category and subtype), every *gain and loss*, changes in first-rank category/type, per-historical-category counts and extra processing time.
- Negative and generic-source historical expectations (generic Boots/Dress) are NOT independent fine-subtype truth. A winner on this historically exposed cohort cannot authorize any recognition promotion; no blind source-disjoint human labels exist. The previously problematic `commons-0078` sneaker-vs-ankle-boots photo is reported regardless of result, not cherry-picked, used for tuning, or excluded.
- Six native **synthetic** audit tests require exact score taxonomy, reject swapped image sources, truncated/missing photos, unknown/incomplete vocabularies or falsely promoted admissions, and prove balanced gain+loss accounting. These are source-integrity tests, not photo correctness evidence.
- Exact six changed files: `public/dual-worker-82.mjs`, `scripts/p82-real-browser.mjs`, `scripts/p877-siglip-full-frame-audit.mjs`, `tests/mission1-siglip-frame-877.test.mjs`, this report and strict no-deploy workflow. No default app, baseline recognition engine, model weights, P876 confusion guard, source JPEGs, catalog, cloud, staging/production or other mission branches are changed.
- Two independent NO-DEPLOY CI jobs: full native/build + desktop Chromium/WebKit owner-photo and privacy policies; genuine two-model full-48 original-photo benchmark with alternative SigLIP view, both versions' exact model scores and numeric-only downloadable audit.

## Acceptance decision and blockers
No changes to model promotion or family trial even if experimental historical string matches rise; positive and negative changes alike demand independently signed, legally usable, source-disjoint human-labeled blind photos, stringent critical confusion/negative coverage and physical phone/memory stability before adoption. Actual continuous WebKit (#83) remains separate and blocked; desktop WebKit simulated owner policy is NOT two-model WebKit inference acceptance. 0 physical Android/iOS verified here, 0 signed private two-owner cloud integrations, and 0 independent human blind accuracy. No 10/10 claim. **HOLD #255 remains OPEN.**

Final-head CI conclusions and before/after numerical measurements must be added only after GitHub Actions finishes; do not invent unobserved results.


## Measured source-locked public development A/B (initial verified HEAD `a66677b24e0867d39fc0c8b6fa1e282b1b469433`)

[GitHub Actions #43528524369](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43528524369) completed **2/2 NO-DEPLOY jobs SUCCESS** on the pre-analysis-refinement SHA above. The final amended HEAD (with explicit garment/non-clothing metrics) requires new exact-head CI; do not claim that earlier run validated the final changes.

All **48/48** genuine, source-SHA verified public development originals completed real pinned q8 FashionCLIP and FashionSigLIP inference in one desktop Chromium session, one terminated Worker per original; no non-GET or outbound requests; zero wardrobe admissions, zero altered original JPEGs. The additional white-padded whole-frame SigLIP view ran after the standard original view, **without changing the ordinary two-model arbitration result**.

| Developer-exposed historical first rank metric | Original SigLIP processor view | Alternate white-padded full-frame view |
|---|---:|---:|
| All 48 historical subtype strings (including Unknown negatives) | 28/48 | 30/48 |
| **Actual garment-source** historical subtype strings | **27/45** | **28/45** |
| **Non-clothing source** first-ranked negative category | **1/3** | **2/3** |
| Historical main-category strings, all 48 | 44/48 | 45/48 |
| Changed top subtype string | — | 2/48 |
| Previously matching historical strings lost | — | 0/48 |

The two changed model top ranks were:
- `commons-0001`, original category Tops/historical **T-shirt**: `Polo` → `T-shirt` (one garment-subtype development string gain).
- `commons-0090`, historically **Uncategorized/Unknown**: `T-shirt` → `Unknown`/non-clothing (one negative-rejection development string gain, **NOT a garment-subtype accuracy gain**).

The pre-registered hard source `commons-0078` historically says **Sneakers**, but both views still ranked **Ankle boots** first. The alternate view did not fix the demonstrated shoe confusion.

**Research-only execution overhead:** added full-frame pass `extraInferenceTotalMs: 29748` for 48 photographs, around 620 ms per photo on the ephemeral desktop CI runner. Memory peak NOT measured; this does not predict physical iPhone/Android latency. Generic Boots/Dress historical labels are not fine subtype human truth. Source labels were development-exposed, potentially imperfect and not independently human-adjudicated. No blind accuracy, confidence calibration, 10/10, production promotion, owner pilot, continuous WebKit or physical phone claim. A possible positive next step is an independently preregistered blind candidate trial after Parallel #75/#79 delivers genuinely independent labeling; do **not** change owner default recognition on the basis of these 48.

**Reproducible numeric-only artifact:** `p877-public-exposed-development-numeric-frame-comparison-only` on the successful initial run, and CI rerun on the final amended HEAD. Both winning and losing IDs are produced, never selectively hidden.
