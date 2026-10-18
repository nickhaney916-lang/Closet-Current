# Independent garment mask review and color-sampling evaluation

**Internal QA workflow — not a customer screen.** Six licensed photo cases are listed in `benchmark/segmentation-review-manifest.json`. Category names, garment filenames, AI-predicted masks and overlays **are not** verified pixel ground truth.

## Process

1. Download the **canonical `commons-####.jpg`** from the offline review packet, matching the `image` field in `benchmark/segmentation-review-manifest.json`. Its SHA-256 must match the locked source; preserve the source attribution/license. The byte-identical `commons-####.original.jpg` is for archival traceability, **not** for selection in the annotation tool. The exporter records the photo filename, and a draft made from `.original.jpg` cannot be staged as a canonical reference.
2. **First reviewer:** open `benchmark/annotate-garment.html` locally, choose the photo, paint the **entire actual garment**, correcting cuffs, hems, soles, laces, attached straps, mannequin, fixtures and shadows. The predicted-mask upload is only an optional draft starting point. Enter your reviewer name and export the `*.mask.draft.json`. Draft files never count as ground truth.
3. **Second independent reviewer:** open `benchmark/approve-garment-mask.html`, choose the **same original photo** and the draft JSON, inspect the overlaid boundaries at multiple opacities and either reject for correction or enter a *different* reviewer name and check the independent-verification statement. Export the `*.mask.approved.json` only if it is genuinely correct. The tool checks filename, original photo SHA-256, dimensions, run length and distinct reviewer identities. It cannot attest to whether a human actually looked carefully; reviewers remain responsible for the quality.
4. After genuinely independent approval, from the repository root run:
   `node scripts/stage-approved-garment-masks.mjs <downloaded-review-packet-folder> <approved-mask.json> [more-approved-masks.json ...]`
   The photo folder must contain the original `commons-####.original.jpg` files from the GitHub Actions review packet, or the original `commons-####.jpg` files. This command checks the **actual original photo bytes** against the locked SHA-256 hashes; it rejects drafts, duplicate or already-approved cases, source mismatches, and the same reviewer under different capitalization. It writes reference JSONs under `benchmark/approved-reference-masks/` and a separate `benchmark/segmentation-review-manifest.candidate.json`. It **does not modify the active manifest** or deploy anything. If a candidate file already exists, it refuses to overwrite it: reconcile prior work by hand before proceeding. Once all independently reviewed evidence is inspected, intentionally promote the candidate manifest under version control (and include its referenced approval JSON files). Never treat an unreviewed or AI-generated prediction as approved.
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

## Native photo detail magnifier (internal review only)

Both the first-review editor and second-review approval screen contain linked detail views for the native source photograph and its smaller, editable overlay. Move or tap on the main photo, then choose 4× or 8× magnification to check sneaker toes, soles, laces, dress hems, cuffs and whether the outline accidentally includes skin, a mannequin or cast shadows. The native view uses the decoded original photo instead of enlarging a downsampled preview. Changing the zoom never paints a pixel, supplies a reviewer identity or marks an annotation as approved. A separate human still needs to examine the whole source and the outline before approval. This tool is never displayed to Closet Current customers.
