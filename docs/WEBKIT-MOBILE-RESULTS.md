# Mobile WebKit photo validation

Validated October 14, 2026 on production baseline `02f249907bc13b1ae95eea81e8af816a8d94cbfb`.

[Validation run 38606969098](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38606969098) passed using Playwright WebKit with the iPhone 13 device profile (390×844). This is desktop WebKit emulation, not a physical iPhone or a complete Safari certification.

| Check | Observed result |
| --- | --- |
| EXIF orientation 6, 3000×1500 input | 1024×2048; red source half at top |
| EXIF orientation 8, 3000×1500 input | 1024×2048; red source half at bottom |
| Outfit import, 4000×2000 input | 1536×3072; correct portrait orientation |
| Small photo, 400×200 input | 400×200; no upscaling |
| Licensed T-shirt photo | Automatic Tops / T-shirt with production recognition worker |
| Reload, IndexedDB and search | Saved garment retained and found |
| Phone layout | Document width 390 pixels; viewport 390 pixels |
| Page errors | None |

Asymmetric synthetic JPEGs contain explicitly injected EXIF rotation tags. The test checks both dimensions and color positions after the production photo importer converts them. Recognition uses the existing licensed `commons-0002` photograph, not the synthetic images. Fixture attribution and the screenshot are included in the Actions artifact; no private user photographs are used.

The 166 existing Node tests also pass. Authentication is replaced only in the browser test with a synthetic local identity; production login, email delivery, physical camera hardware, HEIC support and real phone garment accuracy remain unverified. The existing Chromium camera flow continues separately.

Run `node scripts/build.mjs` and `node scripts/run-webkit-mobile-flow.mjs` after installing Playwright WebKit and placing the licensed fixture in `benchmark/photos`. The new workflow repeats this check on relevant main changes. Production interface, photo conversion, camera settings, recognition vectors and thresholds are unchanged. Drive Duel was not accessed or modified.
