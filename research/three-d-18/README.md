# Closet Current 3D-18 — source-neutral anatomical wrist-hem bridge (HOLD)

**Starting point:** exact verified 3D-17 draft [PR #419](https://github.com/nickhaney916-lang/Closet-Current/pull/419), `4be8264d5d1cec05735a13b9faad879fbae4e583`. The owner wants a convincing 3D human wearing real photographed clothing, with no lengthy detour into 2D avatar polishing.

## Screenshot-led defect

The successful [3D-17 before/after CI #40896549191](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40896549191) showed an improved black inner cuff rim on the original photographed AJ shirt, but a **prominent pale skin wedge remained between the sleeve and hand** on both original adult CC0 rigs. Additional small untargeted sleeve changes risk destroying original photo/fit. This is a limited garment hem continuity experiment.

## Implementation

- `research/three-d-18/wrist-hem-bridge.mjs` takes **only** the verified 3D-17 neutral facing, inspecting its actual `SkinnedMesh` source-pose vertex layout and two wrist axes from source CC0 bone names. Each original inner-boundary edge is continued by **9mm along the actual anatomical forearm→wrist axis and 0.8mm radially**, capped at 12mm/2mm for parameter safety. No guessed wrist cylinders, no closed hand cap, no new source image.
- Extension is its own real `THREE.SkinnedMesh`, bound to the original shared 163-bone skeleton, reusing original cuff-facing material and the exact inherited 4-component skin weights. `panelPosition=(0,-99,0)` forces the source-verified black *neutral original-photo median*: **no extra AJ logo, invented pixels, new colors or changes to original JPEG/transparent PNG**.
- New independent garment geometry only. Source shirt mesh, 3D-16 cuff correction and 3D-17 inner-facing mesh must stay byte-identical. All humanoid geometry remains untouched. The atomic Work61 controller owns replacement/disposal; selecting neutral pants, dress or no clothing removes and disposes the new hem safely, without destroying the shared skeleton.
- The research URL `?cuffBridge=before` disables **only this 3D-18 continuation**, so both before/after screenshots retain exactly the same earlier 3D-16 cuff fit, 3D-17 facing, verified AJ shirt, neutral pants, anatomical model, camera and pose.

## Testing and release boundaries

A strict new **8-file research-only** no-deploy GitHub workflow reconstructs the historic licensed **15 original Work47 photo sources** and provisional mask assets from exact pinned commits, downloads both exact-SHA256 verified commercial-reusable CC0 rigs, then runs Node tests on each adult rig. The tests prove actual indexed geometry and source-bound neutral material, 2 genuine wrists, 9mm bounded movement, unchanged original shirt and 3D-17 facing geometry/panel position/normals/skin weights, unchanged anatomical body, pose reversal and garment disposal. Reject oversized offsets and missing face/rig.

The actual Chromium WebGL2 browser runs six paired **320/390/430 mobile-width × female/male** views of before/after at the exact same camera. It checks source review click must be trusted, licensed JPEG+PNG original SHA identity, black front shirt and neutral pants, actual GPU changed pixels, source pose/side turn, no external network, same view size, before/after labeled screenshots and JSON in `THREE-D-18-WRIST-HEM-BRIDGE-HOLD`. This only proves real new garment geometry, not that the pale wedge is gone.

**Human visual acceptance remains HOLD.** Work #55 independent review and Work61 integrated real outfit development continue separately. We will inspect both cuffs before claiming an aesthetic improvement. `minClearance=null`, `collisionValidated=false` and `releaseAuthorized=false`; a generic small hem does not guarantee garment collision clearance, true cloth drape or real body measurements. The independent 15-photo visual baseline remains 0 PASS / 5 REVIEW / 10 FAIL until actually regraded. No 2D algorithm changes, customer photos/accounts, original image edits, production/staging, merges/deployments, purchases, model fees or Drive Duel changes. The four-family Alpha remains HOLD pending real phones, owner-scoped JWT/RLS and cloud save/restore.
