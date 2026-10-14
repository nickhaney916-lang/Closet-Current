# Dress and shoe subtype experiments

Measured October 14, 2026 against production baseline `4ba0f31d4fe899e59efff4beb6d3e7da11324909`. Decision: retain the production recognizer. None of the eight candidates safely improved recognition. Camera resolution, photo preprocessing, confidence gates, interface and production vectors are unchanged. Drive Duel was not accessed or modified.

## Measured comparisons

All candidates used the original 32 reviewed photos, the additional 16-photo regression set (13 garments and three nonclothing images), and the 11 fresh photos. Baselines were repeated in each run. All 649 individual inference jobs completed without runtime errors. These sets are now tuning/regression data, not independent validation of future changes or population accuracy estimates.

| Candidate | Original category matches | Original accepted subtype matches | Per-photo regression failures across 59 |
| --- | ---: | ---: | ---: |
| Baseline | 26/32 | 24/32 | 0 |
| All shoe descriptions, 25% blend | 25/32 | 23/32 | 6 |
| All shoe descriptions, 50% blend | 25/32 | 23/32 | 6 |
| Dress/tunic descriptions, 25% blend | 25/32 | 24/32 | 1 |
| Dress/tunic descriptions, 50% blend | 25/32 | 24/32 | 2 |
| Combined descriptions, 25% blend | 24/32 | 23/32 | 7 |
| Strict original-view dress recovery | 26/32 | 24/32 | 0 |
| Sneakers only, 25% blend | 26/32 | 24/32 | 3 |
| Sneakers only, 50% blend | 26/32 | 24/32 | 3 |

Failures count individual assertions, not unique photographs: losing a previously correct automatic result can fail category, subtype and automatic-indexing checks. The dress recovery passed safety checks but added no recognition benefit, so its additional inference work was not promoted. The production recognizer continues its existing top-only recovery.

The broad shoe trials recovered sneaker `commons-0083` but lost boot results `commons-0087` and `commons-0093`. Isolating the sneaker vector still recovered `commons-0083` while losing `commons-0087`, leaving aggregate category and subtype accuracy unchanged. Per-photo checks correctly rejected that exchange.

The additional set baseline remains 7/13 correct garment categories and 3/13 accepted subtypes; the fresh set remains 10/11 categories and 9/11 accepted subtypes. Dress-half reduced additional-set categories to 6/13; other candidates retained the baseline counts there. All three nonclothing images remained rejected in every run. Existing annotated subtype mismatches remain visible; labels and accepted-type annotations were not changed to improve scores.

## Evidence and reproduction

- [Five description candidates plus baseline](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38573182735).
- [Strict dress recovery versus baseline](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38574649758); the candidate engine and focused safety tests are preserved in experiment commit `d0865df` on `recognition/subtype-validation` history.
- [Two isolated sneaker candidates plus baseline](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38575055496).
- `benchmark/subtype-experiment-results.json` preserves full reported metrics and per-photo regression failures beyond the temporary Actions artifact retention period.

The comparison runner uses the pinned ONNX text encoder, canonical-first descriptions and normalized blends of 25% or 50%. Only the specified subtype vector rows are replaced; no thresholds or labels change. It restores original production assets in a finally block and never promotes candidates itself. Run `node scripts/compare-recognition-subtypes.mjs` for the broad description sweep, or set `SUBTYPE_FOCUS=sneakers` for the isolated trial. It requires the dependencies in `scripts/recognition-requirements.txt`, Playwright Chromium, and the licensed fixture photos used by the workflow. Set `RECOGNITION_PYTHON` when using a separate Python environment.

## Next useful work

Expand validation with ordinary phone photos of dresses, long tops, sneakers and boots in varied backgrounds, rather than continuing to tune the same small catalog set. Inspect subtype ambiguity and garment framing on those examples before changing prompts or crops. Physical-phone capture, scanner speed and production-login validation remain open. Preserve category-only review and strict agreement gates while that evidence is gathered.
