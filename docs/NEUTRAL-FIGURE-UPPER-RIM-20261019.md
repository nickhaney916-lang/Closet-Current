# Closet Current — bounded upper shirt edge refinement (October 19, 2026)

This is an independent main-chat task stacked on [PR #54](https://github.com/nickhaney916-lang/Closet-Current/pull/54), which smoothed original high-resolution figure base-shirt lower hems. **Neither original PR nor the deployed app changes.**

## Problem, scope and actual implementation

The two fixed MakeHuman/Blender adult figure candidates remain aesthetically stylized. The neutral gray shirt shell has a visible sawtooth edge at its upper front rim. This change makes a **small geometric upper-edge smoothing pass on the separately generated torso shell**. It does not reconstruct the neck, change sleeve cuffs, infer occlusion geometry or alter the customer's clothing masks or original classification/indexing image.

- `smooth_upper_shell_rim` selects only manifold-like boundary vertices with exactly two boundary neighbors, located within 1.36–1.54 local scene z units, horizontal x ±0.30, and on the front y < -0.04 of the existing derived neutral shirt shell.
- Each eligible vertex must have two similarly eligible boundary neighbors. The synchronous Laplacian/neighbor-average pass moves **only its local z coordinate**, by at most **0.015 scene units** and only when a ±0.075 scene-unit local discontinuity rule is satisfied. No new faces, arbitrary extensions, colors, purchased content or AI repair.
- The previously verified lower hem, original adult body source vertices, neck, arm chain, raw photos and reusable figure alignment remain unchanged.
- Every generated native 1941×3597 Blender master records the actual top-rim candidate/moved vertex counts, before/after boundary roughness, max movement, and explicit `sourceBodyChanged:false`, `sleeveCuffsModified:false`, `neckOpeningReconstructed:false`, `independentAppearanceApproval:false`.
- Python synthetic topology tests reject invalid strength, missing eligible front contours and non-local band requirements. Integrated scene-evidence checks reject missing or non-improving *actual* figure diagnostics.
- Exactly two original adult figures, source hashes and verified CC0 asset records, same cameras/lighting/crops, same original shoes, transparent 1941×3597 masters, 1294×2398 PNGs and 970×1798 WebPs. CI rerenders in pinned Blender 4.3.0, checks hashes and 24 Android/iPhone browser-emulated native sampling cases and the existing full-app figure preview tests.

## Not proven, not enabled

This is a conservative upper *rim* polish, **not** a finished T-shirt neckline, proper sleeve cuff model, cloth physics, convincing skin/hair/face, body occlusion or independent visual approval. It may create distortions in actual native renders even if the geometric roughness decreases, which must be examined manually and repaired or held. The original two low-res in-app previews remain live until an explicitly approved merge/deploy.

No production figure rights signoff, independent accepted real-photo cutout/fitting scores, physical phone evidence, market quality parity, purchases, new recurring charges, paid inference or Drive Duel changes.
