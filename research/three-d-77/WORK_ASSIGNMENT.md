# CLOSET CURRENT 3D-77 — TRUE SKINNED DENIM / ANATOMICAL BODY TRIANGLE CONTACT

**Owner main-development priority, 2026-10-31 PT.** Research-only, Family Alpha Issue #255 **HOLD**, production untouched.

## Why
3D73–3D76 photographed denim geometry, bodySurface nearest-triangle oriented guards, cloth folds, and source-protected smoothing are real, but nearest source/rest surface clearance is not the same thing as *actual skinned 3D triangle intersections*. Another micro-offset without measuring genuine contact would risk cosmetic progress with undetected body clipping.

## Main research implementation
- Use **existing verified** PR #491, source commit `61eb0b2a7d5bfa3300aad220ce394ab0cceda711` (dedicated source true WebGL Actions #41275703672 SUCCESS), and exact public licensed photographed denim sources with original photo shirt and 163-bone CC0 male/female.
- `research/three-d-77/true-skinned-denim-body-intersections.mjs` uses **posedGeometry**, **true 163-bone bone-transformed world positions**, and real **MeshBVH triangleContacts** against *actual anatomical body triangles* (not rigid mannequin cylinders). Read-only intersection counts, the original source-photo-sensitive front versus unphotographed source-neutral rear, leg side/section, and localized oriented face depths. Missing source, skeleton, original UV/skin/rest or malformed triangle attribution **fail closed**. Exact original source texture/JPEG/alpha/UV/rest/front/skin/position arrays unchanged.
- `photoDenimContactAudit77=false` by default, enabled only for localhost research via `?denimDrape73=after&calf74=after&folds75=after&continuity76=after&contact77=on`. Off is the same 3D76. No GUI or production changes.
- Dedicated no-deploy strict approved paths / exact 3D76 ancestor, old source and unit tests and **48 genuine WebGL snapshots**, before/after the read-only audit across male/female × 320/390 mobile × 2 independently sourced photo jeans × original front/side/rear camera. Validate the diagnostic changes **no garment render**: all per-angle before/after changed pixel counts at most 16. Report 8 actual skinned body/jeans collision counts. All photograph SHA identities and shirt/denim swap preserved.

## What this does NOT solve
This milestone is a quantitative **collision diagnosis**, not a fabric draping solver or visual improvement. A nonzero count means actual skinned triangle contact needs repair; zero counts are **only the sampled source/current pose**, never universal non-collision. Triangle local oriented face depths are NOT watertight signed penetration, do not use as an anatomical collision certificate. This intentionally never changes the true photo-verified front or fabric. No fake source backside; no generic family-photo 3D. Human visual photorealism remains REVIEW and real physical Android/iPhone NOT TESTED.

Parallel #1 recognition; #2 independent visual QA; #3 dresses; #4 data reliability; #5 styling; #6 shoes; #7 shirt contact independently remain separate. No merge, production/staging, auth, billing, Supabase, family photos, Drive Duel, Delta Ebb.
