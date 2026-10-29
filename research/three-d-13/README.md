# Closet Current 3D-13 — source-bound inner-cuff gap correction (HOLD)

**Owner direction:** Continue improving the **real photographed clothing on the real anatomical 3D humanoid**, rather than another 2D avatar or separate mannequin. Latest verified chain: Work56/PR400 independent original-RGB skinned garment; Work57/PR402 relaxed body; Work58/PR405 shared-skeleton fitting; Work59/PR408 natural drape; main-thread PR411 source-hash-verified original-photo fallback. This is an isolated, stacked draft on PR411 exact `7cdbd8cbdd88fabe862b39e584af42609bec1634`. Work59 files are **not edited on its own branch** and other Work tasks remain separate.

## Reproducible visual defect

The actual Work59 3D-11 licensed-photo screenshot review grades **male inner cuff FAIL** in three-quarter view: a thin skin sliver appears between the end of the photographed black shirt sleeve and male wrist. This persists despite the prior 6mm conservative forearm radial ease. Shirt collar and geometric folds remain REVIEW; overall cloth realism still FAILS. User has explicitly wanted *actual realistic 3D*, not more paper-doll tricks. Avoid inventing cloth images, rear imagery or body measurements.

## Proposed functioning fix

The new `research/three-d-13/cuff-boundary.mjs` reads real verified male/female source-pose **wrist and lower-forearm bones**, locates the existing Work56/59 sleeve vertices near the true cuff edge, and tapers a **maximum 16mm forward extension** along the original forearm axis, fading to exactly zero up the sleeve and away from the ring. It updates **only the existing separate shirt mesh** position and rest/source-panel coordinates. No new geometry, triangles, bone indices/weights, shaders, source textures or GPU handles. Collar/bodice and central printed chest are excluded; neutral sleeve fabric remains the existing source-RGB-derived color. The existing shared skeleton follows both source and relaxed poses. Source-owned Work47 JPEG, transparent cutout, SHA, alpha/review gate, user photos and original CC0 humanoid geometry are untouched.

`refineGarment(shirt,root,{repairCuffs=true})` runs the correction after the existing Work59 body-safe drape and collar, and records bounded per-arm repairs in `shirt.stats.cuffRepair`. A `repairCuffs:false` test-only option enables direct before/after *on the same source and mesh* without duplicating Work56/59 logic. The function refuses missing wrist/forearm bones, unsupported geometry and excessive reaches. Measurements are prototype model units and **not verified clothing size**. Clothing-body collision and human visual approval remain explicitly false.

## Verification plan

No-deploy CI builds the same locked 15-real-photo Work47 benchmark and exact SHA-verified adult male/female CC0 GLBs. New source-independent Node tests compare the original Work59 cuff geometry versus the adjusted cuff on both **actual** models: number and position of changed vertices, bounded 24mm maximum, signed distance to wrist improving, both sides altered, unchanged source/print center, unchanged body vertices, original exact skin weights and indices, same geometry and texture handles, unchanged source photo identity, and refusal of unsafe inputs. Existing Work59 geometry tests except their frozen branch-only diff guard remain runnable.

The full existing `scripts/test-three-d-11-browser.mjs` provides a real Chromium WebGL2 before/after comparison at 320/390/430 for two real CC0 anatomical figures, each with 2 poses and 4 angles, real source-RGB reviewed shirt, exact JPEG/PNG hashes, source/relaxed reversals, touch/pinch, cleanup, zero outbound requests and screenshot evidence. Compare **male relaxed three-quarter cuff** and female views against Work59 reference. Mechanical PASS **does not automatically promote visual FAIL to PASS**: manual screenshot inspection must still grade cuff closure and overall appearance.

## Safety and release

Research-only stage-scoped files, no merge or deploy, no cloud staging/production/Auth/RLS, no new wardrobe accounts or family images, no paid APIs or model downloads beyond the pinned already-approved local sources, no Drive Duel changes. Previous stage-specific CI guards and broad camera/indexing tests are still red independently; a successful isolated 3D-13 workflow is not overall merge readiness. **Four-person Family Alpha #255 remains HOLD** until actual protected staging JWT/RLS, cloud image save/restore, physical-device testing and independent real-photo visual approval. No new 15-photo visual PASS claimed.
