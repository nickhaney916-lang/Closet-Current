# Real-photo preprocessing validation

Measured October 14, 2026 UTC, against the unchanged, visually reviewed 32-photo manifest. The selected change preserves full garment edges in both recognition views and conservatively trims uniform light borders. It prepares a 336px square for the primary view and a 320px content area within a 336px square for confirmation. FashionCLIP's processor still produces its normal 224px model input; this does not increase model resolution or alter the stored camera photograph.

## Before and after

| Measure | Rollback baseline | Selected preprocessing |
| --- | ---: | ---: |
| Correct categories | 19/32 (59.38%) | 23/32 (71.88%) |
| Exact garment types | 14/32 (43.75%) | 16/32 (50.00%) |
| Correct types including annotated dress/boot subtypes | 18/32 (56.25%) | 22/32 (68.75%) |
| Requires Adjust | 13/32 | 9/32 |
| Correct shoe categories | 8/13 | 11/13 |
| Correct dress categories | 0/2 | 0/2 |
| Incorrect accepted categories | 0 | 0 |
| Incorrect accepted garment types using annotated subtypes | 1 | 1 |

Category accuracy counts abstentions as misses. The existing benchmark type mismatch is an expected Jacket classified as Blazer; Blazer is not listed as an accepted subtype for that photo. This mismatch remains unchanged. No thresholds, text vectors, model revision, taxonomy labels, or benchmark labels changed.

New acceptances: `commons-0002` (T-shirt), `commons-0024` (jeans), `commons-0081` (sneakers), `commons-0087` (tall boots), and `commons-0093` (ankle boots). Regression: `commons-0001`, previously accepted as a T-shirt, now requires Adjust because the type check is uncertain. Other accepted predictions are unchanged. Both dresses remain safely unclassified; the broad category stage favors Dresses, but garment type/full-vocabulary agreement remains insufficient. Additional scales did not resolve them.

## Validation and reproducibility

- Baseline commit: `bc233f0127ad1917fa4a889e55dbf359404ca1e3`.
- Rollback camera/indexing job and deployments passed: [rollback test run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38493072875).
- The before and after were run in Chromium against the actual production FashionCLIP worker and the same licensed photos: [comparison run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38493878496).
- Nearby scale variants were measured separately: [additional comparison run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38494259866).
- All 32 photos completed without runtime errors in each measured variant. Median per-photo inference was approximately 531ms before and 521ms for the selected variant in the comparison run; these are CI measurements, not phone performance guarantees.
- Production build and all 144 Node checks passed locally, including source-pixel preservation, dress/shoe bounds, safe fallbacks for dark/busy/pale backgrounds, camera capture, simplified navigation, and strict recognition gate regressions.
- `real-photo-preprocessing-results.json` records evaluations for all measured variants, raw before/after predictions, rejection diagnostics, and per-photo transitions. The original 224px/208px trimmed candidate underperformed (18/32) and was not selected.
- `Photo preprocessing comparison` runs baseline and current production preprocessing on the same runner. It can be dispatched against the selected commit; `Real-photo recognition benchmark` now also reruns when photo preprocessing or worker code changes.

## Scope and limits

The simplified interface, single-photo and outfit camera capture, stored image resolution, segmentation crops, and service worker build/version behavior are unchanged. Only recognition input images are resized/trimmed; source pixels remain available for display and editing. The primary and confirmation views use the same bounded crop with different scales instead of a confirmation center crop that can discard soles and hems.

This is a tuning set, not an independent holdout. It contains just two dresses, no accessories, public catalog-style photos, and some similar/duplicate-looking shoe photos. These results support the measured improvement on this set, not general phone-camera accuracy. Dress recognition needs further model/type analysis and more diverse labeled real photos. Confidence gates and Adjust remain in place. No private photos are committed and Drive Duel was not accessed or modified.
