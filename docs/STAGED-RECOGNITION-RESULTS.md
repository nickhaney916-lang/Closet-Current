# Staged recognition results — October 13, 2026

## Current implementation

The recognizer now checks the broad clothing category, the specific garment within that category, and the complete clothing vocabulary. All must agree. A second image view must also support the same garment type before identification or automatic saving. Uncertain photos remain in Photo results with one Adjust action.

The whole-photo view fits the entire image into a square with white padding. This prevents the old processor's center crop from cutting off sleeves, hems or the ends of wide garments. A separate center view verifies the result. Detailed attributes need agreement between the whole-photo and center-view comparisons; fields with weak or conflicting evidence remain unknown.

The app uses a pinned FashionCLIP q8 vision model with high-precision, precomputed text vectors for its supported clothing descriptions. The model weights are approximately 89.1 MB, compared with the former combined model's 153.7 MB. Text vectors add 2.36 MB to the application assets. There are at most two image-model passes per photo; label and detail comparisons reuse these image features. Photos and their features stay on the device. No cloud inference or billed API was added.

Assets are checked for a matching SHA-256 digest and label coverage. The model revision is pinned to the revision that generated the text vectors. Changing the vocabulary requires regenerating the vector bundle and passing the asset-coverage checks.

## Release comparison

The policy was frozen before evaluating a new set of 100 photos, ten per dataset class. These photos do not overlap the three earlier development/comparison samples. The same images were checked by the old and new recognizers using single-threaded ONNX Runtime WebAssembly SIMD inside Node. This validates the inference backend, not a physical phone or browser camera. Node image resizing differs from browser Canvas resizing, so phone accuracy and performance remain unverified.

| Broad-category outcome | Former recognizer | Staged recognizer |
|---|---:|---:|
| Correct automatic category | 73 | 64 |
| Incorrect automatic category | 6 | 2 |
| Requires adjustment | 21 | 34 |
| Correct among automatically accepted categories | 92.4% | 97.0% |

The improvement is fewer incorrect automatic saves, with more conservative coverage. Do not present 97.0% as accuracy on every photo or every clothing attribute. In the subset with a scorable dataset class/type mapping, mismatches fell from 12 of 63 accepted items to 5 of 56. This is a limited coarse-label check, not a manually annotated forty-type or attribute benchmark.

The remaining broad-category errors were a dataset-labeled dress recognized as a blouse, and dataset-labeled outerwear recognized as a jumpsuit. They are preserved as failures in the report. No labels or thresholds were changed after this release-set evaluation.

## Other checks

- 105 automated tests pass, including 100 simulated captures, storage-failure retry, uncertain results, duplicate handling, manual adjustments, late responses, image-feature isolation, corrupted assets, whole-photo preparation and stage/view disagreements.
- Eight real non-clothing images (pets, a house, food, an airport, a landscape, a book and an invoice) were not automatically indexed in the desktop CPU smoke test.
- Twelve product-photo variants (four originals, dimmed versions and reduced-resolution versions) produced four accepted polo results and eight uncertain results. No incorrect annotated color, pattern or sleeve attribute was emitted in this small smoke test. Fit was not annotated or scored.
- An additional native CPU comparison on the release set produced 63 correct automatic categories, 2 incorrect categories and 35 uncertain cases. Small differences between native and WebAssembly execution confirm why results must be measured on the app's backend.
- Previously saved photos and user corrections are not silently rewritten. Use Adjust to correct an existing item. The existing save/retry fix remains in place.

## Development decisions

The first staged-only prototype and a generic CLIP comparison did not improve the balance of correctness and coverage enough to publish. Full-precision FashionCLIP improved the earlier development sample, but its approximately 606 MB combined-model download was unsuitable as the default. Precomputing text vectors allows higher-precision clothing descriptions with a smaller runtime vision model. Tests exposed further dress/top ambiguities, which led to agreement checks across views. Earlier samples became development data; only the final disjoint release sample supplies the table above.

## Sources and validation limits

- Dataset: https://github.com/alexeygrigorev/clothing-dataset-small. Selection uses sorted unused validation paths, then remaining test paths, then unused train paths to reach ten per class. No model training used any of these samples. Exact paths and outputs are in staged-recognition-results.json. Public photographs are not copied into this repository.
- Product smoke-test photos: https://github.com/patrickjohncyh/fashion-clip/tree/master/images.
- Non-clothing examples: https://huggingface.co/datasets/Xenova/transformers.js-docs.
- Model: https://huggingface.co/ff13/fashion-clip, revision 0f99955d944c39bfd9d035a02ac273c7a44a406b (MIT). Runtime: Transformers.js 3.8.1 (Apache-2.0).

Run `node --test tests/*.cjs tests/*.mjs` and `node scripts/build.mjs` for the functional and build checks. Real-phone capture, speed, heat and browser Canvas preprocessing still need validation. Larger independently annotated tests are required for color, pattern, fit and sleeve claims. Multi-garment scenes and unusual clothing remain challenging; users should show one whole garment in good light against a plain background.
