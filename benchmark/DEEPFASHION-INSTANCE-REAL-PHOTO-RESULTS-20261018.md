# Verified two-photo DeepFashion2 instance mask review

The first model-backed, source-verified trial decoded actual ONNX instance
masks (not boxes or simulated masks), using the Apache-2.0 pinned checkpoint.

**validation-0031, worn blazer with black skirt:** 2 model proposals,
`long_sleeve_top` (confidence .685, 50,845 original-photo pixels) and
`skirt` (.238, 47,200 original-photo pixels). Visual review: the skirt
mask includes appreciably more fabric than the prior LIP mask, but some
silhouette edges are still wrong and the blazer is misnamed a top. The
model does not include a shoes class. No true segmentation recall or
on-device quality has been established.

**commons-0059, flat-laid dress and jacket:** 7 proposals, including
overlapping dress and top classifications on apparently the same fabric.
Some proposals cover huge sections of the same garment; others cover
individual sleeves. Treating these as seven distinct owned items would
be wrong. This experiment now reports substantial pairwise IoU and
nested/containment mask overlaps as **human review conflicts**,
without merging actual layered garments automatically.

Observed ONNX inference was 33–34 ms per photo on GitHub CPU, not including
download, preprocessing, postprocessing, real phone performance or cloud
costs. Independent hand-approved pixel masks and category-wise precision /
recall are still required. Original source RGB unchanged. All candidate
inventory counts and production approval remain zero.
