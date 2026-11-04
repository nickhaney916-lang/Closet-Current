# Garment-clipping acceptance — draft PR #7

This is an **experiment gate**, not an automated model promotion, and not a
pixel-accuracy claim. The active production capture/indexing code remains
unchanged.

1. The six locked photo sources must receive human-edited **garment-only**
   outlines and independent second approval, following
   `benchmark/INDEPENDENT-MASK-REVIEW-GUIDE.md`. AI prediction masks,
   synthetic test rectangles and visual impressions are not reference truth.
2. The real segmentation benchmark exports each model baseline as
   `<id>.prediction.json`. A genuine alternative algorithm may submit
   `<id>.candidate.json` with matching source SHA and dimensions. No default
   candidate is fabricated or promoted.
3. The `scripts/report-clipping-acceptance.mjs` runner scores both against
   approved outlines and exports `clipping-acceptance.json`. Until evidence
   exists, every case is **blocked**, even when CI succeeds.
4. Per case: candidate IoU >= .95; garment recall, full boundary recall and
   lower-quarter boundary recall >= .98; no loss of recall, boundary,
   lower-quarter detail or IoU versus the baseline; no increase in included
   background pixels. At least one verified improvement across all six photos
   is required to qualify for further **independent mobile review**.
5. These thresholds are conservative initial release conditions, not proof of
   perfect hems/soles or universal wardrobe-photo accuracy. Independent real
   mobile tests must still cover lighting, colors, shadows, movement, people,
   mannequins, shoes, layers and camera resolution.

**All six approved reference masks are presently pending.** No human reviewer
identity may be invented to bypass this step. No automatic deployment, paid AI,
new customer buttons, normalization approval or changes to Drive Duel.
