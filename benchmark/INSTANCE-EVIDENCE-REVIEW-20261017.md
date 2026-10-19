# Closet Current — garment instance separation validation

**Scope:** isolated experiment in PR #7. This adds an *instance evidence contract* and real-photo diagnostics, not a production-ready item splitter.

The existing SegFormer clothing segmenter recognizes pixel categories (upper garment, skirt, pants, dress, shoes). It does not produce distinct shirt/jacket object IDs or separate pants/shorts. A disconnected section of one class can be a sleeve or a lace rather than a second piece. Even if the garment is clearly separate to a human, a connected semantic region cannot prove which visible pixels belong to which physical item.

New `benchmark/garment-instance-evidence.mjs`:
- Extracts **connected-component diagnostics** and bounding regions from actual semantic model output. It never treats fragment count as item count.
- Validates any *future independent instance model's* binary masks against photo SHA, dimensions, semantic class, type compatibility, pixel coverage and confidence.
- Rejects substantial pixel overlaps, mask speckles and incorrect classes; stores no automatic wardrobe entries, never overwrites source image.
- **Important:** geometrically distinct masks are *review candidates only*. Independent annotated truth must confirm physical garment identity and boundaries.

A new GitHub workflow uses eight previously licensed, hash-locked photos to record class fragmentation and especially the `commons-0059` dress-and-jacket failure. If no separate instance masks exist it accurately records **0 verified physical instances**, not a fabricated improvement.

Next: evaluate an actual garment instance segmentation detector capable of separating overlapping garments, on independent, ground-truth annotated images and representative mobile photos. Measure per-category error and phone latency before production.
