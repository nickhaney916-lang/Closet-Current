# Work56 — independent anatomical garment shell (Family Alpha HOLD)

Base: PR #397 exact `ac7d2bd1f2c223baf61fa0c3580cbc3b9b1330ec`.
No edits to the shared 3D06/07 renderer, GLB loader, startup, public app, Work53 or Work55. This copies the showroom into an isolated experiment; integrate the garment module later, not the copied showroom wholesale.

## Working implementation

`garment-shell.mjs` extracts continuous torso/shoulder/arm topology independently from each existing licensed anatomical body, clips neckline, hem and oblique wrist openings at skeleton-derived landmarks, starts with an 18–40 mm surface offset at normalized two-meter display stature, expands the front/waist outward with a body-derived drape envelope, adds narrow 4 mm boundary thickness and binds a separate `SkinnedMesh` to the existing skeleton. Four source bone weights are retained and interpolated at clipped triangles. Source body geometry remains unchanged. This is an offset anatomical shell, not sewn cloth, cloth physics, user measurements or validated garment sizing. It retains anatomical contours too closely, especially on the female chest; no realistic loose fabric/drape claim.

The existing Work47 loader verifies the original licensed `commons-0003` JPEG and original-RGB PNG hashes before trusted review interaction. Existing RGB is sampled on the front only; side/rear/sleeves use the source-matched neutral fabric color. No invented rear photograph, repeated print, paid service or photo reconstruction. Rest-pose panel attributes keep source coordinates attached to the skeletal garment rather than sliding with world position. The original source image and mask are never modified.

`index.html` compares **frozen 3D07 projection** and **new shell** on male/female independently. Model/mode changes, clearing and unchecking review remove the garment and require fresh review. Body shading/modesty remains underneath. The copied viewer only renders when camera/spin changes, avoiding continuous idle GPU redraws.

## Reproduce

From repository root (Node 22+):

```sh
npm install --no-save --no-package-lock --no-audit --no-fund sharp@0.34.3 three@0.180.0 playwright@1.56.1
npx playwright install chromium
node scripts/build-work47-benchmark.mjs
node research/three-d-06/fetch-licensed-avatars.mjs
node --test tests/three-d-06-anatomical-models.test.mjs tests/three-d-07-source-rig.test.mjs tests/three-d-08-garment-shell.test.mjs
node scripts/test-three-d-08-browser.mjs
node scripts/test-three-d-08-evidence.mjs
```

Historical benchmark commits required by the existing builder: `53f2ad344dc56a1477e343531c423aed0e66c17d`, `dd6bac3fa9ff640d4f562cf925337440bdb5cf8f`, `3a572193987cb29389727426136c6eb3ac326783`. Fetch those for a shallow checkout. Model binaries remain local, SHA-locked and uncommitted.
Serve repository root on loopback and open `/research/three-d-08/index.html`. Choose model/mode, review source images, and click preview. Never enable this research page as a production flow.

## Actual rendered assessment — October 28, 2026

36 Chromium/SwiftShader canvas captures: two figures × three widths (320/390/430) × two modes × front/side/back. All widths render, source review/clear/model reset operate, no horizontal overflow and zero external runtime requests. Committed comparison sheets use actual 430 px browser captures; full captures are workflow artifacts. 14 Node checks cover source/license boundaries, original geometry immutability, independent geometry, shared skeleton, normalized weights, actual skeleton deformation, source pixel aspect, curved neck opening, corrupted JPEG/PNG hash rejection, unexpected URL rejection, full-resolution original RGB preservation and file scope. A GPU-image regression compares the front printed chest with the neutral rear. Removal also clears garment handles and releases photographic GPU textures. Tests demonstrate functioning geometry; they do not grant visual approval.

Visual assessment by the implementing assistant, not independent human acceptance:

