# Mission #90 Milestone 20 — native source-attested viewer respects OS reduced motion (DRAFT / HOLD)

## Lineage and non-release scope

Research only. M20 is stacked on immutable M19 draft #1199 head `afce7ad364ae6fe2f08f7893d9203de4a113867d`, which inherits original donor-pinned, source-verified 163-bone male/female rigs, original locked-license JPEG identity, M15 original owner/pointer revocation, M16 Chromium native touch orbit, M17 full 360 and provenance, M18 original-photo shortcut, and M19 explicit pause for Auto rotate. No consumer public path, hosted RLS, private owner photos/wardrobes, original skeleton, mesh/texture/UV/cloth, source JPEGs, production/staging or any merge/deployment changed.

## User-facing motion accessibility improvement

The genuine opt-in 3D research viewer now respects the OS/browser `(prefers-reduced-motion: reduce)` setting:

- Clicking **Auto rotate** in reduced-motion mode does not animate, and shows a clear owner-facing message that the automatic turntable is paused while manual rotation remains available.
- If the OS preference changes from `no-preference` to `reduce` *during* an existing autonomous turntable, the same pinned source showroom immediately calls `scene.setSpin(false)`. Changing back to `no-preference` never silently restarts animation. Users must explicitly start it again.
- Manual 15° rotation, drag, zoom, reset and photo-only fallback are unchanged; no new 3D authorization is granted.
- OS media listener is detached when the actual source-pinned research panel is destroyed to avoid callbacks after account/outfit teardown, and callbacks check the existing private owner session before touching a 3D scene.

## Genuine browser acceptance on both engines

At 390 CSS px on the **actual original 163-bone male and female rigs** in Chromium and WebKit mobile-sized browser contexts:
1. Start from source-verified, owner-bound front camera. Apply real browser media preference `reduce`. Click existing Auto rotate; ensure camera drift is below 2° over 750 ms and accessible original owner status announces motion reduction.
2. Re-enable `no-preference`, explicitly start real avatar auto-spin and require >5° of actual camera motion. Switch the OS preference to `reduce` during the spin, require drift below 2° over 750 ms.
3. Return to `no-preference`, require no unprompted restart over 600 ms. Exercise original manual rotate-right and require >5° motion.
4. Assert the authentic selected source JPEG SHA, actual original 163 bones and WebGL geometry/texture counts and active owner 2D saved wardrobe remain identical. Restore `no-preference` in a browser test `finally` block and reset the camera. Emit `reducedMotion20` only on success.
5. Preserve all M14–M19 original 3D/source/owner/collision tests, 16 saved switching, mid-pointer owner revocation, WebGL context loss, original-source RGB photo comparisons, tuned BVH-only same-source control and the full inherited Node suite.

All of this is CI real browser rendering with synthetic auth and licensed source images; **not** actual physical Android or iOS testing, hosted private owner RLS or a user-approved arbitrary multi-garment 3D reconstruction.

## Acceptance

M20 remains NOT ACCEPTED until its own exact final HEAD Chromium and WebKit dedicated no-deploy CI and all inherited baseline/source evidence succeed. Do not infer release readiness from passing isolated research. Physical-phone GPU FPS/RAM, true Safari finger-swipe, full arbitrary owner front/back photo-derived textured multilayer garments, human visual fidelity, signed hosted account and master #1054 integration remain open blockers. Family Alpha [#255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) stays OPEN/HOLD. No merge/deploy or stage/production changes.
