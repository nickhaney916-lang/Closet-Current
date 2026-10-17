# Independent garment mask review and color-sampling evaluation

**Internal QA workflow — not a customer screen.** Six licensed photo cases are listed in `benchmark/segmentation-review-manifest.json`. Category names, garment filenames, AI-predicted masks and overlays **are not** verified pixel ground truth.

## Process

1. Use the original photo from `benchmark/locked-photo-sources.json`, verified against its SHA-256 hash. Save it locally; preserve the source attribution/license.
2. **First reviewer:** open `benchmark/annotate-garment.html` locally, choose the photo, paint the **entire actual garment**, correcting cuffs, hems, soles, laces, attached straps, mannequin, fixtures and shadows. The predicted-mask upload is only an optional draft starting point. Enter your reviewer name and export the `*.mask.draft.json`. Draft files never count as ground truth.
3. **Second independent reviewer:** open `benchmark/approve-garment-mask.html`, choose the **same original photo** and the draft JSON, inspect the overlaid boundaries at multiple opacities and either reject for correction or enter a *different* reviewer name and check the independent-verification statement. Export the `*.mask.approved.json` only if it is genuinely correct. The tool checks filename, original photo SHA-256, dimensions, run length and distinct reviewer identities. It cannot attest to whether a human actually looked carefully; reviewers remain responsible for the quality.
4. Once approved, store the JSON somewhere accessible to the benchmark and update **only its matching manifest case** with `referenceMask` pointing to that file and `reviewStatus: "approved"`. Do not change the verified image hash or mark any still-unreviewed reference as approved.
5. Run `node scripts/run-real-segmentation-benchmark.mjs benchmark/segmentation-predictions` with the six verified images in `benchmark/photos/`. The runner evaluates reference masks only if both reviews are complete and source identities match. It reports pixel-level segmentation precision/recall, plus the background contamination and actual garment pixels lost by the interior-only color-sampling region.
6. Compare the approved scores and predicted-vs-reference overlays. Reject a "cleaner" mask if the gain from removing scenery comes at the cost of lost cuffs, soles, hems or fabric patterns. No model change should be promoted from these six images alone: use additional held-out real-phone photos.

## Interpreting scores

- `full.foregroundPrecision` is the fraction of sampled full-mask pixels inside a *human-approved* garment outline.
- `interior.foregroundPrecision` is the same fraction after removing the outer one-model-pixel mask ring.
- `backgroundPixelsRemoved` is ground-truth background excluded by the interior sample.
- `garmentPixelsRemoved` and `additionalGarmentMissRate` quantify genuine fabric thrown away by that exclusion.
- These are **mask-label metrics**, **not** independent RGB/color correctness. Orange-versus-brown classification remains a separate issue.
- When references are absent, the report explicitly outputs `status: "unscored-incomplete-references"`, null aggregate scores and a count of pending references. Never interpret an AI-mask comparison as verified accuracy.

The experiment must remain on [draft PR #7](https://github.com/nickhaney916-lang/Closet-Current/pull/7) until independently reviewed evidence and device testing justify merging. No changes are required in Drive Duel.