| Defect | Male | Female | Observed limit |
| --- | --- | --- | --- |
| Shoulder attachment | REVIEW | REVIEW | Continuous shoulder coverage improves the bare band in projection. Front neck opening is now curved, with neutral fabric at the collar; no sewn collar seam or validated size. |
| Sleeves/cuffs | REVIEW | REVIEW | Anatomical arms and wrist openings replace painted sleeve coverage; no tailored sleeve seams or ribbing. |
| Chest/waist proportions | REVIEW | REVIEW | Broad front envelope and outward waist ease reduce bust/waist clinging; side profile still follows anatomy too closely. |
| Lettering/stretch | REVIEW | REVIEW | Source pixel aspect is now preserved and AJ is legible without widened letters. Source photo perspective/folds and remaining surface curvature still require human review. |
| Side/rear | REVIEW | REVIEW | Plain inferred rear, no mirrored rear logo in new mesh. Frozen baseline visibly duplicates the print behind the body. Side is schematic. |
| Clipping/body penetration | REVIEW | REVIEW | No obvious gross body breakthrough in inspected static views; no collision solver or all-pose proof. Neck/underarm/cuff boundaries need closer physical-phone review. |
| Fabric realism | FAIL | FAIL | Body-derived topology retains anatomical shape; no believable sewn fabric drape or simulated folds. |

**Overall REVIEW / Family Alpha HOLD.** Demonstrably improved shoulder/sleeve/hem coverage and rear handling; not a visually accepted try-on. No owner approval or new 15-photo benchmark PASS. No physical mobile device or performance certification. Only the single explicitly licensed black shirt is supported.

## Integration instructions

1. Leave PR397's loader/startup work on its own branch; this branch changes no shared file.
2. After resolving/loading that candidate, review `buildGarmentShell(root, verifiedCandidate, {acknowledged:true})` at the existing verified source boundary. Pass the already normalized, loaded GLB scene.
3. Keep returned mesh handles; call `dispose()` on source/body/mode change, clear, stale load cancellation and teardown. Do not mutate source body geometry or overwrite its material with the garment.
4. Retain JPEG/PNG hash checks and trusted review interaction. Never promote `reviewConfirmed` to human visual approval.
5. Carry forward draft-only status. Address fabric drape, lettering, rounded neck/seams, pose collision and independent Work55 review before any Family Alpha acceptance. Broader inherited CI failures are outside this isolated change and cannot be waived by these tests.

No merge, deployment, staging/production, account/cloud writes, family photographs, fees, Drive Duel changes or private wardrobe access.

## Follow-up fit refinement — October 28, 2026

The first exact head `d993c954a631b6bd4e5d3417015858ea53305f63` passed dedicated remote CI [40797249868](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40797249868). This follow-up continues the same independent PR400 branch, not Work57's separate showroom.

`garment-fit-profile.mjs` exposes reusable rest-space photo-span, torso-envelope, neckline and surface-normal helpers. The photo panel now uses decoded source dimensions and existing alpha-crop aspect so one photographed pixel has the same horizontal and vertical physical scale. It no longer expands the image to an arbitrary .78 m width. Front/back classification uses that model's torso center plus rest normals, avoiding both rear duplication and fading of the J at an arbitrary world-depth threshold.

The independent shell has a curved front/back neck opening and a broader front/waist envelope. Only the shell moves; original body positions and source hashes remain unchanged. Coincident surface normals are averaged without smoothing away the narrow boundary thickness. Fine-photo cutout fringe is not repaired or saved: the garment shader conservatively samples six pixels inside alpha boundaries and uses plain source-matched cloth at the collar. This view-only sampling guard leaves Work53/55 and every JPEG/PNG byte unchanged.

The shell mode no longer allocates an additional unused projection texture. Clear/model switch/teardown release clothing geometry/material/texture and old body bone textures. Read-only local diagnostics enable regression checks; no account or wardrobe state is exposed.

Final local checks: **14/14 Node tests**, **3/3 Chromium widths**, **36 front/side/back captures** and **6 front/rear print checks** PASS. Updated committed sheets show original photo/cutout plus frozen projection versus new mesh for both figures. No outside runtime requests. Live authentication/RLS/account isolation was intentionally not exercised; all corresponding application/account/storage files are untouched and their Family Alpha validation remains a separate gate.

Visual result: AJ reads more clearly at its source aspect, front neckline is curved, pale outline artifacts are reduced, and waist/chest coverage is less clingy. Still an offset/draped anatomical shell, **not sewn or simulated cloth**: side anatomy remains too prominent, neckline/hem/cuff seams are schematic, and all-pose collision, real phone performance and independent owner acceptance remain unverified. **Family Alpha HOLD remains.**
