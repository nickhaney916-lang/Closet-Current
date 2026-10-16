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
