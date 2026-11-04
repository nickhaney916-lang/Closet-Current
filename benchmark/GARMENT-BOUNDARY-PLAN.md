# Closet Current — Garment extraction improvement plan

Status: experimental. Production segmentation unchanged.

## Observed defects
1. Real cast shadows remain on the floor or background beside and below items.
2. MODNet foreground regions sometimes extend into background, as if attached to the garment.
3. Binary cutout edges appear jagged; conservative inside-edge feathering was visually preferred.
4. Sparse bottom-row deletion was reviewed and rejected; it does not address side leakage and can cut garments.

## Execution stages
1. Establish trusted baselines. Preserve native photographs and compare SegFormer with MODNet for all six licensed examples. Keep the MODNet + inside-edge smoothing preview as a promising candidate, not a production default.
2. Classify boundary concerns independently. Produce review overlays for potential background-similar leakage and dark shadow contamination along *all sides* of the MODNet contour, not only its bottom rows. Do not delete pixels automatically.
3. Evaluate an object-aware refinement approach. Compare alternatives on the same sources and inspect garment details including hems, cuffs, laces and soles. Do not infer that dark pixels are shadows merely because they are dark.
4. Collect independently verified reference outlines for sneakers, boots, shorts, dresses and jackets. Score actual overlap, precision, recall, background retention and visually meaningful edge defects only after approved labels exist.
5. Require mobile-friendly PNG previews and end-to-end camera clarity checks before feature-gated production release. Roll back if garment completeness, confidence or latency regress.

## Acceptance gates
- Visibly less genuine shadow AND less non-garment boundary extension on representative photos.
- No damage to true garment edges and details.
- High-resolution source preserved; smooth natural alpha transitions.
- Independent outline scoring where possible and a human comparison on real mobile photographs.
- No new manual steps for Closet Current users.
- No changes to Drive Duel.
