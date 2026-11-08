# Priority #60 — Photographed Garment Anatomical Fit Integrity

**Status: partial research delivery; not a complete photo-to-garment fitting system. Family Alpha remains HOLD (#255). No merge, staging change, production change, or owner wardrobe access.**

## Implemented

`research/photo-garment-anatomical-fitting-60/fit-contract.mjs` admits four reviewed public source fixtures by exact original SHA-256: one shirt, one dress, and two denim photographs. Before a source-photo garment can receive the existing P164 material pass, it checks that:

- Source identity matches the allowlisted original photograph and the garment records attached photo pixels.
- Each mesh is skinned to the same loaded 163-bone body skeleton.
- Positions and triangle indices are valid and finite.
- Bone indices are in range and per-vertex weights sum within 0.025 of one.
- Research-only state is preserved.

The receipt is metadata only. It does not change vertices, UVs, textures, or material references. Unknown and private photos fail closed to the existing original-photo 2D path. Rear details remain marked inferred/unverified.

The installer adds a local-only donor browser assertion and permits only the locally installed `three-mesh-bvh` package through the test server. External browser requests remain blocked. The dedicated no-deploy workflow reconstructs the exact P541 donor and emits the benchmark source manifest, browser screenshots, comparison gallery, and audit JSON as a downloadable Actions artifact.

## Verification

- P60 contract unit suite: 5/5 passed.
- Full inherited test suite before the final browser-harness adjustment: 1,331/1,331 passed; application build succeeded.
- Local Chromium/WebGL donor suite: 6/6 viewport-mode groups passed (before/after × 320/390/430 CSS px), both humanoids, photographed shirt and dress, source/relaxed poses, four camera views, outfit swaps, touch rotation/pinch, stable resources, SHA checks, and blocked external requests.
- Evidence audit: 192 view screenshots, 12 mobile screenshots, 48 source-print checks, and 96 paired pixel comparisons passed. This used Chromium with SwiftShader; it is browser-rendered research evidence, not physical phone acceptance.
- Exact-head GitHub Actions regression and WebGL run for the final commit: pending.

## Supported and unsupported scope

| Area | Current evidence |
|---|---|
| Existing photographed shirt, dress, denim sources | Integrity gate is implemented; source-mapped shirt and dress were included in local WebGL checks. Denim passes contract tests but is not included in the outfit viewer browser matrix. |
| Anatomical landmarks, collision correction, new garment geometry | Not implemented by P60; the receipt validates the existing P541 mesh and skeleton binding only. |
| Natural cloth simulation, pose deformation, new wrinkles | Not implemented by P60. Existing renderer poses and source geometry are exercised; this is not physical cloth behavior. |
| Arbitrary owner photos, blouses, skirts, shorts, jackets, footwear | Not verified for 3D; retain the original-photo 2D fallback. |
| WebKit, physical Android/iPhone, memory and FPS | Not verified in this assignment. |
| Independent human realism review / 10/10 | Not performed and not claimed. |
| Hidden rear surfaces | Inferred, not photo verified. |

This work improves the admission and browser-verification boundary around the existing fitting pipeline. It does **not** complete the requested 10/10 photorealistic reconstruction or full category pipeline. The image gallery and exact CI evidence will be attached to the PR when the new exact-head run finishes.
