# Garment reference annotation review

Open `benchmark/annotate-garment.html` in a browser (download it alongside verified images from the locked photo set). Choose a photo, mark all garment pixels, erase accidental selections, and export the **draft** JSON. This is an internal annotation tool, **not a consumer feature**.

The six review cases are listed in `benchmark/segmentation-review-manifest.json`. Retain the original source file and verify its SHA-256 against the manifest before creating a reference. Review both thin details and difficult backgrounds at full display magnification. An independent second reviewer must validate the mask, confirm the correct photo identity, dimensions, and exact boundary, and explicitly approve the annotation before any benchmark uses it.

The exported `*.mask.draft.json` is **not** ground truth. Never calculate published segmentation accuracy from draft or model-generated masks. The current metric module `benchmark/garment-mask-metrics.mjs` supports independent binary reference-mask scoring with recall, precision, IoU, and background contamination. Do not replace source images, overwrite the production masking code, or merge an experimental method based only on synthetic shapes.

The editor downsamples large images to at most 768 pixels on the longest side to make human annotation manageable. Reference masks and model predictions must be compared at matching dimensions using documented nearest-neighbor mask resizing, not image interpolation. This editor does not perform that comparison itself.

## Approval metadata required for scoring

An annotation remains a **draft** until a second person confirms its outline against the original source and adds the following fields to the exported JSON:

- `sourceSha256`: the exact verified SHA-256 from the matching review-manifest case.
- `reviewer`: identifier of the person who drew the outline.
- `approvedBy`: a **different** person's identifier after checking the outline.
- `reviewStatus`: `approved` only after independent review.

The `image` filename must match the manifest exactly. Use `approvedReferenceMask(annotation, manifestCase)` to validate and decode it before scoring. Drafts, wrong sources, self-approval, and all-empty/all-filled masks are rejected. The editor does not automatically approve annotations.

## Independent garment/shadow comparison (experimental)

Use the separate internal outline editor `benchmark/annotate-shadow-polygons.html` to trace **garment** and **cast-shadow** polygons from the verified source photograph. Export remains a draft. A second reviewer must check the source image, outline edges, and labels, then supply **distinct** `reviewer` and `approvedBy` identities and explicitly set `reviewStatus: "approved"`. Reviewer names and approval statuses must never be invented or inferred by a model.

Only after approved garment and shadow polygons are available, compare a baseline mask and a proposed mask at identical native dimensions:

```sh
node scripts/evaluate-reviewed-shadow-comparison.mjs commons-0079 \
  benchmark/annotations/commons-0079-approved.json \
  benchmark/modnet-predictions/commons-0079.modnet-prediction.json \
  /path/to/experimental-candidate-mask.json
```

The command rejects unapproved or self-approved outlines, mismatched image identities, overlapping reference regions, and invalid masks. It calculates pixel-level garment retention, shadow removal rate, and background contamination without changing the original image, approved reference, or prediction.

**The command cannot establish that a candidate is safe without real independent ground truth.** An automated test passing with synthetic reference polygons is a code-correctness test, not measured garment-removal accuracy. No production crop or shadow algorithm is authorized by the comparison command.
