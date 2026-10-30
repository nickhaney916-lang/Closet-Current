# 3D-48 — Source-neutral sewn collar lip (Draft / HOLD)

**Exact starting point:** draft PR #455, commit `95f59cd0b3383f20e34e39cf54457791d701938d` (3D-47). This new work is independent of the 3D-47 upper-arm volume changes and does not modify the underlying anatomical rigs, originally photographed fabric or licensed jeans.

## Problem and change
The original photo shirt has a genuine separate Work59 sewn collar band. Its interior rim could read as a rigid flat strip against a detailed neck. This opt-in, source-neutral 3D operation reshapes **only the interior lip** of the existing band, using the actual `neck01` anatomical joint reference. The photographed outer edge is absolutely pinned, and source/UV proxy attributes, skin indices/weights and original photo files remain untouched. The proposed visible contour is a small upward and outward fabric fold (max 11 mm), not an added cylinder, painted piping, invented fabric, 3D physical cloth solver, or image-generation output.

**Owner comparison:** open the local research original-photo jeans viewer with `construction=after&sweep=after&sleeve44=after&caps45=after&contour46=after&volume47=after&collar48=before`, then repeat with `collar48=after`. This option defaults to **off** in all paths.

## Automated QA
- `node --test tests/three-d-48-collar-roll.test.mjs` tests both anatomical figures: outer 3D collar/photo seam vertex coordinates unchanged exactly, original panel photo-coordinate arrays + skeleton skin fields hash-identical, separate garment shell and anatomy unchanged, and band inner lip genuinely moved by bounded distances.
- A source-true full-outfit test combines male and female with two different genuine licensed jeans sources and runs source, 25/50/75%, relaxed and return poses through the existing skinned shirt/body/denim triangle solver.
- `node scripts/test-three-d-48-collar-browser.mjs` performs local WebGL A/B screenshots with the actual licensed photographed shirt and jeans on 320/390/430px simulated mobile viewports (front, side, back, poses) while verifying no external requests, actual human approval click, source identities and physical pixel change.
- The dedicated draft/no-deploy GitHub Actions workflow restores pinned assets and previous baseline checks; its results must be read from the **exact final PR commit**. A PR creation alone is not evidence of a passing CI or good appearance.

## Acceptance still needed
Human review of before/after screenshots, independent physical Android/iPhone checks, visually natural neckline/back/side views, genuine photorealistic fabric and complete user-wardrobe integration. Collision triangle checks are not signed-interior or continuous dynamic simulations. No owner-approved release.

**Strict hold:** no merge, staging, production, user/private photos, payments, external billed models, Family Alpha Issue #255, or Drive Duel changes.
