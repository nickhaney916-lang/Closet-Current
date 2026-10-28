# Work52 fifteen-photo assessment — HOLD

Work52 outputs are byte-identical to Work51 for all nine available licensed cutouts (including the separate native dress variant); six lack reliable masks. Compare original / previous Work51 / Work52 / unchanged humanoid in the offline gallery. No additional photo or visual grade is promoted. The inherited findings below remain applicable; this is assistant assessment, not owner approval or independent ground truth. No private photographs or licensed accuracy percentages.

| Licensed photo | Grade | Actual remaining defect / behavior |
| --- | --- | --- |
| commons-0001 shirt | REVIEW | Pale/printed garment: unchanged. Mannequin collar, sleeve perspective and hem need review. |
| commons-0003 long sleeves | REVIEW | No distinct warm source support: unchanged. Collar, cuffs, source/manual outline and sleeve fit remain provisional. |
| commons-0065 jacket | FAIL | No reliable mask; belt, sleeves and clipped edges need manual isolation or recapture. |
| commons-0068 coat | FAIL | Rear view and complex outdoor background; source-photo fallback. |
| commons-0053 dress | REVIEW | Beige neckline band / most native mannequin neck removed automatically in the proposal. White piping and logos retained in inspected views. Shoulder residue, faint native neck outline and uneven inner edge still need correction. |
| commons-0043 skirt | REVIEW | Unchanged manual-assisted outline. Pale waistband, pleats and hem cannot be inferred safely by the support detector. |
| commons-0033 shorts | FAIL | Person and outdoor scene not separable by this heuristic; no mask, photo fallback. |
| commons-0021 pants | FAIL | Hands, torso, shoes and background remain unresolved; no guessed split trouser legs. |
| commons-0082 sneaker | FAIL | Pale shoe and sole/laces remain unchanged; single shoe is a photo reference. |
| commons-0088 black boot | FAIL | Work50 mask retained; glossy detail and background fringe need review; cannot manufacture a worn pair. |
| commons-0016 blouse | REVIEW | Pale embroidery/background ambiguous: unchanged. Cuffs, openings, straps/trim and flat sleeve fitting remain unresolved. |
| commons-0079 difficult sneakers | FAIL | Busy background / overlapping footwear; no new mask or pair claim. |
| commons-0089 gradient boot | FAIL | Gradient background unchanged; ties/edges and single-shoe limitation remain. |
| commons-0094 boot | FAIL | Unchanged light-background cutout; laces/upper strap require review, reference-only footwear. |
| commons-0059 difficult dress | FAIL | Clipped/oblique garment remains unavailable; missing fabric cannot be reconstructed. |


## Measured synthetic improvement

Five controlled variants of the same known garment shape remove 957 background pixels each, reduce residual background 1,655 → 698, improve IoU 0.7893 → 0.8988 and two-pixel boundary F1 0.1521 → 0.9158. Fabric support recall is 1.0 on these authored masks; this is not a licensed-photo accuracy claim. All remain REVIEW because a protective margin and fine uncertain regions remain. Three ambiguous/busy variants refuse cleanup and remain FAIL/fallback. Source-colored narrow-detail and translucent alpha regression checks are exact. No user-time study was performed; six automatically generated rectangles replace manual placements on each supported synthetic fixture.

## Verification

133 focused Node regression tests passed locally before final documentation, including ten Work52 cases, inherited original-source/RGB, manual undo/recovery, source-bound recipe privacy, fitting/geometry and simulated session tests. Browser results and exact-head CI are recorded in the PR and issue255. Live account/RLS, cloud restore and physical phones remain untested.

No production, deployment, merge, provider/Auth/Supabase/Cloudflare settings, private family photographs, paid services, spending or Drive Duel changes. Family Alpha HOLD.
