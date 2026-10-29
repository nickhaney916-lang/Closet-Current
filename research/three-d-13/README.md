# Work60 / 3D-13 — separate neutral pants + verified real AJ shirt (HOLD)

Independent base: Work59 PR408 `d09786163eb52a4a0fa05a5ffc546fc171896080`.
All tracked changes are NEW files under 3D13, its tests and its read-only no-deploy workflow. Existing shirt, pose, benchmark, model and application files remain byte-identical. Reviewed related PR400/402/405 lineage, independent QA407, mobile410 and photo-fallback411; none is edited or duplicated as an optimization/fallback/QA assignment.

## What runs

The actual male/female CC0 163-bone GLBs wear the unchanged Work59 separate photograph-bearing shirt plus **one new separate SkinnedMesh for pants**, sharing the original skeleton, bind matrix and interpolated four-weight skinning. The original photograph is still the AJ shirt; the pants are explicitly **neutral research cloth, NOT photographed jeans**.

`pants-shell.mjs` selects the continuous primary anatomical body, filters triangles and fit samples by pelvis/leg/lower-spine skin ownership, cuts an open waist at `spine04 + 6 mm` and two ankle hems 38 mm above `footL/R`, offsets original surface normals by 18 mm, and uses varying body-slice leg/pelvis envelopes for fabric ease. The waist envelope tapers under the existing shirt. A 3 mm inward rim gives opening edges thickness; no cap bridges the two leg holes. This is reused anatomical topology, not cylinders or flat photo cards. Male **11,959** / female **11,831** pants triangles; one geometry, one matte solid material, **zero extra textures**. The observed source-pose surface has no unmatched boundary edges other than waist/ankles; that is NOT a collision or drape guarantee.

`canonical-pants-fit.mjs` captures source normals **before** Work57 presentation smoothing, fits in source pose, then restores display normals and selected pose in `finally`. Smoothing normals only for display must not steer garment geometry. The showroom briefly detaches pants while calling the unchanged shirt fitter, then restores them in `finally`; the historical shirt body scan must never mistake pants for a body mesh. Shirt topology remains male19,960 / female19,815 triangles. Pose changes update bones without rebuilding either garment or reuploading the verified source texture. Removing either garment leaves the other intact.

The initial rendered prototype incorrectly included hand-height samples and formed a floating waist band; source bone ownership now excludes those samples and triangles. A subsequent male groin penetration exposed accidental use of display normals; canonical original-normal fitting fixed the gross exposed patch in the final observed views. Both failures were found in actual rendered images, not concealed by passing tests. Those rejected development frames are not presented as final comparisons.

## Pants photograph gate

The existing 15-image Work47 benchmark contains **commons-0021**, `Jeans for men.jpg` (public domain / Honeyhuyue), original SHA256:
`04c0ca5bed1bee26e83be98b9a992619b0777811a7fb8a99fe955939334bbd8c`.
Its waist is occluded; `hasCutout=false`, visual FAIL, no reliable transparent pants cutout. Other locked jeans entries (0023/0024) are not prepared benchmark cutouts and are not silently downloaded/isolated here. The skirt and shorts do not substitute for pants.

`pants-source.mjs` reuses the existing SHA-verifying reader to show the **original reference only**. It checks locked identity, licensing, HOLD/review state and never enables photographic pants material, even if a future manifest happens to contain a mask. No synthesized mask, new isolation, inpainting, invented pocket/back print, sampling a clothing person's skin/background, or unverified photo colors. Neutral slate is a declared research choice, not source-matched denim. A future valid mask needs explicit orientation, original-RGB, waistband and panel mapping review before enabling real pants texture.

The AJ original SHA256 stays:
`cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64`.
Both CC0 GLB SHA identities are unchanged and independently checked by existing model tests.

## Preview / reproduce

With the existing pinned benchmark history available:

```sh
npm install --no-save --no-package-lock --no-audit --no-fund sharp@0.34.3 three@0.180.0 playwright@1.56.1
node scripts/build-work47-benchmark.mjs
node research/three-d-06/fetch-licensed-avatars.mjs
npx playwright install chromium
node --test tests/three-d-06-anatomical-models.test.mjs tests/three-d-07-source-rig.test.mjs tests/three-d-13-pants.test.mjs
node --test --test-name-pattern='targeted geometry' tests/three-d-11-drape.test.mjs
node --test --test-name-pattern='canonical Work56|Original stock source' tests/three-d-09-integration.test.mjs
node scripts/test-three-d-13-browser.mjs
node scripts/test-three-d-13-evidence.mjs
```

