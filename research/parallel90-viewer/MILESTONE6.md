# Mission #90 milestone 6 — bounded shirt source loading without weakening 3D owner/photo admission

**RESEARCH ONLY · DRAFT · NO MERGE · NO DEPLOY · Family Alpha issue #255 OPEN/HOLD.**

## Exact scope and eligibility

The genuine pinned PR541 source-loader prepares two different licensed, SHA-verified denim bundles to make the public original-shirt capability available. The real P90 native selected saved outfit used in the browser benchmark contains a genuine pinned photographed shirt top and three additional **photo-only** items, but **no saved bottom slot**. Its public shirt-only rendering only ever uses `sources.bundles[0].shirt`; the second denim candidate is unused.

This milestone narrows only that case:

- The native P90 bridge derives `nativeBottomEmpty90` from the **already admitted** saved owner's `selected.slots` object after original owner/session, source revision and WebCrypto original-JPEG byte attestation. It is **not** a client-provided 3D approval flag, and it is subject to the existing repeated `requireFresh()` checks.
- The disposable research PR541 installer passes a new `singleShirtBundle90` source-loading hint **only** for `emptyStartup90`, the original pinned research shirt SHA, and a saved selection without any bottom slot.
- A valid top-only pinned shirt now loads **only the first** original licensed denim bundle (the original pinned shirt capability) instead of both. The source verifier still checks real original source JPEG, cutout, metrics, provenance, manifest and pinned shirt/denim SHA. It cannot mint any new capability. The source loader rejects a single-bundle hint without the pinned-shirt hint.
- A saved bottom of **any** category or SHA, a non-pinned top, a legacy/donor caller or a normal non-opt-in native path still executes the unchanged full two-denim-bundle path. The canonical pinned dress still has zero denim bundles. Unknown/unapproved clothing remains original-photo-only.
- The actual existing presenter still checks original source SHA, 163-bone model, owner, generation, selected slot and registered-garment plan before any public provisional mesh is shown. No geometry, clothing mesh, source photograph, UV/material, skeleton/weights, private data, RLS, auth, production code or staging code is modified.

## Browser regression requirements

The exact source-bounded research browser test alternates **real native saved outfit selections** on both original 163-bone male/female rigs and verifies:

1. Candidate pinned dress: 0 denim bundles; pinned top-only shirt: **1**; baseline/restored legacy source loader: **2**.
2. Required work47 source manifest requests: candidate dress **1**, candidate top-only shirt **1**, baseline/restored **3**; do not suppress the remaining original denim verification.
3. Candidate top-only shirt: **no second denim source requests** from `/benchmark/three-d-37/`, yet real requests to the first denim source remain.
4. Same source-photo original JPEG SHA in native images and genuine source mesh, stale garment removal, unchanged photo-only outerwear, 163 bones, bounded per-mode renderer resource counts, correct same-owner rig, no writes to native saved outfit state.
5. Same-host baseline/candidate/restored final original WebGL canvas PNG pixel comparisons and source/material/geometry identity equality in both Chromium and WebKit. No source-photo fidelity or hardware-GPU claim from screenshot equality.

## Predecessor receipts, new CI and blockers

- Prior milestone 4 source was accepted exact-head by [CI #43635291885](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43635291885), Chromium and WebKit completed SUCCESS.
- M5 first head `04052f9e` failed two browser jobs due to the test incorrectly expecting zero *total* manifest requests. The original denim loader correctly requires one manifest per original source. A focused correction at `36df77d7` enforces the valid source-specific count. Its dedicated [CI #43637281544](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43637281544) must be checked independently; acceptance is **not inherited**.
- This M6 change is strictly stacked on M5, with its **own exact-head no-deploy CI pending at authoring**. No new M6 performance improvement is claimed before source-true two-engine results; n=4 baseline/candidate/restored is diagnostic, not physical-phone acceptance.
- Real Android/iPhone finger gestures/landscape/GPU, signed hosted private owner 3D, genuine owner approval of arbitrary photo-derived 3D meshes, rear/fabric/drape/multilayer collision validation, accurate hardware FPS/GPU/RAM and true full faithful outfit switching are **NOT TESTED/BLOCKED**. Mission #89 owns independent photo-geometry fidelity; master #1054 owns integration. **Keep Family Alpha #255 OPEN/HOLD.**
