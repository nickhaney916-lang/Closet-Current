# Object cutout comparison — October 17, 2026

Code: `8415731821660b2f813ce2515d812c1fbe163ca9` on PR #7. Run: https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39049745869 . Artifact: `12107740118`, `experimental-object-cutout-comparison`.

## Result and interpretation

BiRefNet Lite is the strongest **visual candidate in this six-photo comparison** for the remaining MODNet defects. Preserve sharp MODNet 128 as the recorded user-selected reference. This experiment does not replace production or claim independently measured segmentation accuracy.

| Photo | Visual comparison with sharp MODNet 128 | Remaining issue |
| --- | --- | --- |
| Shorts 0035 | Both obvious internal holes and missing outer fabric are restored; detached lower fixture disappears | Hanger, support and price tag remain |
| Beige dress 0049 | Comparable overall silhouette and preserved clothing detail at review resolution | Mannequin neck remains; fine edges need independent review |
| Black dress 0053 | Comparable overall silhouette and preserved clothing detail at review resolution | Mannequin remains |
| Jacket 0065 | Chest hole restored and pale background extension below sleeve removed | Fine lace/fringe retention still needs native-resolution reference review |
| Sneakers 0079 | Attached ground shadow and ground extension visibly removed; main shoe outlines retained | Soles/laces require independent boundary validation |
| Boot 0094 | Detached pale patches below sole removed; main boot silhouette retained | Fine edge retention requires independent boundary validation |

These are observations on rendered comparisons, not ground-truth masks. Added/removed-pixel counts in summary.json are model disagreement, not garment recovery or shadow accuracy percentages. All six files were visually inspected.

## Reproducibility and validation

- Candidate: `onnx-community/BiRefNet_lite-ONNX`, revision `de15b22ba131738a16dff04aab8bdf8dc32e3ac1`, fp32 on Node CPU. Native model preprocessing is 1024 × 1024; output masks are resized to each original image's dimensions.
- Original photograph checksums are verified against the existing six-photo manifest. Both comparisons use binary alpha threshold 128 and original RGB; no feathering or generated replacement texture.
- Per-image inference plus output-mask resize took 9,054–9,588 ms; model/processor load took 4,412 ms in this CI run. This is not phone/browser performance.
- Fifteen focused tests passed locally. Camera/indexing, mobile persistence, real segmentation, and complete experimental comparison workflows passed on the experiment commit.
- The initial Node run rejected the browser-style data URL; the corrected runner reads the verified local file. The comparison helper also fixed a benchmark RLE decoder boundary: a foreground-first alternating mask can validly contain N+1 runs, including the initial zero-length background run.
- No app runtime, model-selection default, authentication or deployment changes.

## Next work

1. Validate this candidate on additional, unseen garment/phone photos before drawing general accuracy conclusions.
2. Measure browser/mobile loading, memory and inference speed; server timings do not establish a viable point-and-click phone experience.
3. Evaluate clothing-only separation of hangers, tags and mannequins without reintroducing SegFormer's substantial footwear omissions.
4. Keep pixel-accuracy and production promotion gated on independently reviewed boundaries and real phone evidence.

The 5% enclosed-gap-budget probe restored the larger shorts hole (48,199 added pixels versus 11,075 at 2%), with the other five results unchanged. That probe did not change the default 2% limit and did not address shadows; the object-model comparison is the more promising follow-up.

## Model sources

Model card and documented inference interface: https://huggingface.co/onnx-community/BiRefNet_lite-ONNX . The model repository labels the license MIT. Pinned configuration: https://huggingface.co/onnx-community/BiRefNet_lite-ONNX/blob/de15b22ba131738a16dff04aab8bdf8dc32e3ac1/preprocessor_config.json . Photograph attribution and licenses remain in `benchmark/locked-photo-sources.json` and are included with the exported comparison pack.
