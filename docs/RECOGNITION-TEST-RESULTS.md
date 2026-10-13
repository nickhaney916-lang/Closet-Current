# Indexing and categorization checks — October 13, 2026

## Result

The functional suite passes 93 automated tests, including 100 simulated captures in five batches of twenty. These simulations inject recognition responses; they verify indexing, saving, filtering and queue behavior, not visual recognition accuracy.

The actual q8 FashionCLIP model was also exercised on 100 real clothing photographs across ten classes. This is a desktop Node CPU test with Transformers.js 3.8.1, not a physical-phone or browser WASM performance test.

- 68 photos were correctly auto-categorized against the dataset's broad category label.
- 2 photos were incorrectly auto-categorized.
- 30 photos were below the automatic recognition confidence threshold and require adjustment.
- Accuracy among automatically accepted broad categories was 68/70 (97.1%); correct automatic coverage was 68/100 (68%).

Do not interpret these figures as item-type, color, pattern, fit or sleeve accuracy. The dataset does not provide the detail annotations used by this app. Recognition is not ready to be described as error-free.

## Real-photo category results

| Dataset class | Photos | Correct automatic category | Incorrect automatic category | Needs adjustment |
|---|---:|---:|---:|---:|
| dress | 10 | 3 | 1 | 6 |
| hat | 10 | 8 | 1 | 1 |
| longsleeve | 10 | 3 | 0 | 7 |
| outwear | 10 | 8 | 0 | 2 |
| pants | 10 | 8 | 0 | 2 |
| shirt | 10 | 10 | 0 | 0 |
| shoes | 10 | 5 | 0 | 5 |
| shorts | 10 | 10 | 0 | 0 |
| skirt | 10 | 8 | 0 | 2 |
| t-shirt | 10 | 5 | 0 | 5 |

The two accepted errors were a knitted hat identified as a sweater and a short dress identified as a tunic. Manual inspection confirmed these are real ambiguities/errors, rather than changing the dataset label to make the test pass. No classification thresholds were tuned on this sample.

## Fixes verified

- A failed closet write no longer marks the photo finished and excludes it from retry. The photo stays in the queue, keeps its labels, shows “Not saved,” and can be retried after storage recovers.
- Blank and exact duplicate photos are skipped. Visually similar garments remain available for review.
- Unreadable photos do not block later garments; late recognition responses cannot save removed photos.
- Adjustments made during recognition survive the response. A new capture during a save is preserved.
- A detail suggested by the combined model comparison now needs agreement from a separate field-only comparison using the same model. Disagreement or weak confidence leaves that field unknown.
- Photos with a shorter dimension below 224 pixels still receive a garment-type check, but do not automatically receive detailed attributes.
- Image decoding is shared across model comparisons. The detail checks can add up to four model comparisons; physical-phone speed remains unverified and the existing timeout remains in force.

## Detail smoke test

Four public product photos (two red polos, multicolor sneakers, and a black dress) were tested in original, dimmed and reduced-resolution versions: twelve cases. Before the change, a reduced-resolution red polo received a Pink color and two solid-polo cases received Polka dot patterns. The updated checks withheld those wrong attributes. Nine polo/sneaker cases passed the type threshold; all three dress cases remained uncertain. Many detail fields correctly remain unknown pending stronger evidence. This small development set is not a general accuracy benchmark, and two comparisons by the same model do not guarantee correctness.

## Sources and reproduction

- Category sample: https://github.com/alexeygrigorev/clothing-dataset-small — first ten sorted JPEG paths per class in the test split. The exact image paths, outputs and broad-category annotations are in recognition-holdout-results.json. Photos are not included in this repository.
- Detail smoke-test images: https://github.com/patrickjohncyh/fashion-clip/tree/master/images — 16198646.jpg, 16790484.jpg, 16867424.jpg and nike_dress.jpg. See recognition-detail-results.json.
- Model: https://huggingface.co/ff13/fashion-clip (q8).
- Functional checks: `node --test tests/*.cjs tests/*.mjs`.
- Deployment build: `node scripts/build.mjs`.

## Remaining validation

Test real phone photos with clutter, folded garments, multiple garments, patterned clothing, shoes and accessories. Validate individual details with manually annotated images and expand to independent samples before claiming paid-platform recognition reliability. Previously saved labels are not silently rewritten by this change; use Adjust for an existing incorrect label.
