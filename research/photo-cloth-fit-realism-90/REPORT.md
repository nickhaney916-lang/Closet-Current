# PHOTO-CLOTH-FIT-REALISM-90

**Research only. Family Alpha #255 remains HOLD. No merge or deployment.**

## Source and renderer boundary

This benchmark starts from verified Priority #89 `e6c2ef87499b354bc8440bfdc9ab3a92980f92f0` and uses only the unchanged Priority #541 anatomical renderer source `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`. The renderer's two humanoid GLBs are the pinned CC0 163-bone models. Original clothing JPEG hashes and attribution are in [source-manifest.json](source-manifest.json).

The additional #90 browser acceptance captures the existing real skinned jeans in both male and female figures at 320 and 390 CSS-pixel widths. It compares the unbent source pose to the supported 12-degree anatomical knee pose, tests both verified denim sources, keeps the existing source-photo/UV/skin invariants, and adds a 45-degree camera sample to the existing front, side, and rear views. That creates 64 real Chromium WebGL screenshots and eight image comparisons. It does not claim that the bent-knee view is a continuous cloth simulation.

The inherited real consumer viewer browser run continues to cover the original photographed shirt, both jeans, and dress on the same 163-bone renderer at 320, 390, and 430 CSS-pixel widths. Its original fallback, owner isolation, save/reopen, and resource cleanup checks remain in scope.

## Measured visual limits

- The front of the shirt, jeans, and dress is bound to the pinned original JPEGs. The rear of these samples has no photographed source. Denim's rear remains neutral source-derived color and geometry; it has no genuine rear pockets or seams.
- The local baseline render of the jeans showed a clear source-photo front and a visibly simpler neutral side/rear. The image is evidence of a known limitation, not a photorealism result.
- The inherited #77/#78 contact checks calculate sampled skinned triangle intersections and local oriented-face distances. Their outputs explicitly say the depth is not a watertight signed containment measurement and do not certify continuous collision freedom.
- Pose sampling is discrete. The solver and screenshots do not establish cloth mass, gravity simulation, arbitrary-garment reconstruction, or behavior between sampled poses.
- Human visual acceptance has not occurred. No score, “10/10” rating, or scientific realism pass is asserted.

## Priority #90 change and verdict

This priority adds independent 45-degree image acceptance to the real photographed denim pose comparison and locks the exact source/rig manifest. The source renderer's garment geometry is not changed in this PR: the available verified samples and existing controlled pose test do not establish an additional geometry change that improves all supported samples without risking front-photo mapping or introducing unsupported rear details. This is an evidence/acceptance improvement, not a new cloth solver.

Accordingly, engineering status for the **new fit improvement** is **BLOCKED**; the renderer and inherited fit controls are measured, but this PR does not claim an incremental geometry improvement. Visual realism is **NEEDS REVIEW**. Product release remains blocked on a real geometry improvement, independent human review, physical phone/browser acceptance, and the existing signed-cloud and Family Alpha gates.

## Reproducibility

The no-deployment workflow verifies exact ancestry and changed-file scope, rebuilds the app, runs the full inherited Node suite, checks the pinned donor assets and source hashes, runs the actual 163-bone WebGL browser matrices, audits every screenshot's dimensions and SHA-256, and uploads sanitized results. Browser viewport tests are not physical phone tests.
