# Closet Current — neutral garment hem refinement (2026-10-19)

**Main chat independent priority.** Stacked on [PR #53](https://github.com/nickhaney916-lang/Closet-Current/pull/53) and separate from the work session that created the original high-resolution Blender/MakeHuman candidates. This is a small quality experiment on the derived neutral clothing shell. It does not change the public app.

## Verified design objective
The previous original figures' gray base clothing had visibly scalloped, jagged lower hems that distracted from the user-supplied outfit preview. Increasing image resolution did not fix the underlying polygon boundaries. This development branch **moves the actual 3D shell boundary vertices** toward a common local hem height before rendering: never by upscaling or generated image fill.

- `scripts/figure_fabric_boundaries.py` finds true perimeter edges of the original project's selected neutral torso-shell faces, restricts edits to the bounded lower hem band 0.84–1.02 scene units and horizontal torso ±0.31, and uses a median target for a repeatable reference.
- Exactly those **new display-only shell** boundary vertices receive up to 0.06 scene units adjustment, no changes to their x/y coordinates or the original MakeHuman body/arm skinning, leg geometry, joint data, source photos or other wardrobe items.
- The renderer records actual candidate per-figure `hemBoundaryVertices`, moved vertices, vertical extent before/after, `bodySourceVerticesChanged:false` and `independentAppearanceApproval:false`. The derivative benchmark includes the new Python algorithm in the cryptographic pipeline hash list.
- A new Python independent regression test checks deterministic flattening on an asymmetric synthetic mesh, unchanged non-hem geometry, no edits outside allowed bounds and fail-closed behavior on missing/invalid geometry. The native Blender CI must verify **both** figure candidate scenes show a smaller measured hem z-range.
- Existing exact CC0 asset hashes, Blender 4.3.0, 1941×3597 native PNGs, delivery variants, web mobile browser tests, commercial-license restrictions, paid inference disabled and current no-deploy settings remain. Exactly two new adult figure candidates are created.

## Honest limits
This is a geometry-boundary improvement with a **limited zone**. It does not guarantee aesthetically smooth clothing, remove collar/cuff jaggedness, fix hands and face/hair realism, reproduce natural fabric drape, occlude skin correctly, automatically fit real clothing, or certify commercial distribution rights. Compare actual before/after rendered images and keep this PR in review if unexpected shape changes remain.

The two current live-UI avatars remain original low-resolution previews; the two new masters remain unapproved development alternatives. Work's photo-mask benchmarks are still without independently approved real-garment ground truth. Physical phone tests, objective user-rated rendering comparisons and legal/art review are still needed.

**No merging, deployment, purchased tools, activation of paid services, customer image uploads, or Drive Duel changes.**
