# Closet Current — local mesh fidelity guard (October 19, 2026)

**Main-chat work**, independent of parallel Work mask-labeling research. Stacks on [draft PR #43](https://github.com/nickhaney916-lang/Closet-Current/pull/43), which consolidated source-guided boundary diagnostics, the conservative 12-photo HOLD baseline and customer recapture. Neither Work's PR #41 nor its separate branch has been altered.

## Observed risk and fix
The existing in-house 32-triangle browser mesh can return a perfectly valid PNG even if a future transform or rasterizer regression were to erase fabric or recolor central garment prints. A decoder integrity check catches corruption, not pixel-quality damage.

New `ClosetGarmentWarp.validateWarp(source,output,width,height)` in `public/local-garment-warp.js` accepts a **display-only** warp only when:
- Source and output contain correctly sized, bounded RGBA pixel arrays and meaningful visible source fabric.
- Integrated alpha mass does not change dramatically (allowed conservative output/source range **0.64–1.08**); significant garment deletion or unexplained newly opaque material is rejected.
- At least 98.5% of sufficiently opaque samples in the center of the garment preserve their alpha and color within tested tolerances. That center is deliberately identity-mapped in the current mesh to protect logos, prints, buttons and vertical seams.
- All checks pass before `putImageData`; if they fail, `warpTransparentImage` returns `null`, and the already-verified, intact transparent display cutout is used instead. No generated or invented pixels, no cloud processing, no new photo capture.

The check never rewrites the customer's original high-resolution source, classification, indexing or retained clothing catalog. It makes no physical fit or visual realism claim. There is no automatic change to the existing held-photo/mask-approval rules. Rejecting a **warp** is different from rejecting a garment: a valid original transparent cutout is preferable to a visibly damaged deformation.

## Evidence / known limitations
Pure Node tests exercise alpha preservation, central pattern/logo color damage, central seam/alpha damage, open jacket center transparency, invalid inputs and untouched source arrays. Browser emulation runs the guard in both Chromium Android and WebKit iPhone profiles alongside existing fixed-figure 4-garment/dress/retake/HOLD/privacy tests. The full Node regression suite and paid backend flags remain gated.

This protects against defined regressions, not subtle collar anatomy errors, thin dark trim removed during original masking, inaccurate layering shadows, physically believable fabric drape or customer-specific sizes. Independent full-garment mask labels, visual human assessments and commercial-ready high-resolution figure licenses are still missing. Three source-approved photos in earlier tests remain held for customer-facing try-on; **zero** real-photo try-on composites have been independently approved. Physical phone hardware has not been tested here.

No merge, deployment, purchase, billable inference, customer-photo upload, or Drive Duel changes.
