# DENIM-SILHOUETTE-07 — Photo-true anatomical jeans knee-to-ankle silhouette (DRAFT HOLD)

Parent: Closet Current PR #518, exact verified SHA `377e72225c6ab5a6b9239c0d6bad076ae92e7fa0`, no-deploy GitHub Actions run #41457674552 **SUCCESS** (100 original WebGL frames: 44 genuine dress gait, 24 frozen dress, 32 photographed jeans). No production updates.

## Why: verified integration, but insufficient realism
PR #518 source-verified photographed jeans static fitting is stable, 0 additional skinned triangle contacts and 0 rotation / repeat drift. Actual screenshots show nearly uniform cylindrical legs and a barely noticeable resting fit (41–50 source silhouette changed pixels), so producing more invisible frame motion is NOT the right priority.

## What is implemented in this isolated source-only branch
- Maintain original signed SHA source, still JPEG, physically sewn real 163-bone mesh and 3D75/76 source-informed original fold/seam topology.
- Derive original knee / ankle / calf anatomical landmarks and apply a smooth *asymmetric knee-to-hem* **source-neutral side/rear 3D geometry profile** (up to a small bounded additional ~16mm knee ease, hem ≤1.5mm). Gradual, supported by existing real sewn folds; no procedural repeating false dye/wrinkles, new texture, guessed print, or invented photographed rear.
- The approved photographed FRONT positions remain exactly unchanged; pantsRest/pantsSourceUV/pantsSourceFront/skinIndex/skinWeight remain byte-identical. Camera 360° and repeated fitting must restore exactly the same frozen 3D mesh.
- Reuse existing account/session/confirmed original photo SHA gate, genuine original 163-bone rig, exact true skinned denim/body BVH before/after audit and rollback on any NEW contact.
- **Explicit opt-in only** `?denimFit=after&denimSilhouette=after`, other research defaults to F06 exact original baseline and production defaults OFF.

## Acceptance contract
Retain ALL F06 full no-deploy existing 100 actual photographed dress + jeans WebGL frames, actual source ownership, both licensed denims, both anatomies and 320/390/430 viewport tests. Add four matched **real 390px WebGL F06-vs-F07 pairs** (two mannequins × two original denim photographs, 8 new source-authentic PNGs). Test physical pixel difference vs F06 ≥30 on same figure/pose/camera/source (not invented or retouched), actual knee-to-hem 3D radial profile ≥8mm improvement, no NEW actual body triangle crossings, no source/photo change, no camera rotation/repeat frame drift. Strict dedicated GitHub Actions on FINAL PR HEAD; independently review garment images. **Passing image pixel-delta thresholds alone is not human 10/10 visual acceptance.**

## Barriers
Arbitrary personal photo-to-3D, real phone acceptance, photorealistic dyed denim rear detail, mathematically swept collision, full textile cloth solver, merging or deployment remain **unverified or prohibited**. Family Alpha issue #255 remains HOLD; no production, sibling app, customer accounts or billing modifications.

## QA correction recorded
Initial CI #41461909467 FAILED CLOSED because the original source mesh lacked eligible side/rear vertices in the assumed fixed 0.12–0.36 hem band (`hemMoved:0`). Corrected code uses observed source calf height min/max **per licensed leg** to target a genuine lower-to-higher side/rear calf taper, and still requires finite original anatomical coverage, both lower/upper surface populations, ≥8mm relative easing and genuine WebGL before/after image evidence. No weakening of photo, collision, rotation, or source identity standards. Retest the final branch head.

## Corrected second QA failure
Dedicated CI #41462748291 failed its unchanged 8mm taper gate: observed 188 knee-region and 98 lower source vertices but only ~4.94mm mean relative easing. Root cause: the new 07 profile mistakenly called the `smooth(start,end,value)` helper in value-first order. Fixed 07 with a unit-tested numeric source-phase curve (0mm additional knee easing at source lower edge, maximum near the measured calf/knee transition, smooth upper taper), rather than changing contact/image thresholds. Parent F06 baseline math and source signatures remain exactly unchanged.

## Independent visual quality rejection, correction
CI #41463775964 succeeded (108 true original-source WebGL screenshots including eight actual matched F06/F07 source pairs), with source-original photo, 163-bone body contact and freeze stability protected. But **visual QA REJECTED** the upper-calf outward bump: actual 390px female/male pictures show unnatural round knee/calf protrusions even though RGB difference increased to 427–580 pixels. This is precisely why quantitative tests cannot replace human inspection. Reworked 07 to taper actual source-neutral **lower calf inward** gradually (maximum ~14mm, near-original knee mesh held mostly unchanged); source-photo front and signed BVH collision gate remain mandatory. Re-run full final-head suite and reinspect original WebGL images; do not label human visual acceptance or claim 10/10 until better.

## Third QA failure and physical correction
CI #41466303201 failed closed on a photographed denim ring with physically measured taper mean 15.448mm (>8mm required) but maximum absolute displacement 9.961mm, 0.039mm below the independent 10mm proof floor. Rather than lower that floor, source-neutral inward lower calf easing increased 14mm →16mm; original licensed front/rest/UV/skin, genuine BVH zero-new-intersection, frozen rotation and before/after screenshot criteria unchanged. Re-run final source SHA commit.
