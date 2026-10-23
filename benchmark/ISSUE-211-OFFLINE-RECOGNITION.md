# Issue 211 — offline source diagnostics and framing repair

Application base: PR #209 `972a50c8065ac4e5478c1e7fefdf740b2a654001`.
Separate branch: `work/issue-211-offline-recognition`; targets that development
candidate, never main. The central conversation owns integration/release.

## New measurements

`ISSUE-211-SOURCE-DIAGNOSTICS.json` contains per-source SHA, attribution/license,
manifest category/type, dimensions, trim bounds/fraction and raw RGB color estimate.
All 59 stored licensed fixtures decoded through Pillow at their full stored
resolution: width 360–1920, height 540–4258. All 59 original file hashes matched
before and after; decoded RGB was unchanged by diagnostic functions. These are
Commons fixture originals for this benchmark, sometimes resized thumbnails,
NOT proven native camera originals. Model text vectors remain SHA-256
`e1e0415f2272e81c0f3ce2f08fd5fd5c2a9eb6481437d696936c723e8e1abb2f`;
model revision `0f99955d944c39bfd9d035a02ac273c7a44a406b`.

| Manifest category | Sources |
|---|---:|
| Shoes | 20 |
| Dresses | 9 |
| Bottoms | 13 |
| Outerwear | 8 |
| Tops | 5 |
| Accessories | 1 |
| Nonclothing controls | 3 |

Color estimates require review on 43/59; remaining 16 are algorithmically
confident estimates, NOT validated correct colors. All 59 diagnostic rows retain
REVIEW disposition. Uniform-border trim activates on commons-0053 (30.82% area),
0062 (4.31%), 0086 (1.71%), 0087 (21.20%). No independent physical boundary truth
exists to establish whether pale hems, soles or garment edges were lost. Report
omits the pre-existing helper's unconditional `fullGarmentRetained:true` claim.
EXIF orientation is recorded; Python raw raster coordinates are not asserted to
match every browser's oriented display coordinates.

## Reproduced defect and narrow change

`prepareRecognitionPhoto` accepts integer diagnostic content sizes 128–336.
Odd sizes produced fractional offsets in the RGB destination buffer. This
silently loses image content (129px test expected [17,83,191] at 103,103 and
received white). Integer floor centering fixes this. A separate coordinate/pixel
oracle verifies six sizes: 129,255,287,319,335,336, every inside/outside pixel and
source immutability. Existing production sizes 336/320 are mathematically
unchanged. No category decision, threshold, crop bounds, palette or model changes.
This is a diagnostic correctness improvement, NOT an accuracy improvement claim.

Browser comparison script separately decodes all 59 SHA-locked originals and
compares baseline/candidate default and confirmation pixels in Chromium/WebKit
(118 comparisons per engine); external browser requests are aborted. New CI
also exercises existing synthetic mask color, native-resolution photo import,
account-switch isolation and inspiration original-photo transfer browser tests.
Local browser installation failed with invalid/truncated download archives;
browser status must be taken from exact-head CI, never assumed from unit tests.

## Repeated validation and independent truth

Baseline local full Node: 1,779 pass, 0 fail, 3 skip (1,782 total).
Candidate first full Node: 1,783 pass, 0 fail, 0 skip (1,783 total); Pillow is
available here, allowing the previously skipped Python-backed checks to execute.
See issue/PR for final repeat and exact-head CI. The negative test failed against
baseline before the one-line fix and passed afterward. Two pixel-diagnostic
passes must be byte-identical. CI repeats the complete Node suite twice.

No holdout labels were used to choose classifier thresholds. Existing manifests,
regression predictions and acceptance thresholds are untouched. The historical
admission audit is included only as a release veto/baseline reference: reviewed
26/32 broad categories, holdout 7/13 garments + 3/3 rejected controls, fresh 10/11.
Four historical wrong automatic subtypes remain; promotion stays BLOCKED.
These historical outputs are NOT current model inference or new validation.

No local FashionCLIP neural ONNX model/runtime cache is present; existing workers
fetch Transformers.js/model assets remotely. No fresh neural inference was run.
Missing two-reviewer whole-scene garment inventory/pixel masks prevents honest
physical object recall, mask IoU, false-positive segmentation or crop-fidelity
promotion. No speculative shoe/dress/skirt/shorts rule change is justified.
DeepFashion's missing shoe class cannot establish absence of footwear.

## Not measured and next handoff

Current per-source classifier correctness/subtype errors/unsafe auto-save rate,
true garment separation/overlap recall, physical mask IoU, independent color
accuracy, physical-phone image fidelity/latency, customer accuracy, faithful
virtual try-on and hosted account isolation are NOT measured here. Manifest
labels do not substitute for independent two-reviewer physical-item truth.
Next: supply independently adjudicated full-scene masks and inventory, preserve
untouched validation scenes, then warm rights-cleared model assets and repeat
inference offline. Inspect four trim cases without tuning on held-out labels.

No customer photographs, hosted writes, settings changes, AI API activation,
paid repair workflow, merge, deployment, Drive Duel edits or spending.
