# DRESS-FIT-05 — Real original photographed dress gravity settle and static freeze (research HOLD)

**Source of truth:** Closet Current / PR #506 verified dress 163-bone gait and source-photo collision research, exact SHA `6ea84b464bc9606f807141d2fae9660910db1692`, no-deploy CI #41342811576 SUCCESS. Do not merge this research or modify production.

## Scope and motivation
Transfer the user-approved internal garment workflow from photographic shirts to the **genuinely source-photographed dress**: photograph -> source-preserving 3D fit -> small bounded gravity equilibrium -> freeze 3D garment surface -> rotate mannequin. Moving fabric is not a required display feature. Shirt F09/F10 live on different research branches and have not been silently merged here.

## Implementation
- Only the already source-verified public-domain dress `commons-0053`, exact SHA `e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019`, and the genuine original 163-bone anatomical skinned dress model are eligible.
- The still photograph's RGB/JPEG, `dressRest` shader projection, skinIndex/skinWeight and photographed **front** are preserved. Only lower skirt **side/rear** geometry is relaxed; never invent unphotographed image details.
- A bounded damped deterministic 60Hz spring converges to a nonzero 6.5mm target. The final world-space sculpt is limited to 9.5mm; the model is geometry-based and **not an exhaustive cloth physics solver**.
- An original posed-body triangle BVH audit runs before and after the fit; new crossing counts block the fit and restore the exact initial garment geometry.
- The fitted geometry remains still through turntable and touch rotation. Repeating the fit from source canonical geometry is deterministic. Swapping garments/figures, account switching or logout invalidates this owner-gated research state.
- Localhost-only `?dressFit=after&walk=after&folds=after` enables the explicit **Fit & freeze photographed dress** action and JS `window.ccWardrobeDressFreeze05()`. Default OFF.

## Required acceptance
The inherited 44 true WebGL photographed dress gait screenshots, nine-point actual anatomical cycle, two real rig BVH audits, source/owner isolation and source-reset checks must remain green. In addition capture **24 additional genuine WebGL** before/frozen/rotation-return/repeated-fit screenshots on original male/female rigs at 320/390/430 widths. Each comparison must actually move skirt geometry (>=8 changed pixels), preserve photographed source, have no added body intersections, and have <=2 changed RGB pixels on returned 360° view and repeated fitting. Use exact-head, no-deploy GitHub Actions and inspect screenshots for visible realism; do not claim visual acceptance from pixel counts.

## Release barriers
No arbitrary user's private photos used, no photo-to-3D generality proven, no mathematically swept dynamic collision certification, no 10/10 realism claim, and no physical Android/iPhone GPU benchmark. Remain draft HOLD with Family Alpha Issue #255 HOLD, no merge/deploy, no changes to Drive Duel, Delta Ebb or billing. Next priority if technical tests pass: independent visual review + physical Android/iOS acceptance, then photo-indexed wardrobe integration.
