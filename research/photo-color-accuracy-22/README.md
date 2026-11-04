# PHOTO-COLOR-ACCURACY-22

Work #28. Baseline and only parent is PR #578 at `876b680272b6e2c40be24410a14b92802bdf991b`, exact no-deploy run 41868815069. Family Alpha #255 remains HOLD. This stack has no dependency on changes in Work #25–27.

## Source audit

| Path | Actual behavior and defect boundary |
| --- | --- |
| `public/photo-check.js` | Decodes an Image with a timeout and uses a 16×16 canvas for flat-image and visual-signature checks. Baseline color also uses this small scene sample. JPEG color management and resampling can vary between browsers. |
| `public/photo-color.js` | RGB families use value, saturation and hue cutoffs. The central 60% of the 16×16 image contributes opaque pixels. The leading family needs 0.78 chromatic or 0.90 neutral support and three quadrant winners for a single-color automatic result. Strong chromatic mixtures have a separate Multicolor path. The confidence is a pixel share, not a calibrated garment probability. |
| `public/outfit-segmentation.mjs`, `public/outfit-worker.mjs`, crop editor | A garment isolation mask can produce an alpha-aware sample for `maskedPalette`; low alpha is dropped. Outfit worker passes supported primary and secondary colors to review. A crop without a mask still contains scene pixels. These paths are separate from the new scene heuristic. |
| `public/clothing-details.js`, `public/app.js` | `fillColor` rejects review-only or invalid guesses and honors user color authority including deliberate blanks. Recognition detail filling has a separate source and must also preserve user values. Import, review, crop and recognition pass through these paths. The indexed record's `color` drives closet views and outfit filtering. |
| Storage and outfit research | The estimator emits the existing color, source, support and confirmation shape. The garment records, owner scoping, styling and backup schemas are untouched. Existing integration regressions exercise their contracts. |

The development split confirmed several different problems. `commons-0088` was Multicolor from a black boot on a studio backdrop. `commons-0064` was Blue for a gray-blue jacket under a provisional Gray label. Aggressive background removal promoted the orange lining, so it is unsafe to replace a reasonably specific existing review suggestion. `commons-0040` and `commons-0069` lost their correct provisional Multicolor label in the first aggressive trial. `commons-0035` was Brown for visually orange shorts, a remaining hue/value ambiguity. The benchmark does not attribute differences to white balance or skin without a controlled comparison.

## Frozen evaluation

Each image has one target garment, including scenes that show other garments. Visually annotate the target primary color before inspecting estimates. Record salient secondary colors, pattern, scene and garment type. A camera rendition cannot establish physical dye color. Near-tied or difficult palette labels remain ambiguous. The single assistant reviewer labeled public images without using model predictions. Human-certified labels count zero.

The frozen source registry distinguishes full downloaded originals, archived direct-source JPEGs, and unchanged archived Wikimedia renditions. No lower-resolution file silently replaces an original. Exact duplicate SHA values are rejected, and visually identified alternate views plus nonphotographic or non-garment controls are excluded. Original or archived test bytes are immutable. Full-source failures are recorded separately. Each paired browser arm receives exactly the same verified JPEG bytes. The full original subset and archived renditions are sliced separately in the report.

The app still computes its 16×16 signature and initial estimate. A second 48×48 scene view looks for a coherent border color on at least three edges. Only pixels near that color connected to a border are removed from the central tally. Remaining color needs 0.72 support and a 0.12 lead after removal of at least 12% of central samples. A changed estimate stays review-only. This is background evidence and does not supply a garment mask. Uniform, sparse and inconclusive samples fall back to the baseline.

The initial broad development-only variant went from 9/24 to 8/24 provisional correct and 3/3 to 1/3 on Multicolor. The final rule was chosen on the development split to avoid accepting that tradeoff. The holdout labels were not changed. Per-photo results and source kinds are in the workflow report; the audit checks counts, per-source SHA, paired statistics, local manual replay and screenshot hashes.

## Reproduction

Install Playwright 1.56.1, Sharp 0.34.3 and the dependencies specified in the dedicated workflow. Run the build and full Node suite, then run:

```sh
node research/photo-color-accuracy-22/run.mjs
node research/photo-color-accuracy-22/audit.mjs
```

Set `COLOR22_ORIGINALS` to a directory containing the locked full-source JPEGs named by benchmark ID when upstream is unavailable. The script validates file hashes, byte counts and dimensions before a real Chromium or WebKit decoder handles the image. Review persistence is a localhost isolated localStorage fixture using actual shared ClothingDetails functions. The run neither contacts cloud storage nor uploads a photograph. The 320/390/430 CSS widths are browser emulation.

## Release limits

The 95% proposed pilot threshold concerns combined category and primary color among automatically accepted results on a fresh independently validated set. This study supplies provisional labels and color-only acceptance through the photo estimate path. The category model, separate recognition-provided color fields, real SegFormer masks, physical phones, signed RLS and Work #27's complete consumer flow are outside this evidence.
