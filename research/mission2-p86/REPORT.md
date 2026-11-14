# Assignment #86 — engineering handoff (HOLD)

Mission 2 remains **INCOMPLETE**. This delivery is research infrastructure and observed-front geometry, not a realistic fitted clothing system. No consumer code, wardrobe, hosted service, original photograph, independent development branch, merge or deployment was changed.

## Source truth

- Tracking: #1124; base C62 `60d63ab86263f12c03e8746f9409ba52244acd3d`.
- C61 source `cd18e9225d35373d076b4bd9775bba36cdb3368a` remains the #85 branch head observed at inspection. No independent #85 solver implementation was available there; no solver result imported.
- #84 inspected at `8385c308` (full source available via remote ref `research/parallel84-real-photo-layer-audit-20261113-HOLD`). Its report documents bounded shirt/denim changes, real source posed-contact rollback and limited browser evidence, but not general garment reconstruction. No incompatible donor code copied or branch modified. Its existing report/CI claims are donor claims, not newly reproduced #86 results.
- Immutable detached source donors: P541 `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`, P60 `6fe5e46b91533a96f3c0d86950ea077cb355c459`, P172 `88d2fdb412f84b0498c86bfa17f4b391425e1958`.
- Restored original male GLB SHA-256 `d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8`, female `a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1`: both 163 bones, CC0 source. Restoration establishes asset integrity, **not exercised fitted-avatar acceptance**.
- Public image source SHA, source page, author and license are in `benchmark/mission2-p86/measurements.json` and `benchmark/locked-photo-sources.json`. Original JPEG bytes were read and independently hashed, never rewritten. Work47 derived masks are unapproved REVIEW proposals.

## Implemented

1. `photo-panel.mjs`: bounded, category-independent front-surface triangulation of actual alpha occupancy, preserving source aspect ratio, UV correspondence and holes. At the downsampled mask resolution every occupied pixel contributes exactly two positive-orientation triangles. This is an **image-derived flat surface**, not inferred depth or an anatomical garment. Transparent edge alpha is thresholded at 128; coarse boundary detail is not source-resolution exact. Rear surfaces are deliberately absent. No invented garment dimensions or fabric simulation.
2. Genuine licensed shirt, blouse and dress exercised through this implementation. Triangles: 15,720 / 28,464 / 12,208; vertices: 8,123 / 14,554 / 6,325. Construction timings are single local CPU samples, not p50/p95 or end-to-end speed. A WebGL research harness renders front/oblique/side/unobserved-rear views. Chromium passed; side/back correctly expose the lack of depth/back reconstruction. Screenshots do not show avatar fitting or improved drape.
3. `surface-metric.mjs`: generalized-eigenvalue principal in-plane stretch and anisotropy, detecting shear between triangle edge directions. Independent UV byte comparison when UVs exist. Source projection without UVs remains explicitly unmeasured for photographic texture quality; no texture acceptance. Integrated into disposable C60/C61 diagnostic receipts and the existing detached-donor installer. No source mesh mutation or admission threshold relaxation. Rig/normal/seam/collision checks remain separate inherited gates.
4. `outfit-job.mjs`: adapter-based research broker for exact native `top,bottom,layer,layer2,layer3,shoes,bag,accessory,finish` selections. Hashes copied original bytes; requires explicit owner confirmation; binds owner/session/wardrobe/board revision plus exact selected IDs; aborts/rejects stale jobs and disposes late returned resources. Covered bottoms remain selected. Numerical results never admit consumer 3D. It returns original-photo fallback requirements, **not rendered private photos**. Native app integration is deliberately pending verified APIs and fit/material acceptance. It must not be wired as a replacement display revocation mechanism: callers must use existing signed-photo display leases.
5. No-deploy regression workflow and reproducible licensed-panel/browser scripts.

## Actual verification and limits

