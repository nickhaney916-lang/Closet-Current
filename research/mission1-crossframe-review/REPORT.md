# Closet Current — Mission 1: prevent high-confidence subtype auto-index mistakes

**Research only — FAMILY ALPHA HOLD #255. DRAFT/UNMERGED/UNDEPLOYED.**

## Real source evidence: a falsified hypothesis was rejected

On November 9, prior Mission1 source audit PR #764 ran actual FashionCLIP/WASM against all 59 distinct SHA-locked and licensed real garment JPEGs (32 curated, 16 holdout with 3 negatives, 11 fresh), with 4 wrong automatic subtypes of 47 auto-indexed.

Our first proposal was extra original-photo framing agreement for confusable garment vocabulary. **The real A/B experiment disproved its usefulness**: baseline **43/47 correct auto, 4 unsafe**, extra-framing **42/46 correct auto, 4 unsafe**. It blocked exactly one correctly identified boot and **zero** incorrect automatic subtypes. Evidence: failed experiment [Actions #42721016934](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42721016934), artifact #13721136213. The acceptance check correctly FAILED, and the same-weight extra model-vote proposal has been **removed** from the proposed algorithm. Do not call the original-source views independent machine models or claim improvements from that failed experiment.

## Safer research policy

The current research branch preserves existing source photographic bytes, category taxonomy, inferred details and owner controls. Once the existing worker's source model makes a strong identification, **it does not emit the provisional `identified` event until a subtype-safety decision has completed**.

Four **predicted subtype** classes that were demonstrably unsafe in the exposed source audit now always require **explicit owner subtype confirmation**, regardless of the original CLIP confidence:
- Tops / Sweatshirt (observed T-shirt confusion)
- Tops / Tunic (observed blouse confusion)
- Outerwear / Blazer (observed jacket confusion)
- Shoes / Ankle boots (observed sneaker confusion)

The general rule is based on type/category, NEVER individual photo IDs, filenames or user information. Instead of inventing or auto-saving a subtype, the native research worker reports the recognized broad category with `Unknown` subtype, no guessed color/pattern/fit, and a category-only adjustment/review request. The original JPEG stays intact and does not get published via model diagnostics. The unchanged successful classifications outside these four classes do not incur additional inference or extra owner interaction.

This policy **trades coverage for precision**, and is not a model-accuracy gain or proof these categories should always be manual on future unseen data. The 59 exposed photos are diagnostic only. An unexposed independently human-adjudicated dataset could support a better, less conservative rule later. The user can correct a subtype manually; false automatic saves must take priority over speculative convenience.

## Validation

The dedicated no-deploy workflow runs original and research workers over exactly the same 59 licensed SHA-matched JPEGs in genuine Chromium, preserves all baseline and candidate predictions, audits both with the source-locked Mission1 evaluator, and calculates:
- Wrong automatic subtypes prevented
- Previously correct automatic subtypes moved to review
- Remaining automatic subtype precision and population coverage
- Three real non-clothing controls preserved
- Unexpected changes outside the configured classes
- Regressions across the full application unit tests

Final hosted CI must pass exact-parent source isolation and all tests. None of this constitutes independent human ground truth, real original garment color/pixel masks, garment-instance segmentation, real-phone testing, 3D realism, or authorization to enter Mission 2.

## Limitations

This branch stacks only on the verified research-only PR #764, not on real production or Work parallel #763. Strong but wrong **categories** outside these four subtype families are not eliminated. The guard is deliberately transparent, conservative and owner-review-dependent. It does not improve the underlying FashionCLIP model. A larger independently annotated unseen dataset and objective product acceptance remain required for Mission 1 completion.

**Family Alpha HOLD #255 remains. Never merge/deploy without owner authorization.**
