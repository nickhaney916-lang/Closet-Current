# Assignment 66 / 3D-26 — contact attachment and dress-aware body presentation

Exact baseline: PR430 `35efaadf9f80589195b261da58a5c16daa68e294`.
Research only; DRAFT/HOLD. No production or staging changes, merge or deployment.

## Changes

The existing upper dress uses a torso-dominant attachment while the original
body neck/shoulder skin deforms with other bones. `bindDressContact` finds actual
closest original body triangles and interpolates their original skin weights
with triangle barycentric coordinates, blending into the existing attachment
below the shoulders. It changes only dress skinIndex/skinWeight attributes.
Neck opening positions, topology, source photograph coordinates, material and
V-profile are unchanged by this pass. It adds no geometry or masking overlay to
hide collisions. Four-weight normalization and the same original rig remain.

The green armhole patches come from the mannequin's separate presentation
material. `installOpeningSkinAttribute` identifies original shoulder-influenced
vertices and the existing dress armhole domain on original anatomical sections.
A shared material uniform enables skin presentation in these intentional
openings only while a successfully reviewed dress is active. Central front
chest and pelvis coverage remain protected. Removal, shirt/pants and model
reload reset the uniform to full original basewear, including during async
reload. Original body positions, skin weights, source GLB and hashes are intact.

PR430 incorporated PR429's earlier head, before its final hip clearance fix.
The exact lower-hip-envelope calculation from final PR429 is reused behind the
new toggle. It fixes actual lower-back/hip breakthrough rather than recoloring
or covering those intersections. The existing dress system is not rebuilt.

`?dressContact=before` disables all three additions and reproduces exact PR430
behavior with the same body, outfit, source, camera and lighting. After is the
new attachment/presentation plus reused final hip correction. Old independent
shirt, V-neck and anatomical toggles retain their dependency guards.

## Verification

- Both original SHA-locked male/female GLBs restored by existing approved helper.
- New tests prove upper attachment changes original-body-derived weights without
  moving source garment positions, changing source mapping/index/material or
  modifying the body; finite normalized skinning and reversible poses; protected
  central chest presentation. Original shirt, V-neck, armhole, RGB/hash, rollback,
  privacy and source tests run separately in the dedicated workflow.
- Real Chromium at 320/390/430, both figures, source/relaxed poses and four views:
  96 dress captures plus 24 shirt/pants and 24 removed-basewear controls (144).
  Controls must be raw RGB byte-identical; removal restores full presentation.
  Includes trusted review, original-photo display, repeated replacement/removal,
  figure switching, pointer rotation, empty browser storage and no outside requests.
- Green-pixel detection measures unwanted presentation reduction in actual GPU
  captures; it is evidence alongside screenshot inspection, not aesthetic proof.
- Actual posed body-triangle interior probes include neck, shoulder, torso and
  hip/skirt. Before/after use matching dress topology and sample indices.
  Complete cloth/body collision remains explicitly unvalidated.
- Source/cutout/before/after, four-view and closeup sheets derive only from raw
  screenshots (labels/crop/resize); ledger records all raw hashes and code hashes.

## Limits and current assessment

Assistant visual assessment: REVIEW overall. Armhole skin consistency improves
substantially; source materials/photographs are not recolored. The original
source V piping still does not perfectly register to the physical opening, and
skirt drape remains stiff. Initial contact probes reduce female relaxed neck
flags from 3 to 0 (worst +0.70mm) and male from 11 to 1 (worst about -2.05mm,
previous -7.55mm). This residual is reported, not hidden by a relaxed threshold.
These are oriented nearest-triangle samples, not watertight signed clearance
or arbitrary-pose collision certification. No aesthetic or release PASS from
technical tests. Final exact-head CI, screenshots and grades go in the draft PR.

The inherited full 3D25 suite has a frozen exact-call-text assertion expecting
`fitAnatomicalDress(shaped,root)`. The new explicit hip option changes that call
signature; this assertion is not weakened. Its compatible behavioral/privacy
cases run in CI and its full result is reported separately. Older stage-specific
scope guards remain separate from the new strict source-only guard.

No source JPEG/PNG, garment recognition, original model, account/storage,
private photos/accounts, paid services, production/staging or Drive Duel edits.
Family Alpha #255 remains HOLD for its separate actual release requirements.
