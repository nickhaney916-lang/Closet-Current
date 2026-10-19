# Closet Current — conservative local cutout-edge finishing

October 19, 2026. **Main coordination chat** on a new draft development branch stacked on [PR #46](https://github.com/nickhaney916-lang/Closet-Current/pull/46); independent Work session's real-photo mask evidence [PR #45](https://github.com/nickhaney916-lang/Closet-Current/pull/45) is untouched.

## Why

A garment cutout approved by the existing conservative alpha/white-background workflow can have a perfectly hard, binary-alpha edge. When resized and locally warped onto either fixed model, those boundaries can appear jagged even when RGB colors, print, zipper and buttons are faithfully preserved. This is a **display-only finishing step**, not an extraction or garment generation algorithm.

## Safeguards

- `public/local-garment-edge-finish.js` operates **only after** the existing preview's transparent cutout approval and crop. It does not run on a raw photo and cannot convert a held dark-studio proposal into an approved mask. Full-resolution original classification and indexing remain before clipping.
- Require both substantial transparent pixels and opaque garment pixels; automatically skip any image that already contains even one intentionally translucent alpha value. Native soft-alpha cuffs and hems are preserved unchanged.
- Identify a conservative subset of hard edges: fully opaque pixels with 2–4 transparent neighbors and at least 4 opaque neighbors. Set only their **display-copy alpha** from 255 to 232, leaving every RGB byte untouched. Skip isolated fibers, missing garments, ambiguous alpha and unexpected image sizes.
- Reject any proposal whose visible opacity loss would exceed **1%** of all opaque source pixels. No RGB recoloring, alpha increase, invented material or editing of closet source files.
- If finishing cannot run, preserve the already-accepted transparent cutout. Existing 32-triangle warp, its center-print/alpha safeguards and bounded centerline alignment are unchanged. Cached previews are still private/account-scoped and transient.

## Verification

Focused Node tests check source-byte immutability, intact RGB prints, partial-alpha preserving skip, bounded alpha mass loss, no material generation, and safety-gate integration. The Playwright Chromium/Android and WebKit/iPhone **emulations** run the same synthetic transparent garment probe, existing 4-layer and dress scenes on both models, initial selected-garment recognition provenance, licensing hold/photo retrieval and local selfie isolation.

**Not proven:** independent visual-quality improvement judged by people, correct real-photo clothing extraction (still 0 approved full masks in Work PR #45), commercially cleared high-resolution figure assets, physically accurate fabric drape or actual hardware behavior. The 1-pixel boundary polish cannot fix an incorrectly clipped sleeve, black fabric against black background, or model alignment for different customer sizes.

No merge, deploy, paid model activation, new billing, external customer-photo uploads, figure purchases, or Drive Duel changes.
