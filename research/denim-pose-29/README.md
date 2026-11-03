# DENIM-POSE-29 — Authentic photographed denim: recover source rest after actual knee motion

**Draft HOLD; no merge, no production, no Family Alpha.**

Source base: P28 PR #546 exact successful research commit `8c124e76a3a8f51341cfb0af840761b7bfb71597`. P29 is separate from E2E-INTEGRATION-01 PR #547, capture PR #545 and recognition/indexing branches.

## Finding

The existing full 163-bone denim outfit controller restores its source-neutral P28 fitted geometry when real 3D78/79 knee pose is changed, leaving the improved fit no longer active; the static query flag alone can obscure that fact. It must never be advertised as a certified fitted moving garment.

## Solution

- `source-locked-pose-state-29.mjs`: fail-closed source SHA-256, original photographic-provenance and zero actual skinned BVH contact decision contract, distinguishing **SOURCE_FIT_RESTORED** from **BENT_SOURCE_ONLY** and unapproved fallback.
- New `sourceDenimPoseGuard29` research option, requires original P28 static fitting + actual 3D78 and 3D79 flex. Defaults OFF. Existing front JPEG/RGB, source UV, skin weights, mesh construction and source-neutral P28 silhouette are never rewritten.
- On knee bend the existing P28 frozen static rest mesh is explicitly restored before genuine 3D78/79 anatomical pose application. Viewer marks the bent pose as **source-only, not P28-fitted**, with no false claim of cloth simulation.
- On returning to the original 163-bone source pose, P29 may recalculate P28 source rest fit **only** after verifying that same licensed denim SHA and comparing genuine posed-BVH before/after body contacts. Any failed recovery leaves an explicit source-only review fallback, not a fabricated success.
- Research-only owner/SHA-bound `window.ccWardrobePoseProbe29`, never external image uploads or real user photos.

## Browser and CI acceptance

- Real locally restored CC0 163-bone anatomical male/female GLBs.
- Two genuinely originally photographed licensed jeans sources and strict SHA identities.
- `320/390/430 × 2 rigs × 2 source jeans × 4 actual knee poses × 2 side/rear camera angles` = **96 genuine Chromium WebGL source frames**.
- All three bent poses must be visibly marked no P28 static fit. Source pose return requires independently certified restored P28 fit, original front unchanged and zero actual knee-to-body crossings.
- 96 screenshot SHA-256 checks and 12 side-by-side four-pose contact sheets; no synthetic source or fabricated rear photographs.
- All existing P25/P26/P27/P28 safety/unit regressions pass; no production or sibling-branch edits.
- P29 cannot establish true time-swept fabric physics, continuous collision safety, 10/10 appearance, device-native camera performance or physical phone acceptance. Those remain **HOLD**.

Final SHA and dedicated no-deploy Actions SUCCESS must be independently verified before marking research task complete.
