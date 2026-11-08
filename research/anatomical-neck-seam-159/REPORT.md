# Closet Current — MAIN Priority #159: measured original-head neck seam transition

**Research only. Family Alpha Issue #255 HOLD. No production / existing staging / other projects / real owner images / deployment / merge.**

## Exact inherited benchmark

This branch is stacked directly atop independently verified [P158 draft PR #713](https://github.com/nickhaney916-lang/Closet-Current/pull/713), exact initial parent `4b7815760104ca4201b59210466cf43d2fd9f8be`. The inherited real MIT-licensed head/hair-only GLBs from P156 remain identical by original SHA256 verification. P157 registered 80-bone licensed head to original 163-bone saved-dress model; P158 matched exposed original body skin color to original licensed head face albedo, with 1,288/1,288 Node tests and 36 real-mobile Chromium comparison screenshots, plus 3 WebKit original-source rig cases.

## Why #159 matters

At 390 CSS px P158 frontal screenshots, a somewhat elongated neck emerges from the original photo-derived dress neckline. The change required is an independently rendered, anatomically measured P156 source neck-to-P541 original skinned-torso bridge—not more manually guessed facial/skin presets. The original licensed MIT face, mouth and hair stay intact, and the original user photographed dress is never touched.

## Implementation

`source-neck-surface.mjs` samples original posed `SkinnedMesh.applyBoneTransform` vertices of the independently verified P156 80-bone source head at an upper cross-section and the original P541 163-bone body at a lower cross-section. The upper and lower source section radii, centers, heights and sample counts must be measured and finite, or the research graft **fails closed**.

It builds a small independent 9-ring, 24-angular-segment interpolated 384-triangle WebGL neck surface, with computed vertex normals and the already-verified P158 P156 face/body linear skin-tone palette blended across cross-sections. It attaches the independently owned mesh to the original body head bone using `Object3D.attach` to preserve the measured world pose. The original P157 render-time head mask cutoff is unchanged; the new bridge spans the measured boundary. The mesh is removable and all its own geometry/materials are disposed on model cleanup or owner/figure switch. Original skinned body vertices, original head and hair vertex indices, exact GLB texture bytes, original owner JPEG/cutout, garment skinned meshes, wardrobe persistence and 2D/photo fallback remain completely untouched.

This **does not** claim a topological weld of original 80 and 163 skeletons, unrestricted pose-responsive physical neck simulation, realistic photographed cloth dynamics, or an independently accepted 10/10 human. It is a bounded surface continuity research improvement intended to reduce visible neckline gap in the current neutral 3D outfit pose.

## Genuine mobile acceptance and fail-closed boundaries

Dedicated no-deploy GitHub Actions rebuilds exact P118/P131/P150/P152/P153/P154, original source signed synthetic-owner dressing fixture, P156 original texture verification, P157 real head graft and P158 original source-matched body. It takes **18 original P158 BEFORE** Chromium 320/390/430 px screenshots (female/male × front/side/rear), then installs the P159 code **only** into disposable pinned P541 detached Git worktree and takes **18 P159 AFTER** matching original saved dress/figure view screenshots. It verifies both original GLB and original photo identity, original 163/80-bone counts, 384 actual new transition triangles, original body and dress counts, genuine neck image pixels changed in each pose, the original licensed face/hair dark pixels and photographed garment pixels remain stable, and original exposed arms/legs remain visible. Runs genuine WebKit at the same widths, and separately proves original node suite unaffected.

**Final acceptance subject to exact-head successful CI.** Fail closed if neck original-source skinned samples unavailable, unsupported geometry, unexpected source/garment writes, blank or invalid GLSL, missing model, wrong licensed original SHA, or changed original dress face/skin pixels. Human visual / physical hardware acceptance and Family Alpha stay HOLD even if all automated research evidence passes.
