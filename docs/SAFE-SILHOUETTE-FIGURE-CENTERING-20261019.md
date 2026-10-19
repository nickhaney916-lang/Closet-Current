# Closet Current — approved-cutout silhouette centering

**October 19, 2026. Main chat; separate from Work's [PR #45](https://github.com/nickhaney916-lang/Closet-Current/pull/45).** This prototype stacks on main-chat [PR #44](https://github.com/nickhaney916-lang/Closet-Current/pull/44). No merges, deployments, purchases, paid generation, customer image uploads or changes to Drive Duel.

## Visual issue
We previously centered every *image rectangle* over a reusable figure's calibrated shoulder / waist slot. After safe alpha trim, asymmetric sleeves and uneven apparel silhouettes can still have a garment's visible upper midline offset from the image center. That misplaces the garment without any need for an additional AI generator.

## Conservative improvement
- New pure `ClosetGarmentFitGeometry.silhouetteAnchor` measures the median horizontal midline across multiple upper rows of an **already verified transparent cutout**. It rejects blank, invalid, too-small, highly inconsistent or unsupported-category silhouettes rather than guessing anatomy.
- `fitPlacement` optionally uses this **display-only** centerline, constrained to at most **6% of its calibrated body slot width** and never crossing slot boundaries. Shirts, bottoms, dresses and jackets retain their existing fixed shoulder/waist upper anchor, while shoes continue using the sole line without silhouette adjustment.
- The original high-resolution photo is still used for garment type/color indexing **before clipping**. Silhouette geometry is derived solely from a transient transparent display copy, and never changes source image RGB, pixels, ownership, or catalog data. No automatic pixel repair or hallucinated sleeves.
- The per-account, memory-bounded local preview cache now holds one optional finite center fraction with an already approved display PNG. Missing/invalid metadata preserves the existing behavior. It is cleared on owner changes/disposal.
- Work's [PR #45](https://github.com/nickhaney916-lang/Closet-Current/pull/45) independent full-mask quality evaluation remains a separate task. Its unresolved unapproved source-guided masks **are not** used by the customer-facing preview.

## Validation
Node tests cover asymmetric and inconsistent silhouette anchors, immutable original RGBA, capped and bounded repositioning, preserved aspect ratios, no movement for shoes, unchanged male/female calibration and local cache owner isolation. The full app's Android Chromium and iPhone WebKit **browser emulation** tests both reusable figures with a new asymmetric synthetic cutout; the evidence records a small positive horizontal correction and unchanged scale/vertical alignment, alongside the established multi-garment layering, paid-call zero, privacy, real-photo HOLD, recovery and warp-fidelity regressions.

This is a limited **visual alignment heuristic**, not a physically accurate pose estimate, true sleeve/neck detection, human-reviewed style quality, independent full-photo segmentation score or proof that the app surpasses commercial virtual try-on. Production figure image rights and actual physical Android/iPhone hardware are still open release gates.
