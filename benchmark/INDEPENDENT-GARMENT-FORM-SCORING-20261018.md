# Independent category AND garment-form validation — October 18, 2026

## Why this gate is necessary
Closet Current needs correct *articles of clothing*, not merely plausible high-level categories. The DeepFashion2 research taxonomy groups shorts, trousers and skirts as **Bottoms**. Previously an accurate silhouette tagged `skirt` could score a correct broad category when a reviewer identified the object as `shorts`. This hides an actual wardrobe-indexing failure.

## Implemented research scoring
- Each independently reviewed original-photo garment outline can carry a `humanForm` (such as `shorts`, `trousers`, `skirt`, `dress`, `outerwear`, `top`, `shoes`, `hosiery` or `accessory`). Its `humanCategory` must agree with the allowed form. Forms are **explicit**; never derived from freeform photo captions or AI candidate names.
- The source photo annotation tool now requires explicit form selection when creating a **new independently identified physical garment**. Categories with only one supported broad form can autofill that broad form; for Bottoms the reviewer MUST choose shorts, trousers or skirt.
- Second, different reviewer explicitly confirms both the whole original outline and the physical garment's category and form before approving. The whole-outfit inventory carries the independently approved form unchanged.
- `evaluateCompletePhysicalInventory` preserves existing location IoU and independently optimal broad-category matching, and independently computes **form-constrained one-to-one IoU matching**. A prediction counts for the form score only if its model class, reviewed form and reviewed category match at the same minimum IoU.
- If **any approved item lacks an independently supplied valid form**, `formConstrainedRecall=null` and the complete ten-photo `correctlyIdentifiedFormRecall=null` (not 0%, not success). Existing legacy approved inventories may still report broad category results; they cannot suddenly acquire form accuracy through inferred captions.
- Independent category and form scoring are **not production promotion**. No automatic save or model activation follows from the research metrics.

## Verified engineering tests
- `tests/physical-garment-inventory.test.mjs` includes a synthetic source where a shorts prediction has **perfect pixel alignment** with a human-reviewed skirt. It receives localization recall 100% and broad-category recall 100%, but **specific-form recall 0%**. Correctly labeled skirt scores 100% in this synthetic code-only fixture.
- `tests/physical-garment-cli.test.mjs` validates complete ten-source aggregation with independently supplied forms and null aggregate metrics when a photo is incomplete.
- The browser annotation, approval and inventory screens are exercised by Playwright end-to-end tests on **synthetic fixtures**, not real human attestations.
- Human review artifacts are packaged from SHA-verified original licensed JPEGs with no model predictions in the first-reviewer packet.
- **No actual human-approved full-scene garment outlines were created or simulated here.**

## Remaining release blocker
Independent human reviewers still must draw and approve *all physical garments* in *all ten* originals, followed by additional held-out real-photo and physical-device trials. Current worn blazer/shirt/skirt and shoe separation still generates uncertain pieces and zero safe automatic saves. Real physical garment IoU, true category-correct recall and form-correct recall remain **unmeasured/null**.

All changes remain in isolated draft PR #10. Do not merge to PR #7 or production, modify Drive Duel, or use paid services without user approval. The full original RGB remains the classification source and is not altered.
