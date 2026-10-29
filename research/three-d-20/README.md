# 3D-20 — continuous photographed-shirt fit (DRAFT / HOLD)

Exact baseline: PR #421, `5deb26e55cac8e40fa4d286ac5925a58cdfb97f9`.
This branch changes the experimental 3D showroom only. No merge or deployment.

## Root causes and implementation

The prior shirt is an offset/clipped anatomical surface. Its local normals and
breast/waist concavities create shoulder ridges, separate-looking chest lobes,
stiff flared hems and loose tubular sleeves. The earlier cuff strips cannot
correct that whole surface. The original source photograph itself contains
folds and lighting; projecting it onto a differently shaped surface also retains
those baked shadows.

The new continuous fit pass welds coincident positions for relaxation while
retaining every original UV/photo coordinate, triangle, skin index and weight.
It builds a local bounding-volume hierarchy of the actual body triangles,
queries closest points on triangle interiors, and relaxes shoulders/sleeves
toward an eased surface. The torso uses one rounded superellipse envelope to
bridge anatomical concavities, with gradual chest/shoulder blending. All
movement is bounded to 35 mm in the normalized 2 m display space. The existing
neck opening is protected from being pulled down toward the chest.

This changes the separate skinned garment, never the body material or body
vertices. Original shirt shader, source JPEG, transparent PNG, hashes, license,
review gate, skeleton and neutral-only inferred rear are retained. No new
fabric images or cuff strips. Earlier independent cuff geometry stays present
and participates in the same surface fit. Existing pants and dress are unchanged.

`?naturalFit=before` disables only this pass. Both comparison versions retain
the same PR421 improvements, model, source, camera, lighting and pose.

## Verification

- Node tests: real SHA-pinned female/male GLBs; byte-identical body, source panel
  and skin attributes; bounded real movement; shared 163-bone rigs; pose reversal,
  replacement/removal and geometry disposal. Analytic transformed-box test
  distinguishes triangle-interior queries from nearest-vertex sampling.
- Browser: actual Chromium WebGL2, 320/390/430 CSS px, both figures, reviewed
  licensed shirt + neutral pants and separate licensed dress, source/relaxed
  poses, front/three-quarter/side/back. 192 raw GPU captures, source SHA checks,
  trusted-click review refusal, no external requests, exclusive dress, stable
  resource counts across repeated replacements and complete removal.
- Comparison builder labels/resizes actual 430 px captures into four sheets and
  records screenshot and fit-module hashes. Raw mobile captures stay in CI artifacts.

## Visual acceptance and limits

Final screenshot grades and exact CI references will be recorded in the PR.
Pixel changes and green tests are not human realism approval.

The triangle query constrains the original source pose. It is not a signed solid
intersection solver, sewn-panel reconstruction, cloth simulation or arbitrary-pose
collision guarantee. `collisionValidated=false` remains explicit. The original
photo's perspective and shadows cannot be removed without changing the image.
No unseen photographic back is available. The unchanged dress remains stiff and
broad at its upper bodice. Physical phone and account/storage/security gates are
outside this local prototype. Four-person Family Alpha stays **HOLD**.

## Exact approved model recovery and parallel work

Parallel PR #422 owns read-only deformed wrist contact analysis; this branch does
not copy or change that implementation. It identified changed publisher-download
bytes. The two locally cached CC0 GLBs independently pass the original immutable
SOURCES SHA256 values and all real-rig tests. Losslessly compressed originals are
kept in fixtures/ for reproducible no-network model setup, with no repinning:

- Male: d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8
- Female: a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1

The unchanged publisher source/CC0 license links remain in
[the original source manifest](../three-d-06/fetch-licensed-avatars.mjs).
restore-approved-models.mjs checks the decompressed original SHA, size bound and
GLB structure before writing a test fixture and records provenance in CI. These
are approved adult anatomical 3D assets, not any personal wardrobe/account data.
