# Confidence sensitivity: garment versus body exclusion

**Study type:** offline comparative experiment on verified real photos. The strict
SegFormer semantic argmax body veto, original high-resolution RGB, classifier,
and current application are unchanged.

The object/garment hybrid can misclassify original clothing pixels as exposed
skin or mannequin. The existing `protectedBodyFromLogits` treats any winning
body label as definitive even if it barely beats a clothing class. For a new
review-only candidate, we protect body pixels only when the softmax probability
is at least 0.80 and the probability margin over the runner-up is at least 0.25.

Five verified source images produce a side-by-side comparison:
1. Original image.
2. Strict baseline (current experimental hybrid).
3. Confidence sensitivity (can reveal missing clothing, **or** admit skin).

For each, `alternatePixelsPotentiallyRestored` is **not** accuracy, recall or
true garment pixels: it includes unknown body/background. The new alternative
never deletes any pixel already retained by the strict baseline, but this
alone does not establish semantic correctness. Per-source synthetic assertions
test that the strict baseline is unchanged.

Promotion remains blocked until independent garment-only masks for real
photos, actual person/mannequin contamination review, mobile speed and memory
testing, and explicit owner approval. The experimental comparison changes
neither production, Closet Current classification/indexing nor Drive Duel.
No paid service activated.
