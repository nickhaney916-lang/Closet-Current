# Mission #90 milestone 8 — isolate original 163-bone shirt attachment latency

**RESEARCH ONLY — DRAFT / NO MERGE / NO DEPLOY / Family Alpha #255 OPEN/HOLD.**

## Verified reason to investigate

Milestone 7 exact-head [no-deploy CI #43639324969](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43639324969) passed both Chromium and WebKit, and Chromium full Node **2,680/2,680 PASS**, preserving same-host baseline/candidate/restored original pixel source frames and both original 163-bone male/female bodies.

M7 revealed that indexed shirt adapter preparation is **not** the slow operation. With M6 top-only pinned original-shirt source optimization, candidate median observed garment apply is:
- Chromium female **3840.5 ms** shirt vs **1006.9 ms** dress; male **3858.8 ms** shirt vs **1092.9 ms** dress.
- WebKit female **7502.5 ms** shirt vs **1590.5 ms** dress; male **7233.0 ms** shirt vs **1618.5 ms** dress.

Every time is an actual synchronous original-photographed research mesh path, not abstract UI tapping; samples are n=2 for each source/figure/variant on a hosted CI browser. Do **not** extrapolate to physical Android Chrome/iPhone Safari, actual owners, or full photo-to-3D fidelity. Scene-specific bottleneck cause remains unverified.

## M8 isolated instrumentation

In the **same exact pinned disposable PR541 donor**, preserve original `applyOutfit(mode,candidate,options)` behavior and synchronous execution order but measure with `performance.now()`:
1. `setOutfitMs` — original `outfit.setOutfit(...)`: garment geometry, material, rigging, fitting;
2. `samplingMs` — original optional `configureOriginalPhotoSampling(...)`;
3. `cleanupMs` — unchanged `syncOutfit()` and `reapDetachedGarmentGeometries()`;
4. `drawMs` — unchanged original `draw()` including WebGL submission;
5. `totalMs` — complete call.

Existing original-source `prepareIndexedGarmentsFor3D`, `applyIndexed3DSelection`, `viewer.applyOutfit('dress')`, original wardrobe owner/session/photo-byte checks, avatar bones and garment/texture assets remain **unchanged**. A numeric, owner-agnostic `applyStages90` receipt is returned from donor `viewer.getState()`; normal source-true presenter passes it to the private research dialog; native viewer exposes `sceneApplyStages90` **only while the original selected owner/photo session is still active and current**, otherwise `null`. No photo, SHA, image bytes, source material, private identity, hidden account, or new persistent cache in telemetry.

Real-browser saved-selection tests assert mode matches actual scene, all five numbers are finite and nonnegative, the four measured phases sum to total within 2 ms, and total is covered by the M7 source-verified presenter-apply receipt. Browser-emulated actual WebGL context loss must make **both** M7 and M8 timing receipts null, leaving original-photo/2D saved wardrobe intact. Paired baseline/candidate/restored comparisons report shirt/dress `setOutfitMs` and WebGL `drawMs`, plus shirt sampling and cleanup medians by both original 163-bone rigs and Chromium/WebKit; final source frame/pixel integrity, mesh counts and original SHA identities remain asserted. Focused Node code guard checks no creation/fabrication of new garment source capabilities or avatar geometry.

## Acceptance and remaining work

Exact M8 HEAD must pass both dedicated no-deploy Chromium and WebKit CI, complete Node, genuine licensed source bundle identity, all repeated native saved-selection and context-loss privacy tests, and same-host baseline/candidate/restored final-photo-frame comparison. **M8 is diagnostic, not a claimed speedup.** Only after exact results identify whether original garment fitting or renderer submission dominates should a separate isolated performance fix be considered; no shortcut may discard photo integrity, skinning quality, owner revocation, or 2D fallback.

Physical Android/iOS tests, signed host privacy, approved arbitrary garment geometry, real full outfit layering, cloth drape, front/rear authenticity, collision clearance and validated memory/GPU FPS still remain unverified. Preserve #255 Family Alpha OPEN/HOLD.
