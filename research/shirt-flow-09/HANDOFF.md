# SHIRT-FIT-09 — photographed cloth settling and freeze (DRAFT HOLD)

**Purpose:** use the existing real photographed 163-bone shirt drape, gravitational shape, original texture and spring response as an *internal fitting aid*, not persistent garment animation. Build on verified F08 PR #514 SHA `c68abd1d3a4daa9d3e7290e8c34843f860a143ad`.

## Implemented isolated research workflow
1. Keep original licensed JPEG, hash, RGB, alpha, optional UV, panel projection, skin weights and source image unchanged.
2. Reconstruct genuine sewn skinned source shirt for one of 17 verified anatomical arm positions, including F03–F08 folds and hem silhouette.
3. Run the F05 fixed 60 Hz damped spring for at most 96 steps. The full true posed garment/body BVH collision check is invoked after every active cloth step; fail closed on a crossing or source identity loss.
4. Require five stable consecutive samples at bounded velocity and offset; capture **the actual fitted mesh position and normals**.
5. On subsequent same-pose render, restore exactly the frozen geometry without playing simulation. Switching pose clears the snapshot. Changing garment/rig disposes the old cache.
6. Expose only with explicit localhost `?settleFit=after` and all pre-existing source-photo garment gates. Research viewer button: **Settle & freeze**; script: `window.ccShirtFitFreeze09(0.5)`.

## Acceptance workflow
The inherited F08 no-deploy CI keeps 132 real WebGL mobile-size screenshot regressions and original SHA/cloth/body contact checks. Additional F09 tests require:
- fixed-step deterministic convergence; reject unsafe pose, non-finite spring state, photographic source mutation and body collisions;
- 24 **actual WebGL screenshot files** over both anatomical figures, widths 320/390/430, one original photographed shirt, pre/post fit and same pose / rotation return;
- zero pixel change when restoring frozen same-pose geometry and at most two changed pixels after back-to-side rotation; observed source hash must remain identical;
- no network images, user closets, accounts, billing, merge, production deploy or sibling repo edits.

## Honest technical boundaries
This is **not a full finite-element cloth solver**, fabric-pattern reconstruction from one photo, unrestricted motion simulation, proven 360° photographic rear detail or human photorealism certification. The existing F05 spring is a bounded pose-triggered spring, so it may settle close to the F08 geometric fit; whether this *visually improves* garment realism still requires side-by-side human review. Synchronous research settling must also be benchmarked on real mobile GPUs before any product integration. Optional feature defaults OFF. **Family Alpha #255 HOLD. No merge or deployment.**
