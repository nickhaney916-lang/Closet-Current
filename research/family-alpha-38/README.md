# Work 38 — manual-outline extraction feasibility, INCOMPLETE / HOLD

This research-only script constructs a full-native-size transparent PNG from a human-traced polygon and an exact SHA-256-bound licensed JPEG. It copies decoded source RGB unchanged and writes alpha only. It refuses mismatched source hashes, invalid polygon coordinates, source overwrite and existing output overwrite. It is not an automatic segmentation model, is not connected to the application or #332 review UI, and never approves the image. Polygon accuracy depends entirely on the person tracing it. It does not supply source identity in the application's review schema or integrate with outfit rendering.

## Real-photo test — commons-0043 skirt

The previously blocked CC0 Hiart skirt now has a manually traced candidate: [390px comparison](evidence/skirt-review.jpg). Source and licensing record: [Work 30 attribution](../../docs/evidence/family-alpha-30/ATTRIBUTION.md), [original source](https://commons.wikimedia.org/wiki/File:Woman%27s_summer_skirt_from_China,_Honolulu_Museum_of_Art_5152.1.JPG). The PNG is generated from the exact pinned source; original is unchanged. The photographic print and color remain recognizable. Review of the checkerboard preview shows small light/gray edge remnants, particularly around the hem; the hand trace may also remove fine edge fabric. **Grade REVIEW, not visually approved.** This is one newly generated proposal out of eight previously unavailable cases; it is not a verified usable/accepted recovery. There is no independent mask ground truth and no whole-mask accuracy measurement. Display evidence is a 390px offline image, not a browser or physical-phone screenshot.

Reproduce from repository root with Pillow installed:

```
python research/family-alpha-38/outline.py benchmark/fixtures/commons-0043.jpg research/family-alpha-38/skirt-outline.json /tmp/provisional-skirt.png
python -m unittest discover -s tests/research38 -v
node --test tests/family-alpha-30.test.mjs
```

Local results: 2 Python tests pass (source RGB equality, dimensions, transparency, hash/invalid polygon rejection, no overwrite) and 11 existing Work #30 Node tests pass. These do not prove edge correctness, user privacy, integration, WebKit or Chromium compatibility. The helper does not write the original; recognition/indexing code remains unchanged, but the complete workflow was not rerun.

## Previous 15-photo evidence and remaining blockers

[Work #33 gallery report](https://github.com/nickhaney916-lang/Closet-Current/blob/53f2ad344dc56a1477e343531c423aed0e66c17d/docs/FAMILY-ALPHA-33-REAL-VISUAL-GALLERY.md) examined seven provisional cutouts and eight unavailable. Those prior on-avatar judgments are not new extraction grades. Work #30's [source labels](../family-alpha-30/labels.json) and [results](../../docs/evidence/family-alpha-30/results.json) describe the entire cohort and probes; probes are not full masks.

| Previously unavailable | Observed obstacle | Current Work 38 |
| --- | --- | --- |
| 0003 long sleeves | mannequin and separate jeans | not rerun; manual garment boundary and occlusions require review |
| 0065 jacket | sleeve touches image boundary | not rerun; verify completeness and request retake if fabric is clipped |
| 0068 coat | outdoor background and hanger | not rerun; hanger and edges need review |
| 0043 skirt | mannequin waist, pale fabric and shadow | manual candidate REVIEW; edge corrections needed |
| 0033 shorts | worn with hands, shirt and legs | not rerun; occluded fabric cannot be reconstructed |
| 0021 pants | hands, shirt and shoes | not rerun; occluded fabric cannot be reconstructed |
| 0079 shoes | outdoor support/background | not rerun; extraction does not make a single shoe into a pair |
| 0059 dress | clutter and source edges clipped | not rerun; retake may be needed for missing garment |

The remaining seven earlier proposed cutouts have not been regraded by this spike. Do not interpret previous scene descriptions as independently proven causes in every case. Reflective/transparent edges and object-fabric contact are not solved by a polygon. Do not automatically erase skin colors or invent hidden fabric. Work #332's manual eraser is a separate existing implementation; it was inspected but not reused or modified here.

## Missing before completion

Rerun all 15 using a source-bound interactive foreground/background refinement, compare with prior masks, inspect boundaries at full resolution, provide honest grades and browser screenshots, test #332 manual cleanup and renderer compatibility, verify originals and account/session provenance, and run full Chromium/WebKit and outfit regression. In particular, the current polygon is not a replacement for automatic isolation and does not demonstrate a general reduction in manual effort. No avatar, fitting, recommendation, recognition or staging code was changed. Family Alpha remains HOLD.
