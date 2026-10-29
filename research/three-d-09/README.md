# Work58 / 3D-09 — real shirt on naturally posed anatomical figures

Independent integration branch from verified Work56 / PR400 `89c4808cba4e790ae4fe7d268ada81ef3c90d966`, using verified Work57 / PR402 `539552b9aafbd777bd40b5862d096de11fc989a8`. Work56 garment fitting, Work57 development, Work53 isolation and Work55 acceptance are not modified. All changes are new 3D09 research files.

## What is reused

- **Work56 unchanged:** import `buildGarmentShell` directly from `../three-d-08/garment-shell.mjs`. Existing geometric fitting, source-aspect texture, neutral unseen areas, curved collar/cuffs, source JPEG/PNG verification, provisional alpha and all original photographs remain untouched.
- **Work57 pose unchanged:** `pose-source.mjs` is the exact verified helper, SHA256 `8b0d2fe50e70b4423b94b79c928601a338cbbffb6b705e0d6fd56af912b25549`. It lowers upper arms 19°, flexes elbows 5°, turns wrists 3° and restores source quaternions without drift. Its body-normal presentation is reused rather than reimplemented.
- **Work57 presentation adapted:** the new renderer and compact layout reuse the verified lights, matte finish, contact shadow, camera, capped DPR, idle redraw suppression, controls and resource lifecycle. Baseline-only experiment logic is omitted. No original Work57 files are changed or required to run this branch.
- **Same two anatomical sources:** unchanged CC0 GLBs and exact hashes from 3D06 procurement. No replacement body, selfie, private photo, per-outfit inference or service account.

## The integration boundary

`dress-in-source-pose.mjs` prevents a subtle fitting error: the garment must not be fitted to a body that is already posed or whose normals were softened for presentation. On body preparation it retains references to the original source normal attributes, applies Work57 presentation on cloned geometry and records canonical rest coordinates for the modesty material.

When a verified shirt is applied, the bridge temporarily restores the original source skeleton and normals, calls the **unchanged** Work56 builder, restores the display normals and applies the selected pose to body and garment together. Garment meshes point to the body's **same existing skeleton**; no duplicate rig or new bone inverses are created. Subsequent pose changes only update bones. They never rebuild geometry, rebind the garment, re-upload the photograph or move its rest-space photo coordinates.

Original body vertex positions, UVs, weights and model hashes remain unchanged. The original normals remain available for fitting; presentation normals are restored even when fitting fails. Disposal removes the shirt's own geometry/material/texture without disposing the shared body skeleton. Model switch/teardown clears clothing first, then releases the old body's bone texture and geometry.

## Development preview

Serve the repository on loopback and open `/research/three-d-09/index.html`.

Choose male/female; review the actual original JPEG and existing provisional cutout; explicitly apply the research shirt. Source previews use hash-verified Blob URLs. Apply re-verifies the JPEG/PNG using the existing loader and requires a trusted click. Scripted clicks cannot authorize application. Cancel, model changes and stale asynchronous operations cannot apply a pending source to another body. Model change clears the garment and requires fresh review.

Switch between **source fitting pose** and **relaxed standing** with the shirt attached. Front/¾/side/back, drag, pinch, zoom, turntable and reset operate on the actual WebGL figure. All primary controls fit tested 320×568, 390×844 and 430×932 viewports without scrolling. Original source/cutout review opens in a compact dialog; supplementary finish/license information is collapsed below the main viewport.

This is a private, localhost-only research preview, not a deployed wardrobe feature. No accounts, storage, wardrobe API, auth, cloud, recognition engine or original-photo pipeline changes.

## Actual tests and screenshots

- **12 Node tests** (3 existing model/source tests, 5 existing source-projection boundary tests, 4 integration tests). Both exact model hashes are checked. Canonical shirt positions/skin weights/indices/panel positions match an independent call to unchanged Work56 on the original body, even when application begins in relaxed pose. Tests verify shared skeleton, actual sleeve-vertex movement, repeated source/relaxed reversibility, restored presentation normals, unchanged originals and source helper provenance.
- Full-resolution PNG/JPEG hashes and every visible original RGB pixel are compared. Corrupted JPEG/PNG bytes fail closed.
- **3 real Chromium WebGL2 / SwiftShader touch profiles:** 320×568 @2, 390×844 @3, 430×932 @3. Both models × both poses × three angles produce **36 actual captures**.
- Trusted application, source identity, model reset, no rebuild/reupload on repeated poses, drag/pinch, controls inside the viewport, unchanged canvas aspect, zoom/view controls, repeated removal/reapplication, no horizontal overflow and zero outside requests pass.
- **Dressed: 11 GPU geometries / 3 textures. Removed: 9 / 2**, stable across cycles. Idle GPU frame count stops. Work56 contributes 19,543 female / 19,664 male shirt triangles, attached to 163 existing bones, on the unchanged 109,064-triangle bodies.
- A separate browser response-corruption test blocks the provisional PNG before preview application. This is synthetic in-memory test data, not an original-file edit.
- **12 front/rear print image checks:** both figures, both poses, all widths. Central shirt print pixels remain on the front; the same central rear region has zero bright print pixels. This is a regression check, not a logo/appearance quality approval.

