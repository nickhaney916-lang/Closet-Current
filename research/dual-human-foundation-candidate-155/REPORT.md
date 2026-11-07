# Closet Current — MAIN Priority #155 / Genuine Licensed Humanoid Foundation Candidate Validation

**RESEARCH ONLY · Family Alpha GitHub Issue #255 HOLD · No production, existing staging, Supabase, Delta Ebb, Drive Duel, merge or deployment.**

## Why a foundation change is required

The latest verified [Priority #154 draft PR #709](https://github.com/nickhaney916-lang/Closet-Current/pull/709) exact commit `c7fe572a5e6c4a18b1cef9ffbd550aee473f2f4c`, [successful GitHub Actions #42424120912](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42424120912), has intact authentic mobile 3D original-photo source figures but their human appearance is still subjectively around 3/10. A series of micro-procedural nose/lip/hair changes cannot reliably result in high-end photorealism: realistic facial topology, eyelids/ears, hair strands/cards, high-quality albedo/normal/roughness maps, licensed source geometry, correct real skeleton and believable material response are still missing.

Priority #155 introduces an independently testable **real source-model candidate comparison**, not more procedural geometry. Real alternative art assets have to be evaluated for *both appearance and wardrobe compatibility*.

## Externally verified sources and restrictions

1. **MakeHuman / MPFB** official license: core assets and exported models are CC0, including commercial use. However, Closet Current's pinned current 163-bone source figures are already MakeHuman-derived, gray anatomical bases without convincing natural face/hair. Merely swapping another MakeHuman body does not solve photorealism.
   - https://www.makehumancommunity.org/about/license.html
   - https://www.makehumancommunity.org/makehuman/faq/can_i_sell_models_created_with_makehuman.html
2. **Microsoft Rocketbox** full-body adult avatar library: official MIT license (copyright 2020 Microsoft). 115 rigged avatars; more detailed textured faces/body than the current source. Approved only for evaluation until model-by-model compatibility confirmed.
   - https://github.com/microsoft/Microsoft-Rocketbox/blob/master/LICENSE.md
   - https://github.com/microsoft/Microsoft-Rocketbox
3. Exact converted WebGL GLBs (source 927tanmay/react-ai-voice-avatar, exact commit `fc1398c2f8ba600c3676a5277684ed4f3e2731d7`):
   - **Female** Rocketbox `Female_Adult_07`, `ananya.glb`, size 4,480,100 bytes, expected Git blob SHA-1 `41e05337ee06a1b12dc9e76ecce07508ea7fdd1a`.
   - **Male** Rocketbox `Male_Adult_04`, `aarav.glb`, size 4,673,948 bytes, expected Git blob SHA-1 `e5d6c4c3319e0e45f7715b05605f695295849654`.
   - Source file provenance and MIT: https://github.com/927tanmay/react-ai-voice-avatar/blob/fc1398c2f8ba600c3676a5277684ed4f3e2731d7/assets/avatars/LICENSE.md
   - Both are public, already converted to GLB with compact textures/rig for real browser use. Git blob hash prevents substituting an incorrect license or binary in the future.

**Critical**: Rocketbox candidate characters are ALREADY DRESSED with integrated clothes. They are not suitable replacements for user-custom photographed wardrobe garments in their current condition. Never display their built-in clothes as "owned" or generate unphotographed clothing from them. Source model legal release review, separation of the rigged body/clothes/hair, retargeted existing photo garment meshes, mobile memory budget and independent human realism evaluation are still required before a foundation replacement can be considered.

## Implemented P155 research deliverables

- `foundation-manifest.mjs`: pinned MIT provenance and both exact asset file hashes; **fail-closed privacy/model-selection function** denies replacing an owner-saved dress, real original JPEG, uploaded item or any closet outfit. The current 163-bone original photographed outfit viewer is always selected for actual user clothing.
- `inspect-gltf.mjs`: scans **real binary GLB v2 data**, full exact Git blob SHA, original file size, skinned geometry accessors, triangle counts, skeleton/head/arm/leg joints, embedded textures and images, materials and facial morph targets, blocks external asset URIs; records independent source SHA-256 receipts.
- `licensed-visual-lab.html`: genuine Three.js GLTFLoader studio-lit male/female WebGL side-by-side candidate analysis (each model rotatable by front/side/back via 3D camera and close-up), clear "baked garments / NOT owner's closet" warning, no private photos, CDN call from the user's browser, service, login or data leakage.
- `scripts/test-dual-human-foundation-155-browser.mjs`: downloads happen only at disposable CI build stage and assets are served from loopback origin. Actual male/female full-body front/side/back/face Chromium and WebKit WebGL across 320/390/430 CSS px, **24 screenshots per browser, 48 total**, with independent SHA-256 audit, genuine skinned meshes, anatomy, source bone/texture checks, no external browser calls, browser console errors, memory/performance evidence and original owner garment fallback.
- `scripts/audit-dual-human-foundation-155.mjs`: independent 48-image genuine-source SHA+pixel audit; prevents false positive if male and female assets duplicate or front/back incorrectly share same image. Writes factual release-blocker verdict.
- `tests/dual-human-foundation-candidate-155.test.mjs`: negative guards against showing baked clothing as the owner's source, missing explicit model opt-in, altered model bytes, unknown figures, no privacy/source consent, and unauthorized production substitution.
- Dedicated no-deploy CI builds original app and runs full inherited tests; exact main Priority #154 parent and narrow P155 research-only allowlist. Source GLBs are **not** added to shipping production assets. Browser research tests use only immutable pinned downloadable upstream files.

## Required final outcome and honestly remaining scope

A successful binary + real WebGL render proves this is a **viable licensed visual candidate**, not a production 10/10 digital human. Owner-photographed garment fit/real physical Android/iPhone performance/cloth physics/face visual score/hosted signed two-account JWT RLS remain *unverified* and must not be represented as complete.

**P155 acceptance: model-source due diligence and real-browser image evidence PASS only when every source/viewport/engine test is verified. Closet Current foundation REPLACEMENT is deliberately BLOCKED until garments can be removed/reprojected with source-photo integrity on both figures. Family Alpha HOLD and no deployments even if research validation succeeds.**
