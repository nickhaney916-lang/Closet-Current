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
