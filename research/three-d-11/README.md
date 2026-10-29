# Work59 / 3D-11 — targeted shirt geometry refinement (HOLD)

Independent branch from Work58 / PR405 `7d05929a1a06d80d04a4ea000c419d30761c3c8c`. Reviewed PR400 `89c4808cba4e790ae4fe7d268ada81ef3c90d966`, PR402 `539552b9aafbd777bd40b5862d096de11fc989a8`, main-thread PR404 `b1b3a306aeba7ce490b0f4d4305813e736117bda` and their documented exact-head evidence. Re-rendered the verified Work58 geometry in the same studio as the baseline, including new three-quarter captures. No predecessor branch/file is modified.

## Working changes

`natural-drape.mjs` calls the unchanged Work56 builder, then modifies **only the independent garment's rest geometry** before Work58 applies the shared skeleton pose:

- Reduce upper-shoulder offset by up to 23 mm and lower its crest slightly. Actual body proportions and source vertices do not move.
- Expand torso cross-sections outward to bridge the bust/waist concavity, with varying width/depth and armhole fades, rather than fitting another fixed-radius cylinder. The female front/side now hangs more continuously beneath the chest. Add slight side hem fullness.
- Add 6 mm radial forearm ease using the existing elbow/wrist bones, preserving source skin weights and cuff openings. This does not eliminate the inherited inner-cuff sliver.
- Add an annular neutral collar band connecting the existing neckline boundary to a neck-landmark contour. It shares the original material and skeleton; **no extra texture** and no invented collar/back photograph. 296 male / 272 female extra triangles.
- Smooth coincident garment normals. Rest-position photo coordinates follow the refined geometry at the existing physical pixel aspect, then stay fixed while bones change pose. Original RGB, alpha mask, crop and SHA checks are unchanged.

The thin collar has no simulated ribbing; this remains inferred, source-textured geometry, not sewn cloth or measurement-specific fitting. The base 18 mm offset no longer implies a verified minimum after refinement: `minClearance` is explicitly null and `collisionValidated` false.

The new preview adapts Work58's controller/renderer with a single fitting hook. `?version=before` calls the unchanged builder; default/`?version=after` applies the new post-fit module. Lighting, camera, photo and pose are the same between comparisons. Existing Work56, Work57, Work58, PR404, recognition, photos/cutouts, auth and storage stay unchanged.

## Actual verification

- **14 functional Node tests**, including existing canonical Work56/shared-skeleton and source RGB/hash tests. New tests verify real geometry changes, added collar, measured forward waist expansion over 10 mm, normalized weights, pose reversal/rest UV stability, original body positions, shared rig and disposal. The old Work58 single-branch path guard is replaced with a 3D11-only guard; no functional test is weakened.
- **Six real Chromium WebGL2 / SwiftShader journeys**: before/after at 320×568, 390×844, 430×932; both figures, original/relaxed poses and front/three-quarter/side/back = **96 actual screenshots**.
- Trusted review/apply, corrupted cutout refusal, repeated pose and remove/reapply, model reset, real touch drag/pinch, canvas aspect, controls without primary scrolling, no horizontal overflow, zero external requests, and zero idle GPU redraws after camera damping settles checked (bounded quiescence wait, not a fixed sleep).
- Before: 11 geometries/3 textures. After: **12/3**. Clear: **9/2**, stable across repeated cycles. Shirt triangles rise from 19,664→19,960 male and 19,543→19,815 female; source bodies remain 109,064 triangles/163 bones.
- **24 front/rear print checks** verify visible central AJ detail and neutral central rear in both versions/poses/all widths. All 48 paired view comparisons must change real framebuffer pixels. These are regression checks, not automatic visual approval.

`evidence/` contains both full comparison sheets and measured results. PNG readback timings include synchronization/encoding/cold shader work, not native-phone FPS. Safari, physical-phone performance, live accounts/RLS/backup and continuous arbitrary-pose collision are not tested here.

## Visible defects — implementing-assistant screenshot review

| Area | Male | Female | Observation |
| --- | --- | --- | --- |
| Attachment / source identity | PASS | PASS | Separate real-photo garment stays on the same rig through the two poses; no front logo duplicated behind. |
| Shoulder fit | REVIEW | REVIEW | Lower crest/less padding; silhouette is still simplified and not a sewn shoulder seam. |
| Collar | REVIEW | REVIEW | New band narrows/closes the old opening; boundary still looks angular at close range. |
| Chest/waist/side hang | REVIEW | REVIEW | Broader hanging contour visibly reduces under-chest indentation; still stiff and not physical cloth. |
| Forearm/cuff clearance | FAIL | REVIEW | Thin inherited skin sliver remains at male inner cuff in three-quarter view; no collision-free claim. |
| Hem / sleeves | REVIEW | REVIEW | More ease/fullness, but no tailored seams, elastic cuffs or simulated folds. |
| Overall fabric realism | FAIL | FAIL | Photo folds remain shading on a smooth shell; front/side material transitions remain visible. |

**Overall REVIEW / Family Alpha HOLD.** Visible incremental improvement, not a finished realistic garment or independent human/owner acceptance. No new 15-photo quality PASS.

## Reproduce and integrate

```sh
npm install --no-save --no-package-lock --no-audit --no-fund sharp@0.34.3 three@0.180.0 playwright@1.56.1
npx playwright install chromium
node scripts/build-work47-benchmark.mjs
node research/three-d-06/fetch-licensed-avatars.mjs
node --test tests/three-d-06-anatomical-models.test.mjs tests/three-d-07-source-rig.test.mjs tests/three-d-11-drape.test.mjs
node --test --test-name-pattern='canonical Work56|Original stock source' tests/three-d-09-integration.test.mjs
node scripts/test-three-d-11-browser.mjs
node scripts/test-three-d-11-evidence.mjs
```

Serve repository root on loopback; open `/research/three-d-11/index.html`. Use existing frozen benchmark history and exact CC0 GLBs; setup is unchanged from Work58. CI reconstructs the same licensed assets and verifies hashes. No new source photographs or masks are made.

For main-thread PR404, review only `refineGarment(shirt, normalizedSourcePoseRoot)` at its existing canonical fitting boundary, before restoring relaxed pose. Do not copy the experiment wholesale or modify original geometry. Keep the exact source loader/review, existing material, shared skeleton and disposal handles; the new collar is appended to the original garment mesh array so existing disposal removes it too.

**Next priority:** fix the source cuff cut boundary/inner-forearm sliver and validate intermediate arm poses, then replace the remaining shoulder/side shell with sewn-panel geometry and better geometric fold transitions. Keep release on HOLD pending independent visual and real-phone/account gates. No merge/deploy, staging/production, Supabase/auth, private wardrobe/photos, paid service, tester invitation or Drive Duel change.
