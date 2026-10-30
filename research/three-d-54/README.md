# 3D54 — natural shoulder / sleeve transition (DRAFT HOLD)

Original 3D52 technical baseline: `cc7738aa4d4c7adb89e77e0a080782bd6605ffe6` (dedicated CI 41104969662).
Parent research 3D53 snapshot: `38c689b83db0f86c9e769a3ffd80155814c4893b` (rear-hem repair; its dedicated CI must be inspected separately).

The genuine source renders showed an elevated, almost horizontal shirt crest and visible rigid cap-to-shell shading. This optional construction lowers only the high outer shoulder crest by an eased anatomical-landmark profile and rounds the neighboring shoulder/upper-sleeve triangle graph in three bounded passes. Displacements are limited to 28 mm; actual shared cap/torso points move together. It does not change rendered triangle topology, source photograph pixels, source projection attributes, UVs, skeletal indices/weights, original body geometry or either original licensed denim source. Original neckline, central photograph and cuffs stay anchored in the isolated construction. Separate cap meshes remain separate.

The existing real posed triangle contact solver runs after the construction. A common seam-normal field is restored after every solve, including cached/return poses, to remove an artificial shading crease without closing or concealing any physical gap. Both independent left/right seams must have actual indexed cap-to-shell witnesses; geometry gaps and shading are independently asserted at every sampled pose.

Opt-in: retain all previous original-photo research flags including `rear53=after`, then compare `shoulder54=before` and `shoulder54=after` on localhost in the two existing licensed denim demos. Default OFF. Both versions retain identical materials, lights, source photos, rear53 construction and camera conditions. No synthetic reverse image or new fabric texture.

## Verification

- `node --test tests/three-d-54-shoulder-transition.test.mjs`: 2 anatomical figures × 2 independent original licensed denim sources × source/25/50/75/relaxed/50/source = 28 records. Real skinned BVH shirt/body, jeans/body and shirt/jeans crossing checks, actual bilateral posed seam checks, seam-normal continuity, unchanged original body/denim/source arrays, same-rig isolated bounded displacement and central-photo anchor assertions. JSON: `benchmark/three-d-54/collision-seam-audit.json`.
- `node scripts/test-three-d-54-shoulder-browser.mjs`: genuine Chromium WebGL, 320/390/430 widths, both figures, both licensed jeans, 5 arm poses, front/side/back and shoulder closeups, both A/B versions = 384 browser frames. Requires actual pixel changes from all three angles, unchanged review gate, original source hashes and no external photo requests. JSON: `benchmark/three-d-54/browser-results.json`.
- Dedicated no-deploy workflow checks the exact PR head and fails on paths outside the eight-item research whitelist. Preserves original licensed photo source tests, 3D47 volume, 3D48 sewn seams/collar and 3D53 rear geometry regressions.

These are discrete sampled triangle surface checks, not signed watertight containment, self-collision or continuous-motion certification. Browser viewport emulation is not physical Android/iPhone testing. Pixel changes do not establish natural-looking clothing. Human visual acceptance and Family Alpha #255 remain HOLD/REVIEW until independently approved. Never merge or deploy this research. Production, staging, billing, Supabase, private photos, the 2D fallback and Drive Duel are outside this change.
