# RECOGNITION-CATEGORY-COLOR-39

Research only. Scientific verdict **NEEDS REWORK**. Family Alpha #255 HOLD.

Starting source is PR #595 at `a299f9f956fff7cd2045ae5faf0afa86bdc7b669`. This experiment leaves the recognition, save, source and owner code at that version.

## Paired color experiment

`color-manifest.json` selects 35 distinct fixture JPEGs whose bytes match the color registry from PR #580 at `abb5e37`. It retains the registry's author, license, source URL, SHA-256, provisional color label and partition. These are archived renditions. None is claimed to be the upstream camera original. This cohort has 19 development rows and 16 inherited holdout rows. An assistant selected rectangular garment areas visually before measuring either arm, with labels visible. The cohort is neither independently human-certified nor a fresh locked acceptance sample. Interior rectangles can underrepresent patterns, trim and secondary colors.

Both arms decode the same bytes. The baseline uses the production color function on a 16×16 Sharp scene sample. The candidate uses the existing mask-aware pixel tally on a 48×48 garment rectangle and always requires review. The comparison tests the paired effect of region and sampling changes, not a new classifier, and Sharp resampling is separate from the browser check.

| Split | Baseline correct | Region suggestion correct | Baseline automatic correct / accepted |
| --- | ---: | ---: | ---: |
| Development | 6/19 | 11/19 | 3/5 |
| Inherited holdout | 5/16 | 7/16 | 4/9 |

Candidate automatic coverage is zero by design. Its automatic precision is undefined. These results do not justify integrating the candidate into wardrobe saves. The report contains both confusion matrices and per-image outputs. The sample does not cover the full requested color palette, and it does not test mask quality, true secondary color, or user approval. For example, candidate output still labels the Green target commons-0041 as Gray and the Multicolor target validation-0001 as Red.

## Reproduction

Use the pinned dependencies in the dedicated no-deploy workflow. Run from the repository root.

```sh
node scripts/build.mjs
node --test tests/*.test.cjs tests/*.test.mjs
node research/recognition-category-color-39/compare-color.mjs
node research/recognition-category-color-39/browser-color.mjs
```

The browser runner uses actual JPEG decode, SHA verification and pixel-based color computation in Chromium and WebKit at 320, 390 and 430 CSS pixels. It records palette latency and verifies screenshot dimensions, hash and pixel variance. This isolated page does not run the FashionCLIP worker or save records. It does not test physical Android or iPhone. The workflow separately attempts the inherited genuine FashionCLIP baseline on the 16-photo garment/control cohort. PR #570 reported 8/13 categories, 4/7 correct auto-accepted subtypes and 3/3 negative rejections on that cohort. Those figures belong to PR #570; the two studies overlap in source photos and their sample sizes cannot be added.

No classification candidate, independent label certification, full private indexing acceptance, or release recommendation is supplied by the paired experiment.
