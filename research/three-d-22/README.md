# Assignment 64 / 3D-22 — neckline and front-to-side continuity (HOLD)

Base: exact PR423 `926c85ebf9d2d29c919771f3dcd6c1527208b63c`.

The PR423 screenshots expose an angular, broad collar and a photographic front
ending abruptly against neutral sides. This research pass changes the actual
existing separate skinned shirt geometry and its source-photo material.

## Implementation

`neckline-seams.mjs` samples radial intersections with the original anatomical
body triangles at the neck landmark. It reshapes the existing collar triangles
around that neck section with 7 mm ease and a 12 mm band, then blends the same
outer-boundary displacement into the neighboring shoulder surface over 75 mm.
It adds no cover strips, caps or fabricated patterns. Movement is bounded to
65 mm in the normalized two-metre display space. Original topology, source
panel positions/normals, rig and skin weights are retained. Sleeve/cuff and
lower torso vertex positions remain identical to PR423. This is local rest-pose
tailoring, not a collision-free arbitrary-pose cloth simulation.

The existing photo shader retains the same original texture, crop and UV sample.
A spatial feather blends only the front perimeter toward the already established
source-median neutral cloth. The central logo sample remains unfiltered by the
new feather; some peripheral photographic detail is attenuated at the seam.
No JPEG, PNG, original RGB byte, hash, cutout or recognition algorithm is edited.
The original-photo review/fallback remains available. The neutral back is inferred
material; it is not a claimed photograph of the unseen back.

`?necklineSeams=before` disables only this pass, retaining PR423's fit, cuff,
source, camera and lighting. `after` enables it. The same source/relaxed poses
and two original anatomical rigs are used for comparison.

## Reproduction

Use the existing exact-original `research/three-d-20/restore-approved-models.mjs`
and gzip fixtures; do not change original model SHA pins or duplicate PR424.
Rebuild the established Work47 benchmark and install the same pinned Three,
Sharp and Playwright versions used by the dedicated workflow.

```
node --test tests/three-d-22-fit.test.mjs tests/three-d-20-fit.test.mjs
node --test --test-name-pattern='Stock-only|Both garment cutouts' tests/three-d-15-outfits.test.mjs
node scripts/test-three-d-22-browser.mjs
node scripts/build-three-d-22-visual-qa.mjs
```

The browser matrix generates 192 raw Chromium WebGL2 captures: before/after ×
320/390/430 × female/male × shirt-pants/dress × source/relaxed × four views.
It checks trusted review, unchanged SHA identities, identical dress-control
pixels, replacement/removal counts, figure switching, mobile pointer rotation,
empty local/session/IndexedDB state and zero external requests. Labeled full
comparison sheets and neck/shoulder closeups are resized/cropped raw screenshots,
not synthesized images. The ledger records screenshot and module hashes.

Dedicated geometry tests compare both actual approved GLBs and ensure unchanged
body, photo coordinates, skinning, sleeve/cuff positions and bounded collar
movement, reversible poses, replacement/removal and disposal. The inherited RGB
regression compares every visible cutout pixel against its decoded source JPEG
and rejects corrupted source bytes. Research browser state is ephemeral; these
checks do not certify remote account isolation, cloud restore or physical phones.

## Visual acceptance

Assistant visual inspection: **REVIEW**. Neck fit is closer and the rectangular
front perimeter is softened. Original black fabric and AJ print remain visible.
Remaining problems, in priority order:

1. Baked photographic folds/light still read as a different surface at oblique
   angles; side transition is softer but not an actual reconstructed sewn seam.
2. Collar/shoulder contour still needs refinement; no sewn ribbing/cloth tension
   or complete posed garment-to-body triangle collision guarantee.
3. Unseen back remains explicitly neutral inferred material.
4. The photographed dress remains broad and rigid; unchanged in this assignment,
   it is the next major visual task. Do not call unchanged dress a new fit PASS.

Historical 3D15–18 suites contain stage-specific mesh-count, geometry and source
scope assertions. Their complete results must be reported separately from the
new dedicated suite, never weakened or advertised as green. Local full historical
3D15–20 run on exact PR423: 12 pass / 9 fail; candidate with four new tests:
16 pass / the same 9 fail. The focused compatible suite passes 8/8, with
two inherited source-RGB/privacy tests also passing. No old assertions edited. Exact-head CI and
artifact URLs are recorded in the draft PR after verification.

No production/app/recognition/auth/cloud/source-image edits, merge, deployment,
paid per-outfit services, real customer photos or Drive Duel changes. Family
Alpha #255 remains HOLD pending actual release evidence and owner approval.
