# Closet Current — Mission 2, actual posed triangle-contact audit

**Status: RESEARCH ONLY — Family Alpha HOLD #255. No merge, deployment, staged or production changes.**

## Verified starting point

Stacked on independently verified draft PR #838 exact HEAD
`c932b8fbd0a5b891f4f3bf6fdd737ad4642afa94`, NO DEPLOY CI
#42962737097: three jobs success, 1,514 Node tests, actual Chromium/WebKit
320/390/430 visual pixel checks across both 163-bone figures.

## Critical defect

The previous geometric safety gate returned only the number of skinned
**mesh/body pairs** with at least one intersecting triangle. A value of
`3 -> 3` did not imply that all 3D triangles remained safe. A garment could
develop many new triangle penetrations without adding a new mesh-pair witness.

## Added implementation

- `measurePosedTriangleContacts`: rebuild actual posed 163-bone body and
  garment world-space triangle BVHs per measurement; enumerate EVERY actual
  BVH triangle intersection with a bounded 40,000-contact ceiling. Preserve
  source positions, panel position, JPEG, owner session and skinning.
- Resolve identities using stable indirect BVH triangle indexing and mesh
  identities. `comparePosedTriangleContacts` detects newly crossing
  triangles even when aggregate counts happen to tie.
- Fail closed on missing body, mismatched staged coordinates, excessive
  contact budget, malformed/duplicate witnesses.
- `fitSourceLength` optionally measures the actual source baseline and
  staged source-length geometry before mutation. `strictTriangleContacts`
  additionally refuses new triangle contact when explicitly enabled.
  The real-browser QA starts **diagnostic mode only** to measure the
  outstanding existing licensed-photo deficits before deciding adoption.
- Genuine Chromium/WebKit at 320/390/430 should report the real source
  photographed-garment triangle counts alongside existing 2D source
  geometry integrity, original photo, distinct dual-humanoid pixels and
  inherited collision mesh-pair checks. Synthetic tests explicitly
  prove a mesh-pair unchanged while new triangles penetrate.

## Honest certification boundaries

This improves **one sampled skeletal pose** only. Mesh triangle intersections
do not detect complete garment containment, nearly touching signed clearance,
cloth body motion between samples, self-intersection or collisions with all
other wardrobe layers. It cannot reconstruct unphotographed rear fabric.
No arbitrary photographed garment categories, blind independently reviewed
owner silhouettes, physical-phone memory/fps, photorealistic cloth or 10/10
visual approval are established. This does **not** complete Mission 2 or
authorize family alpha.

## Final verification

The exact-head GitHub Actions run, actual browser receipts and before/after
triangle counts must be recorded here **after** the CI run. Do not claim green
until confirmed by exact commit and all three jobs.
