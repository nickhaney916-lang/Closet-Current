# Mission 1 P836 — opt-in no-silent-auto-admission review gate

**FAMILY ALPHA HOLD #255.** This is an isolated research branch, draft-only, unmerged, undeployed. It changes no hosted production, staging, cloud, authentication, model weight, publisher image label or private wardrobe photograph.

## Problem

The exact pinned P834 [real-original FashionCLIP audit](https://github.com/nickhaney916-lang/Closet-Current/pull/888) verified `beb7f27b18f70faa32c94ca2ac5d4260e83f0f0f` and [six green CI jobs](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43144750475). On 13 development-exposed garments it found three strongly wrong automatic subtypes **in each browser**: T-shirt→Sweatshirt, Blouse→Tunic, Sneakers→Ankle boots. The existing app still uses `result.strong` as an automatic closet save signal. A review-first trial must not treat a classifier's high score as a confirmed owner label.

## Implementation (opt-in only)

- `?reviewFirst836=1` activates the trial guard in `public/app.js`. Default existing behavior remains untouched on this draft branch for a valid A/B control.
- After a model has proposed a strong specific subtype **or** a category-only result with uncertain subtype and color, the guard holds the garment and original photo as a draft, marks explicit owner confirmation required and displays **“Confirm before adding”**. It does **not** call the automatic `saveIndexed` path.
- The existing **Adjust** editor is the owner action that saves corrected category, type, color and related details. Unrecognized/negative images continue to require manual review. Image and crop are preserved; user adjustments, duplicates, mask conflicts and owner-context guards remain in place.
- This is *not* a change in FashionCLIP predictions, not a claim to improve raw category/subtype model accuracy, and not a license to deploy the model or permit spouse/family trial. It only prevents **silent wrong automatic acceptance** when explicitly enabled for isolated trials.

## Regression and evidence

- Three added native tests exercise strong recognition, category-only with color, and unknown/negative outcomes under the opt-in guard; existing automatic indexing tests remain a control for default behavior.
- Dedicated GitHub workflow validates changed-path allowlist against exact verified P834 parent, builds native app and isolated trial, runs full Node regression suite and P836 tests. All outputs are numeric/log text; no original JPEGs or owner data uploaded.
- An opt-in guard forces **zero automatic saves by design**; this is not equivalent to 100% correct recognition. Correctness still needs new independently human-labeled, source-disjoint photos, real instance segmentation, color truth, proper unknown rejection and physical Android/iPhone testing.

## Decision

**REVIEW-ONLY SCIENTIFIC SAFEGUARD; NO MODEL PROMOTION.** Do not merge, deploy or close Family Alpha HOLD #255. Recognition improvements from Parallel #67 and #68 must be evaluated separately on independently human-labeled photos before integration.
