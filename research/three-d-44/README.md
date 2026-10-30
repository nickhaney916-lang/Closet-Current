# 3D-44 — photographed shoulder cap / upper sleeve seam fall — DRAFT HOLD

Parent: [dedicated-green PR #451](https://github.com/nickhaney916-lang/Closet-Current/pull/451), exact `7cb3d6b138d71c9dcd34aaec85868b3f76787e64`.

## What is actually implemented
A source-measured upper arm shoulder-to-elbow radial sleeve ease applied to the existing **independent original photographed shirt mesh**. The change is limited to 22 mm maximum virtual rig-space movement, bilaterally on the anatomical male and female sources. Smooth falloff retains neck, central shirt print, body, elbow/cuff source topology and original skinning weights; duplicate original photo panel seam vertices receive identical movements. The source JPEG and original projected source coordinates (panelPosition, panelNormal) remain immutable. The original female/male anatomical 163-bone meshes, independently patterned original-photo jeans, and 2D original-photo board fallback are unchanged.

The existing PR451 pose-aware real posed triangle correction is deliberately retained. This new tailoring is OFF by default. The localhost preview opts in with `?clothFall=after&construction=after&sweep=after&sleeve44=after` (use `sleeve44=before` for before). No user accounts, private family photos, paid image processing, or web data calls.

## Gates
- 2 exact CC0 figures × 2 independently licensed original denim sources, shirt photo/source/skin attribute SHA checks and genuine 3D position changes.
- Source, 25%, 50%, 75% and relaxed poses plus repeat: actual world-space BVH shirt/body, jeans/body, shirt/jeans surface-crossing gates. No regression to the source/relaxed baseline.
- Genuine Chromium screenshots at 320, 390, 430 px; original source photographs; both anatomical figures and both licensed jeans; real source/relaxed and 50% arm pose; front, side and rear A/B.
- The prior PR451 sampled-pose and historical source/neckline contact regression tests must remain green.

## Honest status boundaries
No new photorealistic rear photo, full sewn fabric seam topology, physical cloth dynamics, signed containment, continuous swept arm collision proof or individual-body fitting claim. A better photographically faithful sleeve silhouette is the **goal**, but cannot be called VISUAL PASS until the actual before/after Chromium evidence is reviewed. Human Family Alpha #255 stays HOLD, no deployment, production, staging, merge, Drive Duel or unapproved purchases.
