# Priority 107 — independent mobile 3D visual acceptance

**Research only.** Family Alpha remains HOLD under issue #255. This branch must not be merged or deployed. Production, existing staging, Supabase data, private wardrobes, and other projects are outside scope.

## Baseline and source boundary

- Build on completed, independently green PHOTO106 commit `9d7782e358edb20672685fe97af255aca8d0d8b1`, draft PR #660, dedicated no-deploy run [42271009212](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42271009212). Its verified parent PHOTO105 is `c142a0d1143096a392088cdc4e4a4832b09de57b`, green run [42249699032](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42249699032). PHOTO106 completed while P107 was in progress and has no overlapping paths; this benchmark now independently incorporates and retests it.
- Build the visualization only in a detached donor worktree pinned to the verified CC0 163-bone PR541 rig, then install the PHOTO103/104/105/106 research overlays. Never patch the application bundle.
- Public source jeans only: Wikimedia Commons public-domain `Jeans.jpg` (SHA-256 `b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c`) and CC BY-SA 4.0 `Denimjeans2.JPG` (SHA-256 `aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a`). Both are laid-flat **front-only** photos. The neutral 3D rear remains explicitly unphotographed.

## Reproducible visual matrix

`scripts/test-mobile-3d-visual-107.mjs` runs real WebGL against Chromium at CSS widths 320, 390 and 430, with optional WebKit when the installed browser supports WebGL. It renders male and female anatomical figures, both verified original source images, the source-rest knee angle 0° and the bounded bent-knee angle 16°, and camera angles 0°, 45°, 90°, 135°, 180°, 225°, 270° and 315°. It also sends direct pointer-drag and wheel-zoom input through the mobile-emulated viewer and measures the actual camera angle/distance response. It records source hashes, renderer name, PHOTO106's true P77 body-contact counts compared with PHOTO105, exact viewport/camera/pose, screenshot SHA-256, animation-frame timing samples, available JS heap readings, external requests, browser errors and crashes. The test also swaps denim, resizes, returns to source pose, and closes/reopens scenes.

The Chromium matrix produces 384 actual screenshots (2 figures × 2 photos × 3 widths × 2 poses × 8 views × 2 reopen cycles). The image auditor independently rehashes each PNG, checks dimensions, uniqueness and nonblank pixel distribution, revalidates scenario coverage, and verifies PHOTO106's sampled P77 body-contact counts against PHOTO105 at every pose. It also records PHOTO106's measured rear-calf vertex movement and displacement. WebKit evidence is reported only if the browser launches and the WebGL viewer runs; lack of support is reported as unsupported, not passed.

This is genuine public-photo WebGL evidence in browser-emulated mobile viewports. It does not establish rendering on an Android/iPhone device. Image pixel differences, frame timings, and geometry counts are engineering measurements, not human photorealism scores.

## Findings and limits

- Existing source images show a single photographed front. A reverse-side photograph is unavailable, so the rear is a neutral unphotographed surface; reviewers must not judge it as scanned fabric fidelity.
- The carried PHOTO106 geometry changes only source-neutral rear/side calf vertices by a bounded, pose-relative amount; it preserves the photographed front image, UV/rest/skin inputs and measures actual P77 body contact against PHOTO105. This benchmark evaluates that measured geometry but does not claim continuous cloth simulation or generalized garment physics.
- Existing risk areas remain: provisional source-derived jeans cutouts, a visually simplified neutral rear, limited 16° knee flexion, possible texture softness at narrow widths, and no independently scored realism. Those require human inspection of the generated evidence.
- Frame-time and heap metrics are environment observations only. CI software-renderer performance is not representative of a phone GPU; JS heap does not equal GPU memory. The recorded data must be compared within the same runner before drawing an optimization claim.

## Human review intake

`review/scorecard.json` is an empty intake form. CI generates 64 matched PHOTO105/P106 source-bound pairs with anonymous A/B identifiers, shuffled using a fresh random seed per run; the version map is a distinct unblinding artifact and is absent from the reviewer packet. Share only the blind packet with reviewers and collect scores before unblinding. This is an operationally blinded handoff, not an access-controlled system: anyone given the PR or the complete Actions artifact list can inspect implementation artifacts. Reviewers should independently score anatomical realism, clothing contact, fit, drape, photograph/color fidelity, silhouette, seam/edge quality, all-view consistency, mobile readability and overall realism from 1 to 10, then note defects. Record reviewer ID privately outside this public repository. No reviewer results are included or fabricated here. A 10/10 claim requires actual independent reviewers and predefined acceptance criteria.

## Explicitly unverified

- **Human visual acceptance:** NOT YET VERIFIED; no independent reviewer result.
- **Physical Android/iPhone:** NOT VERIFIED; Chromium/WebKit viewport emulation only.
- **Signed-account cloud privacy/RLS:** NOT VERIFIED; this work made no cloud requests.
- **General user-photo garment fitting:** NOT VERIFIED; only the two licensed source-bound jeans are covered.
- **Continuous cloth physics:** NOT VERIFIED and not implemented.
- **Family Alpha release authorization:** HOLD; issue #255 remains authoritative.

The independent audit output is `benchmark/three-d-107-audit/acceptance.json`; source screenshots and scenario receipts are stored under `benchmark/three-d-107/`. Generated machine-readable results must only be treated as valid after the dedicated no-deploy workflow succeeds on the exact PR head.