- Focused adversarial unit tests cover mask topology and orientation, analytic stretch/shear, missing/changed/nonfinite UV, collapsed geometry, original hash mismatch, wrong owner, missing review, every lease epoch, same-revision outfit edit, explicit abort, overlapping jobs and late resource cleanup.
- Initial inherited run before build failed only because `dist/manifest.webmanifest` was absent. Required build and PWA rerun pass. Full post-build suite is recorded separately in VERIFICATION.md after completion.
- Chromium source panel screenshots passed and were visually inspected: original prints/colors recognizable, mask cut edges visible, panels plainly flat. No independent human aesthetic acceptance.
- Native P171/P175/C61 Chromium harness attempted against restored donors but timed out at readiness: bones 0, viewer mode none, source handoff denied. Only original builder screenshot produced. This is **BLOCKED**, not a geometry/collision/fabric pass. `native-avatar-attempt.json` retains its failure receipt.
- WebKit installed, but launch is BLOCKED by missing `libgtk-4.so.1`, `libgraphene-1.0.so.0`, `libwoff2dec.so.1.0.2`, `libharfbuzz-icu.so.0`, `libhyphen.so.0`, `libmanette-0.2.so.0`, `libGLESv2.so.2`. Runnable harness supplied; no WebKit screenshots claimed.
- Neither actual Android nor iPhone was available. Physical-device acceptance BLOCKED. New panel screenshots use desktop 1120×650; they are not the required native mobile-width avatar tests. No continuous collision, drape physics, full outfit fitting, performance/memory or multiple-pose acceptance claimed.

## Remaining mandatory gates

| Requirement | Status / exact remaining blocker |
|---|---|
| Owner-confirmed segmentation and photo identity | Broker contract implemented/tested; public masks unapproved; native integration unverified |
| Multi-category true 3D garment reconstruction | BLOCKED: front surfaces implemented; depth, seams, size and hidden surfaces unavailable |
| Both anatomical rigs fitted and articulated | Assets restored; native viewer readiness failed; no new acceptance |
| Collision and source strain both passing | NOT ACHIEVED: inherited 6mm trial was rejected for distortion; new principal metric adds measurement only |
| Believable gravity drape/material/motion | NOT IMPLEMENTED by this delivery; inherited analytic folds are not validated cloth physics |
| Real layered jackets/shoes/saved outfits | Identity orchestration covered; genuine geometries and rendered integration missing |
| Owner privacy and original-photo fallback | Research refusal and stale-job tests pass; signed native/browser integration remains separate |
| Front/side/rear/poses on native mobile widths | Panel views only; native readiness, WebKit dependencies and physical phones blocked |
| p50/p95, CPU/GPU memory, repeated real garments | NOT VERIFIED; isolated panel construction times do not satisfy this |
| Independent visual acceptance | NOT COLLECTED; no fictional reviewer/owner approvals |

## Reproduction

Install the pinned dependencies from `.github/workflows/mission2-p86-no-deploy.yml`; run `node scripts/build.mjs` then `node --test --test-concurrency=1 tests/*.cjs tests/*.mjs`.

For source panels, create detached `.native05-donor-541` at the pinned P541 commit, link its node_modules to the root dependencies, and run in that donor:

```
node scripts/build-three-d-31-jeans-proposal.mjs
node scripts/build-three-d-37-second-jeans.mjs
node scripts/build-work47-benchmark.mjs
node research/three-d-20/restore-approved-models.mjs
```

Then from this branch:

```
node scripts/measure-mission2-p86-panels.mjs .native05-donor-541
node scripts/test-mission2-p86-panels-browser.mjs
P86_ENGINE=webkit node scripts/test-mission2-p86-panels-browser.mjs
```

Generated full-resolution derivative PNGs and panel JSON are reproducible intermediates and intentionally excluded from source control. Committed screenshots and measurements retain source attribution and source hashes. New consumer 3D admission is never granted. Family Alpha #255 remains OPEN/HOLD.
