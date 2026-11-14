# Mission 90 milestone 2 — guarded native saved-outfit switching

DRAFT / NO MERGE / NO DEPLOY. Family Alpha #255 OPEN/HOLD.

Parent: exact accepted viewer `271f25b4435f74c753df705490d2bf6b538aaee2`, dedicated no-deploy run #43626290876 SUCCESS. Same immutable M34 and detached PR541 source ancestry; no master/P88/P89 source cherry-picks. Master M37's new owner-original preflight is not consumer 3D admission and is not silently imported here.

## Working path

The research native preview now includes a labeled, 44px saved-outfit selector. It delegates only to the existing native consumer `selectSaved(index)` method, which refuses unsaved edits and does not write the saved wardrobe or board. Before selection, the bridge checks visible browser, current original auth object, owner, current selected saved row, dirty state and target index/owner. Busy or disposed viewers refuse changes. The old private scene is cleared before changing selection; `open()` re-runs the original owner/session, exact saved slots, wardrobe revision and original-JPEG SHA checks before and after renderer loading. Unsupported or invalid items retain the native original-photo 2D board. Donor save/delete/editor controls remain disabled.

Reopening also retains the validated male/female UI choice inside the same owner lease; explicit owner/session revocation resets it to the default. No source capability, private mesh or texture is reused as authorization. Browser tests assert the rig choice survives later switches.

A successful switch uses a fresh canvas/renderer rather than reusing a stale source admission. This prioritizes current source identity and disposal; it is not an asserted startup-speed optimization. Rejected UI actions restore the connected selector, avoiding a permanently disabled control. Context loss, backgrounding, logout and original-source revocation remain inherited safeguards.

## Acceptance design

`P90SWAPS=1` adds one synthetic-owner saved research shirt outfit to the existing genuine licensed-photo fixture; it does not alter default test fixtures, production or a private owner wardrobe. At 390px, each browser switches 16 times on each genuine 163-bone rig, with cumulative checkpoints 1/4/16: 32 changes per engine, 64 across both. Both saved selections include three unsupported photo-only pieces; these are **partial research outfits**, not complete photograph-faithful reconstructed outfits.

For each change, the actual accessible selector must change the native selected row and real garment mode; the original JPEG shown must match the exact pinned source SHA, renderer garment source metadata must match, the previous source garment must be absent, and the original 2D fallback photos must remain. Both actual rig identity and 163 bones are checked. A real canvas-object comparison verifies replacement. Resource counts are compared per rig and garment mode, not incorrectly across different meshes. The complete original IndexedDB board, IDs and future metadata must remain byte-equivalent after the test. Existing source/owner/browser regressions run afterward in CI.

Four real bridge guard unit tests exercise invalid/foreign indices, unsaved edits, hidden/replaced-auth state and disposed viewer refusal before any native selection change. No private or hosted auth data are used.

## Measurements and honest limits

- Initial Chromium 390px full saved-selection sequence: female and male **1/4/16 PASS** (32 changes), no original saved-board mutation. This local run preceded the final test-only optimization to avoid redundant same-model reloads; exact-head CI remains authoritative for current timings and added checkpoint screenshots. Shirt 16 geometries / 3 textures; dress 11 geometries / 3 textures at observed checkpoints.
- New guard tests: 4/4 PASS; inherited focused native/viewer checks: 105/105 PASS before final publication.
- Full local Node regression: **2,673/2,673 PASS**, zero failures/skips (131.4 seconds). Final exact-head Chromium/WebKit CI acceptance must be recorded in PR #1178 and coordination #1054 after completion, not inferred from this file.
- Latency is end-to-end UI change + original-byte validation + source bundle/rig/garment setup, including a male-model selection when needed. The initial pre-optimization diagnostic took approximately 6.6–16.2 seconds/change and is not fast-switch acceptance. Redundant same-model test reloads are removed and the product preserves the chosen rig, avoiding an automatic female-then-male load on every later male switch. Current CI timings must be evaluated on their own merits. No artificial settle interval is added to this switching measurement. Coarse `performance.memory.usedJSHeapSize` is recorded only if exposed; null means unavailable. This is not a controlled before/after speedup comparison, FPS, total process/GPU memory or leak-proof heap acceptance. Stable per-renderer counts alone cannot establish those claims.
- Physical Android/iPhone, finger gestures, landscape, hardware GPU faults, real signed owner-source 3D, independent photographic fidelity, complete multi-garment geometry/drape/collision and actual complete-outfit 1/4/16 acceptance remain unverified. P89's new two-piece public research evidence is a donor, not permission for private-owner display.

Reproduce using the existing pinned donor setup and installer:

```
P90SWAPS=1 P90=1 NATIVE88=1 NATIVE89=1 NATIVE91=1 NATIVE92=1 NATIVE93=1 NATIVE102=1 node scripts/test-native-3d-05-browser.mjs
P90SWAPS=1 P90=1 P90_ENGINE=webkit node scripts/test-native-3d-05-browser.mjs
```

Artifact paths: `benchmark/parallel90/<engine>/saved-switches.json`, per-rig 16-switch screenshots, and inherited engine-specific native screenshots/results. No new original image, geometry, model, public app, auth, hosted database or sibling branch changes.