`evidence/` includes source/relaxed front/side/back comparison sheets for both figures and measured results. Full screenshots are workflow artifacts. Readback timings include rendering, GPU synchronization and PNG encoding; cold samples include shader work. They are not native-phone FPS. DPR is capped at 1.5 and no new shadow maps are introduced. Renderer resource counts are not total VRAM measurements. No physical Android/iPhone or Safari test is claimed.

## Implementing-assistant visual assessment

Inspected both actual comparison sheets and the individual front/side/rear captures. PASS here is scoped to the described observed behavior, not independent Work55 or owner approval.

| Area | Male | Female | Actual observation |
| --- | --- | --- | --- |
| Shirt attachment through the two poses | PASS | PASS | Same garment moves with the body; shoulders and sleeves remain continuously connected. |
| Photographic identity / rear restraint | PASS | PASS | AJ remains recognizable on the front, without sleeve/rear duplication; original pixel data is intact. |
| Natural pose | REVIEW | REVIEW | Lower arms look less rigid; source fingers still splay, legs remain symmetric, changes are instant presets rather than cloth animation. |
| Shoulder/collar silhouette | REVIEW | REVIEW | Neck stays covered by a separate shirt, but collar is schematic and shoulder caps look bulky/raised. |
| Sleeves / elbows / cuffs | REVIEW | REVIEW | Sleeves follow arm lowering and cuffs remain outside wrists in inspected views; tailored seams/folds are absent. |
| Chest/waist / side silhouette | FAIL | FAIL | Side follows anatomy too closely, particularly female chest; front fabric has photographed folds without physical drape. |
| Clipping / clearance | REVIEW | REVIEW | No obvious gross body breakthrough in captured views; no collision solver, continuous-pose or arbitrary-motion clearance proof. |
| Overall cloth realism | FAIL | FAIL | Still a body-derived shell with flat photo shading and inferred neutral unseen fabric, not sewn or simulated cloth. |

**Overall: functioning, visibly less rigid integrated development preview; Family Alpha HOLD.** It satisfies the shared-skeleton integration milestone but is not a finished realistic try-on. No 15-photo visual release, human/owner signoff, garment-size accuracy, physical phone performance or live account/RLS/backup test is claimed. Those release gates remain separate.

## Recommended next improvement

Replace the body-derived shoulder/collar/underarm regions with garment-panel geometry and localized pose corrections. Start with collar thickness/seam, bulky shoulder caps and elbow/cuff clearance on this same source shirt, then assess female side drape. Preserve the current source identity/rest-space texture and shared skeleton. Test a range of intermediate arm poses and obtain independent visual review before advancing Family Alpha. Do not add more categories or another avatar before fixing these visible limits.

## Reproduce

```sh
npm install --no-save --no-package-lock --no-audit --no-fund sharp@0.34.3 three@0.180.0 playwright@1.56.1
npx playwright install chromium
node scripts/build-work47-benchmark.mjs
node research/three-d-06/fetch-licensed-avatars.mjs
node --test tests/three-d-06-anatomical-models.test.mjs tests/three-d-07-source-rig.test.mjs tests/three-d-09-integration.test.mjs
node scripts/test-three-d-09-browser.mjs
node scripts/test-three-d-09-evidence.mjs
```

The unchanged historical benchmark builder needs commits `53f2ad344dc56a1477e343531c423aed0e66c17d`, `dd6bac3fa9ff640d4f562cf925337440bdb5cf8f`, `3a572193987cb29389727426136c6eb3ac326783` available locally. CI fetches these and reconstructs the same licensed images/masks; it does not invent missing cutouts. The dedicated read-only no-deploy workflow checks only new 3D09 paths against the exact Work56 base.

Older frozen research scope guards are not weakened or represented as resolved. Application/security/account tests are outside this isolated integration; no live account is used. No merge, deployment, staging/production, Drive Duel, Supabase/auth/storage, original-photo edits, private-family data, paid service or tester invitations.
