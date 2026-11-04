# Priority 1 — Real photographic A/B test

The same existing production SegFormer garment model is run on three independent, source-verified photographs: a worn dress, jeans, and standalone sneakers (`validation-0001`, `validation-0017`, `validation-0019`).

The benchmark exports panels of **untouched RGB recognition crop**, **prior white-background display cutout**, and **display cutout with tiny hole repair** for each detected clothing region. It compares actual native original RGB source pixels and measures changed displayed channels, enclosed holes and repaired coarse mask pixels, including zero-difference cases. We never claim a visual improvement when no repair occurs.

No new model is downloaded by the customer. This extra inference is **GitHub Actions testing only**, using the same model and revision already present in `public/outfit-worker.mjs`. This is not evidence that other 10% of a partially clipped garment can be reconstructed, and not a pixel-accuracy benchmark without independently annotated garment boundary masks.

Priority 1 acceptance is engineering safety: no fabric lost from the original source, no alteration to recognition crop, small-source-supported display-only gap fills, build and regression green. Large normalization/reconstruction is tracked as Priority 2.
