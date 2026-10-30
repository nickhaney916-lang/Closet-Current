# 3D-45 — genuinely separate original-photo shoulder cap panels — DRAFT HOLD

Started from [PR #452](https://github.com/nickhaney916-lang/Closet-Current/pull/452) exact technically green commit `ee7702ad3ceac3d1d517db093b78835f9dbaa21f`.

## Implementation
- Isolate a genuine region of **left and right upper-sleeve cap triangles** from the existing independent source-preserving shirt. Each extracted armhole cap gets its own real `THREE.SkinnedMesh` and geometry, bound to the original CC0 anatomical skeleton and using the **existing genuine shirt material**.
- Remove the cap's original triangles from the body of the shirt, so original and independent cap surfaces do not visually overlap.
- Split interior shared cap edges only and add new independently formed 3D vertices from the original cloth panel's own skin weights/source coordinate attributes. **No split edges at panel boundaries**: all existing source seam vertices remain at their original coordinates. Internal longitudinal fabric shaping may move added midpoints up to 3 mm only. Unlike the prior work, this step genuinely changes garment mesh topology.
- Source neckline, armhole, original shirt front RGB, logo print, photo-source attributes, anatomical body, original jeans photographs and 2D fallback remain unchanged; no invented photograph of the garment's rear.
- Research local opt-in `?construction=after&sweep=after&sleeve44=after&caps45=after` and reversible original before `caps45=before`. Feature OFF unless explicitly activated.

## Acceptance
- Both original anatomical models × two independently licensed photographed jeans sources; the genuine photographed AJ shirt.
- Bilateral separated cap meshes, physical source-face deletion, positive increase in real cap triangles and preserved original source attributes and weights.
- Real BVH shirt/body, jeans/body and shirt/jeans triangle intersection audits at source, 25%, 50%, 75%, relaxed and repeated poses. No intersection failures tolerated; preserve old 3D42–44 tests.
- Actual Chromium 320/390/430 pixel genuine source photographs with front/side/back, relaxed/50%-pose before/after comparisons.
- Screenshot analysis evaluates armhole seams and shoulder silhouette, not just image pixel differences. Mobile device itself has not been tested.

## Non-claims
These are **standalone stitched-style 3D shell panels** created by topology separation, not a physics-based sewable cloth simulation or verified UV-tailoring to real human body measurements. Original front source pixels are unchanged; rear stays source-neutral. Zero triangle intersections at sampled poses is not equivalent to watertight signed contact, clothing self collision, or continuous swept physical collision. VISUAL REVIEW pending actual screenshots.

No merge, deploy, staging, production, private family/customer photos, paid AI, or Drive Duel modifications. Family Alpha Issue #255 HOLD.
