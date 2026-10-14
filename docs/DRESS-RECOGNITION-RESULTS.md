# Dress recognition and T-shirt recovery

Measured October 14, 2026 UTC, against baseline `3a7020ceb0ff0ede2f86bc6277b87ad6028aca11`. The selected production changes fix an uncertain top type through an additional bounded preprocessing check and retain a strongly agreed dress category for manual review without guessing its subtype.

## Measured results

| Original reviewed set | Before | After |
| --- | ---: | ---: |
| Correct categories | 23/32 (71.88%) | 25/32 (78.13%) |
| Fully identified / automatically indexable | 23/32 | 24/32 |
| Category identified, subtype still in review | 0/32 | 1/32 |
| Exact garment types | 16/32 (50.00%) | 17/32 (53.13%) |
| Correct annotated types including accepted subtypes | 22/32 (68.75%) | 23/32 (71.88%) |
| Correct shoe categories | 11/13 | 11/13 |
| Correct top categories | 1/2 | 2/2 |
| Correct dress categories | 0/2 | 1/2 |
| Incorrect identified categories | 0 | 0 |

Every previously strong prediction retains exactly the same category and type. `commons-0001` recovers its T-shirt classification. `commons-0052` gains the Dresses category with type Unknown and remains in Photo results for Adjust; it is not automatically saved. `commons-0053` remains unclassified because its full-vocabulary comparison conflicts with tops. The existing expected Jacket / predicted Blazer benchmark subtype mismatch remains unchanged.

The disjoint 16-photo validation set contains 13 clothing photos and 3 non-clothing images. Both versions identify 5/13 clothing categories (38.46%) and match 2/13 annotated types (15.38%). All three non-clothing images are rejected, with no false category assignments. All 16 predictions remain unchanged. These low clothing coverage/type figures are a remaining limitation, not a passing accuracy target.

All 48 photos complete without runtime errors. Median classification latency in the comparison runner was 530ms before and 524ms after on the original set, and 342ms before / 351ms after on the holdout. The recovered T-shirt uses extra image encodings and takes longer individually. These are CI measurements, not phone performance estimates.

## Behavior and safety gates

- Normal shoe and garment preprocessing remains the validated 336px whole-garment preparation with the 320px confirmation view. Original camera images and segmentation crops are unchanged.
- An additional preprocessing check is allowed only when the current broad category strongly supports Tops but the type is uncertain. The original whole-photo and center views must independently pass all existing category, branch, complete-vocabulary and confirmation gates. Failed category checks, full-vocabulary conflicts, view conflicts, shoes and dresses are not retried through this top recovery path. Failed recovery leaves the original result intact.
- Dress category review requires both broad category views to favor Dresses at score >=0.85 and separation >=0.35. Both complete-vocabulary comparisons must also favor Dresses, have aggregate dress-category score >=0.75 and separation >=0.50, and assign at most 0.10 total score to non-garment prompts. These scores are gates, not calibrated probabilities.
- A dress review result returns `strong:false`, type Unknown, and no inferred details. It fills only the Dresses category, keeps the photo in review, preserves user edits, respects clipped/mismatching segmentation context, and requires the user's existing Adjust/save flow. Automatic type thresholds, including the strict 0.60 full-vocabulary gate, are unchanged.
- The simplified interface gains no tabs or controls. Its status text explains the existing Adjust action. High-resolution camera capture, ownership confirmation, duplicate checks and draft/storage behavior remain in place. Drive Duel was not accessed or modified.

## Validation and reproducibility

Production build and all 153 Node tests pass locally. New cases verify recovery cannot bypass category/vocabulary/view conflicts or threshold failures; partial dress categories never autosave or overwrite user corrections; type-only view disagreement can retain only the category; and category review / negative rejection metrics are distinct from automatic indexing.

Actual production-worker inference and baseline comparison: [comparison run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38496295717). The raw measurements and transitions are in `dress-recognition-results.json`. The final candidate also passed the separate [real-photo benchmark](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38496295789).

Averaging features from two scales was measured and excluded: it reduced original-set categories from 23 to 21 and holdout categories from 5 to 4. The selected change preserves existing predictions and adds only the validated recovery / category review results.

`Real-photo recognition benchmark` now runs both the 32-photo manifest and `manifest-holdout-16.json`, with holdout artifacts stored separately. `run-browser-photo-benchmark.mjs` accepts optional manifest and output-directory arguments. The comparison workflow runs both sets before and after against the fixed baseline.

## Dataset limits and next work

The added photos were visually reviewed and labeled before measuring model predictions. They have different source IDs/garments from the 32-photo tuning set; duplicate views of the same garment were excluded. Public source links accompany the manifest, with license/attribution records retained in the original collection artifact. No private or downloaded photos are committed.

The extra set includes historical/museum clothing, varied backgrounds and some detail crops. It is a small validation set from the same Commons collection, not evidence of broad phone-camera accuracy. The original set is used for tuning. Further work should improve dress/tunic distinction and subtype recognition using a larger, diverse, separately labeled real-camera dataset, while tracking manual-review coverage separately from automatic indexing.
