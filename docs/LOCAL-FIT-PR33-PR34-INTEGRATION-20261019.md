# Integration checkpoint — PR #33 + PR #34, no paid generation

**October 19, 2026 — draft only.** This line is branched from PR #33's tested `ec32f777` rather than directly changing PR #33 or PR #34. The original central conversation coordinates both lines.

## Why integration was necessary
Two independent same-parent drafts addressed different flaws:
- [PR #33](https://github.com/nickhaney916-lang/Closet-Current/pull/33): separate male/female shoulder/hip placement, short garment hems, preserves semi-transparent cuffs and central garment prints, protects neckline ambiguity, inverse bilinear sampling avoids cracks, optional adjustable local-only selfie, three SHA-pinned licensed original-photo HOLD cases.
- [PR #34](https://github.com/nickhaney916-lang/Closet-Current/pull/34): avoids CSS deforming an entire cropped garment into a fixed-size rectangular box; preserves width/height ratio and vertical anchoring.

Simply replacing PR #33 with PR #34 would **regress** soft cuffs/central seams, male/female figure calibration, local selfie controls and licensed real-photo HOLD evidence. This integration retains PR #33's source, matte, mesh and selfie logic while adding **only a pure aspect-ratio placement step**.

## Specific implementation
- `public/garment-fit-geometry.js`: pure local function validates crop size and slot/category, centers the garment inside the calibrated body rect without CSS stretching; holds waistband/collar at top and shoe soles at bottom. Does not promise anatomical landmarks or fit.
- `public/reusable-figure-preview.js`: PR #33's `alphaBounds` preserves every nonzero alpha pixel; the display crop now also returns its width/height for aspect fitting. Retains PR #33's 600k-pixel trusted native-alpha path and 150k conservative white-matte branch with suspicious-neck veto. PR #33's inverse sampling / faint-alpha handling and positionable selfie remain unchanged.
- Preview inputs are transient. Full-resolution originals are used for indexing **before masking** and are not reclassified or overwritten by display warps.
- Existing browser harness now asserts shirt/trousers rendering aspect ratio, original source integrity, independent male/female selection, ephemeral selfie controls, hidden paid UI, zero remote writes, and three real licensed source **rejections**, not real-photo fit successes.

## Known quality blockers
- Both fixed preview figure assets are just 160×297; rights/licensing of full-resolution production figures are not validated.
- Upper body occlusion, fabric shadows, sleeves and neck/body integration are not realistic yet. Generic warp rectangles are **not real sleeve/waist landmark detection**.
- Commercial-model comparison is not supported by our evidence. Real accepted garments, real physical Android/iPhone QA and blinded reviewer preference study are missing.
- Rejection of ambiguous raw source photographs protects customer trust but can result in a sparse preview; do not silently show opaque white backgrounds as worn clothes.

## Release restrictions
Do not merge/deploy, purchase licenses, activate paid image inference, upload any user selfie/photo, change Drive Duel or claim actual phone testing. The provider backend's activation constants remain false. This is a no-cost engineering consolidation and the competing drafts remain unmodified.
