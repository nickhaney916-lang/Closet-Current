# Clothing photo benchmark

This benchmark is separate from the simulated capture tests. It records predictions made by the actual FashionCLIP recognition engine against human-labeled photos. Never label simulated responses as image recognition accuracy.

## Dataset format

Place consented or appropriately licensed JPEG photos in `benchmark/photos/` (excluded from Git), then create `benchmark/manifest.json`:

```json
[
  {"id":"single-001","image":"single-001.jpg","mode":"single","expectedCategory":"Tops","expectedType":"T-shirt","conditions":["daylight","plain-background"]},
  {"id":"outfit-001","image":"outfit-001.jpg","mode":"outfit","expectedPieces":[{"category":"Tops","type":"T-shirt"},{"category":"Bottoms","type":"Jeans"}],"conditions":["indoor","full-body"]}
]
```

Aim for 100 single-garment photos and 100 full outfits, with distinct items, sizes, lighting, backgrounds, angles, and partially occluded garments. A single outfit photo is not a single-item classification; compare its segmented pieces with the annotated pieces. Keep train/tune and held-out evaluation photos separate. Do not commit private wardrobe photos.

## Run

Use the app's actual browser model, not mocked recognition responses. Record each classification or segmentation outcome to `benchmark/results.json`, including image ID, mode, predicted category/type, confidence gates, whether the user was asked to adjust, segment count, and latency. Run `node scripts/evaluate-recognition-benchmark.mjs benchmark/manifest.json benchmark/results.json` to calculate category/type accuracy, false positives, abstentions, and outfit piece recall. Results must be measured before making accuracy claims.

## Capture results from a real browser session

Open Closet Current, use its existing single-shot or full-outfit capture, and compare the photo with the visible category and type assigned to each piece. Record those results in the JSON schema above. A capture simulation is not an image-model benchmark; do not report its mocked predictions as real accuracy.

For each failed classification, record whether the photo was blurry, clipped, dark, partially hidden, or contained multiple items. Keep a separate held-out evaluation set to avoid tuning to the same examples.

## Browser batch runner (real inference)

After deployment, open `/benchmark.html` on the same host as the app. Select the JSON manifest and the matching local JPEG/PNG files, then click **Run single-garment benchmark**. This invokes the **actual production FashionCLIP browser worker** for each image using the app's 2048-pixel, 0.94-quality JPEG preprocessing. Download `closet-benchmark-results.json` and evaluate with `node scripts/evaluate-recognition-benchmark.mjs benchmark/manifest.json closet-benchmark-results.json`. Images are processed in the browser and not uploaded by this runner. The browser must support Web Workers, WebAssembly, and the model's CDN dependencies.

**Limitations:** This runner currently supports single-item photos, not segmentation of complete outfits. No licensed photo collection is bundled or automatically downloaded. Real recognition accuracy cannot be claimed until actual labeled photos are processed and their outputs evaluated. A worker error is an evaluation failure, not a correct classification.
