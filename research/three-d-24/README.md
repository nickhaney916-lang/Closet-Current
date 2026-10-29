# Assignment 65 / 3D-24 — anatomical sleeveless dress (DRAFT / HOLD)

Exact baseline: PR427 `417cdb648c743771d93b4c6b51ff30dc2bba0d9c`.
This is an isolated research showroom change; no merge or deployment.

## Findings and implementation

The original licensed sports dress is sleeveless. PR427's nine circular rings
form a closed shell across the arms; upper radii derive from hip width rather
than shoulders, and large symmetric rear radii make a rigid barrel. All upper
vertices also use the same original torso attachment. A shallower V alone cannot
fix these structural problems.

`anatomical-dress.mjs` intersects actual original body triangles with horizontal
planes, finds an interior sagittal axis from those same sections, and measures
radial triangle intersections. It fits a subdivided bodice and waist with 18 mm
radial ease. Below the hips, a continuous modest A-line flare replaces the large
hip-derived cone. The original dress length and source-photo mapping remain.

Two real armholes are clipped out of the side topology using each original
upper-arm shoulder landmark. The shoulder contour now follows the original
body instead of covering the deltoid with a solid cap. Open neck, armhole and
hem edges receive 3 mm neutral thickness; no invented sleeves, painted seams,
rear logos, artificial wrinkle waves or cover strips are added.

PR427's original V-height/drop profile is retained at every original top-ring
source coordinate. X/Z attachment follows the actual neck section as part of
the shoulder/bodice fit; this is not another deeper V-cut or white-trim edit.
Source JPEG, cutout, shader/material object and source identities are unchanged.
New subdivided/clipped vertices interpolate the original dressRest mapping and
existing skin weights; buffers have different lengths, so they are not falsely
claimed byte-identical. Back and unphotographed sides remain inferred neutral
source-median material. No photographic detail is invented for those regions.

## Evidence and regression

`?dressAnatomy=before` disables only this pass while retaining the verified
PR427 neckline, body, source, camera and lighting. The after variant enables it.
Both use original SHA-locked male/female GLBs restored by the existing approved
PR423 helper; no replacement model or hash repin.

- New tests use both actual original rigs; verify preserved V-height/source
  coordinates, exactly four nonbranching opening loops, normalized valid skin
  weights, unchanged body, real triangle-section contact, source hashes/every
  visible original cutout RGB byte, rejection/rollback, replacement/removal and
  resource disposal. Five unchanged PR427 neckline tests also run.
- Browser matrix: both rigs × 320/390/430 CSS px × before/after × source/relaxed
  × front/three-quarter/side/back = 96 raw dress captures. Another 24 front
  shirt/pants controls must be pixel-identical. Includes original-photo review,
  trusted review gate, repeated dress replacement, removal, figure switching,
  pointer camera rotation, stable resources, empty browser storage and no
  external requests. Physical phones and remote account privacy are not tested.
- Posed-contact audit deforms actual body and garment vertices with their shared
  original skeleton, probes dress triangle interiors against posed body triangles
  and reports oriented nearest-triangle distances by region. Different mesh
  sampling densities mean counts are not a paired statistical comparison.
  This is neither watertight signed distance nor full triangle collision proof;
  fullCollisionValidated=false remains explicit.
- Comparisons show original photo, provisional cutout, exact baseline and
  candidate, plus full four-angle sheets and shoulder/armhole closeups. All
  images are genuine raw Chromium captures with labels/crop/resize only. Ledger
  hashes all raw PNGs; source attribution is included.

## Visual acceptance and limits

Final exact-head CI, screenshots and per-area grades are recorded in the draft
PR after examination. Automated geometry PASS cannot award appearance PASS.

The fit is still procedural tailoring, not sewn-panel reconstruction, user size
prediction, cloth simulation or arbitrary-pose collision clearance. The source
photo has baked folds/perspective and only a front view. The retained shallow
physical V and printed white trim are not forced into false alignment. Opening
edges and neutral inferred rear can still look synthetic; underlying mannequin
modesty material may be visible at armholes. These are explicit visual review
items. Existing shirt fitting, PR426 work, pants, source recognition, app/account
storage and production/staging are outside this branch's changes.

No old tests or source/model hashes weakened. Historical stage-specific scope
checks and unrelated CI failures must be reported separately. Family Alpha #255
remains HOLD pending actual release evidence and owner authorization.
