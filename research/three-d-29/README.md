# Work 67 / 3D-29: photographic V registration and original-body neck contact

DRAFT / HOLD. No merge, deployment, staging, production, accounts, cloud storage or family invites.

## Verified base

PR #434 exact `287aad20f0baaad066180d78cc44b47b76f00052`.
Its dedicated workflow [40951552482](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40951552482) passed all steps, including both Chromium comparisons and the posed contact audit. Older inherited workflows have failures and are not represented as passing.

## Implementation

The old physical neckline dropped only 28 mm and still sampled a level image row. Register the original photographed inner V using original normalized source landmarks, redistribute the upper panel without folding the ring order, and make a symmetric 100 mm physical front drop. The original photographed trim remains actual sampled RGB, not a painted strip. Source-image landmarks retain the small photographed asymmetry. Rear photo detail is unavailable and remains neutral.

`dressRest` values change intentionally in the upper panel: unchanged UV values are **not** claimed. The existing source shader, original JPEG, original transparent PNG, source hash and material remain intact. Explicit original-image landmarks document provenance. No retexturing or generated clothing details.

Resolve upper source-pose triangle interiors against original anatomical body triangles with a 5 mm sampled target and maximum 8 mm per-node garment displacement, then reuse PR432 barycentric original-body attachment. Weld normals after fitting. Original body vertices, weights and source model hashes remain unchanged. Reuse PR433 skirt drape without rewriting it; below 1.3m source coordinates and garment positions must remain byte-exact.

Comparison: `?registeredNeckline=before` returns the exact PR434 neckline/contact path. Existing independent contact/skirt toggles remain available. Replacements, removal, rollback and pose switching use the existing controller.

## Measurements and limitations

The original PR432 sparse male relaxed sample was -2.051 mm. The new denser audit probes **every** garment triangle centroid, classifies regions by undeformed world Y (not newly registered image Y), and uses the actual browser crop. It found -2.901 mm at the baseline male relaxed neckline. Initial corrected results: female source +5.000 mm / relaxed +1.975 mm; male source +5.000 mm / relaxed +2.943 mm. These are oriented nearest-body-triangle samples, not watertight signed distances or full collision validation. Full current results are in the CI artifact `posed-contact-probes.json`.

The 3D24 test explicitly selects `registeredNeckline:false` to continue verifying its original exact coordinate-preservation contract. New 3D29 tests cover the changed registration, unchanged lower skirt/body, physical bound, source identity, rollback and deterministic pose; no numeric acceptance threshold was loosened.

## Visual acceptance

Actual before/after Chromium WebGL screenshots: both figures; 320/390/430px; front, three-quarter, side and back; source and relaxed poses. Shirt/pants and removed garment controls must be pixel-identical between variants. Browser review verifies original source hashes, no outside requests, no local/session storage or IndexedDB writes, model switching, replacement/resource counts and rotation. This offline research check does not certify real account isolation, authentication, cloud restore, physical phones or recognition.

Overall visual quality remains REVIEW, pending final inspection of exact-head artifacts. The source has perspective and asymmetric trim. The white V, chest print/side registration, hard shoulder transitions and unphotographed neutral rear still require human judgment. No Family Alpha readiness claim: issue #255 remains HOLD.