Serve repository root locally and open `/research/three-d-13/index.html?version=after`; `?version=before` shows the unchanged Work59 shirt over the mannequin modesty basewear, with no separate pants. Both use identical cameras, lights, source shirt and poses. Review the actual original/cutout before applying AJ. Pants are toggled independently. Model selection clears the reviewed shirt and builds fresh neutral pants. Both source and relaxed poses, four viewing angles, touch rotate and zoom are supported. No saved wardrobe, account, remote runtime service or customer source is involved. Original pants reference and its missing-cutout explanation are in About.

17 functional Node tests: 8 existing model/source tests + 4 lower-body tests + 2 retained Work59 geometry tests + 3 retained Work58 fitting/RGB tests. Historical single-stage scope guards are unchanged, excluded from descendant functional-only invocations, and replaced with this stage's stricter new-file-only guard. No functional predecessor test is removed or weakened.

Six Chromium WebGL2/SwiftShader journeys: before/after × 320×568,390×844,430×932. Each captures both figures, both poses and front/three-quarter/side/back: **96 real view frames**, plus six full mobile pages. Checks cover trusted photo review, exact shirt/pants topology, same rig, no pose rebuilds, repeated independent garment removal/reapply, stable GPU object counts, touch/pinch, idle redraw suppression, viewport controls, zero unexpected external requests/errors, empty local/session storage, and refusal of corrupt AJ PNG or pants-reference JPEG. Node tests bend an actual lower-leg bone by 0.12 rad and verify pants movement/reversal. The existing relaxed standing pose itself does not move the legs; no gait/squat collision validation is claimed.

Full outfit **13 geometries / 3 textures**, shirt-only12/3, pants-only10/2, neither9/2. Object counts are not total GPU bytes, physical-phone performance or battery measurements. Emulated touch Chromium with software WebGL is not native Android Chrome or iPhone Safari. Existing account isolation/auth are untouched, not live-account reaudited.

Evidence: `evidence/{male,female}-before-after-HOLD.jpg`, `verified-sources-HOLD.jpg`, `results.json` including screenshot SHA ledger; full 102 PNG captures archived by CI. Pixel differences and front/rear print tests establish rendered changes/source placement, **not natural cloth acceptance**.

## Implementing-assistant visual grades — independent owner review pending

| Area | Male | Female | Observation |
|---|---|---|---|
| Separate outfit / shared skeleton / source identity | PASS | PASS | Actual AJ shirt + separate neutral lower-body mesh; observed source/relaxed poses |
| Waist/hem layering | REVIEW | REVIEW | Covered waist; overlap is approximate, rear edge can protrude; not tucked tailoring |
| Leg separation / openings | PASS | PASS | Two visible legs, open ankles; no fabricated shoe pair |
| Groin / seat / body clearance | REVIEW | REVIEW | Gross male exposure fixed by canonical normals; seat still anatomical, isolated contact/slivers need owner review |
| Knees / side silhouette / hems | REVIEW | REVIEW | Baggy lower legs but stiff cross-section transitions, broad knees and blunt ankle hems |
| Pants photo fidelity | FAIL | FAIL | No valid pants cutout; deliberately neutral, never claimed real photographed jeans |
| Natural cloth drape / finished fashion realism | FAIL | FAIL | No sewn panels, real folds, pockets, fabric simulation or arbitrary-pose collision solver |
| Existing shirt collar / cuffs | REVIEW | REVIEW | Inherited Work59 limitations retained; no shirt-drape changes owned here |

**Family Alpha remains HOLD.** No owner appearance approval, physical-device certification, full 15-photo garment acceptance or independent release signoff is implied.

## Next integration step

Review only the lower-body builder and canonical fitter, then add a pants slot in the main development integration. Capture source normals before presentation, attach in the original normalized pose, keep pants out of the historical shirt body scan, dispose the pants geometry/material on removal without disposing its shared body skeleton. Keep PR410 caching and PR411 fallback separately reviewed; do not copy this research showroom wholesale into production.

Next geometry priority: replace the inherited anatomical seat/knee contours with a continuous sewn front/back leg and crotch-gusset surface, then test hip/knee bends and shirt-hem/waist collision. Real denim mapping stays blocked until Work53/owner provides a valid source-bound pants cutout; never invent it. No merge/deploy/staging/production/auth/cloud/accounts/private photos/paid inference/Drive Duel changes or tester invitations.
