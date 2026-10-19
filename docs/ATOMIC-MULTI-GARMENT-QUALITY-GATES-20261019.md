# Closet Current — multi-layer preview quality gates (October 19, 2026)

## Branch scope
This isolated stacked draft is based on [PR #36](https://github.com/nickhaney916-lang/Closet-Current/pull/36), keeping unchanged all local masking/warping, exact-two-figure, per-account caching, temporary face overlay, and original-high-resolution-before-clipping recognition decisions.

## What changed
- **Fail-closed image publication**: transform a garment into a display-only transparent PNG, verify it decodes and has the exact cropped dimensions used to calculate aspect-preserving placement. Only then place it into the atomic outfit and retain it in the in-memory LRU. Invalid or corrupt preview images count as **held**, not displayed. A later selection can retry the source without finding a poisoned cached result.
- **Two real browser engines, synthetic fixture scenarios**: Android Chromium and iPhone WebKit emulations render (1) a top, bottoms, open jacket with a transparent center, and shoes, then (2) a dress plus shoes, **on each of the two standard figures**. Save screenshots of these exact synthetic outputs as CI artifacts for visual review. The test checks expected draw order and that the open-jacket center remains transparent rather than obscuring the underlying shirt. A deliberately failed final image-decode must not publish a broken layer, and a retry must recover.
- Maintain the existing SHA-pinned licensed real garment photo **HOLD** tests unchanged, plus zero external POST, ephemeral selfie removal, no stale image rollback and unchanged owned source/photo data.

## What is and is not proven
Browser-layer order, no malformed preview objects and intact alpha center **are testable**; attractive fabric drape, photographic realism, real clothing-sleeve anatomy or market parity **are not proven** by synthetic screenshots. The real-photo benchmark in PR #37 still has 12 held images, no independently accepted real garment composites; both current 160×297 figure previews require commercial licensing and full-resolution replacements before launch. Neither screenshot tests nor model-layout asserts establish physical iPhone/Android performance.

No merging, deployments, customer-photo uploads, paid AI image generation, figure purchase, or Drive Duel changes were performed.
