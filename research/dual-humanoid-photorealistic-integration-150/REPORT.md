# Priority 150 — dual-humanoid appearance integration research

Status: **RESEARCH ONLY · REVIEW · Family Alpha HOLD · not a release candidate**

## Parent and verified source pins

This integration is based on P149 independent dual-humanoid visual evidence commit `240a9762720373607fb5c573d87e7cdbb86fc1b2` (PR #704, exact-head no-deploy CI #42412536180 passed). P149 is a verified descendant of P148 commit `0dedf3f8bae08dde92ccab8e44cbfb2cf47fe456` (PR #703). It uses the existing owner-scoped, read-only Outfit Builder preview and detached P541 donor `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`. It pins P118 skin/hair to `672247f7121e92bba32b81cec74efddb2b69c817` and P131 face details to `b57742ae71db627072ee2fbd43389849b242539c`.

The detached donor preserves the original branches and follows exact P149 HEAD `240a9762720373607fb5c573d87e7cdbb86fc1b2`. P150 requires the existing authenticated-owner/source admissions plus `humanoid150=research`. The appearance change only applies after a previously saved outfit is opened through the existing app builder.

## Implemented integration

- Connects the pinned P118 skin shader and restrained hair-cap treatment with P131 source-head-sampled eye, iris, pupil, eyelid, and brow geometry on the app's existing 163-bone female/male selector.
- Corrects the P131 face depth to match the visible +Z app camera after screenshot inspection. Removes P118 generated hair strands that obscured the face; preserves the crown cap.
- Keeps original owner/source SHA checks, session/revision rechecks, selected garment identities, outfit state, read-only donor, and unsupported garment photo/2D fallback intact.
- Adds browser tests for the real P148 native saved-outfit path and all six figure/view combinations at 320, 390, and 430 CSS pixels. The no-deploy workflow pins P148 ancestry and restricts changed source paths.

## Independent visual finding — unresolved

Genuine Chromium WebGL screenshots and P131's same-angle comparison gallery were inspected. Both figures load and change view, but the source head surface is not visibly carrying the expected skin appearance in the rendered app; the added facial details remain too detached. The female and male head presentation therefore **FAILS visual realism acceptance**. The result is useful as an integration proof and a defect reproduction, not as a photorealistic model or acceptable family-facing appearance. P131's screenshot delta is measurable, but pixel change is not a realism score.

The model has no verified realistic nose/lip/ear shape or realistic facial texture. This branch does not claim a visually acceptable face, realistic hair, or 10/10 photorealism. Next repair should bind appearance to the actual visible source head surface or replace the head with a separately licensed, anatomically appropriate rigged asset, then repeat the same-angle review before any user testing.

Photographed outfit integration remains the pre-existing source-limited behavior: independently verified dress, shirt, and selected denim source cases only. The tested saved dress rendered; jacket, coat, and shoes stayed in their original-photo fallback. This work does not improve garment fitting, cloth physics, arbitrary-photo reconstruction, recognition accuracy, or textile realism.

## Local verification record before exact-head CI

- `node scripts/build.mjs`: passed.
- Full inherited Node regression suite: **1,242 passed, 0 failed** on the working tree before final exact commit.
- P131 geometry suite plus P150 integration suite: **10 passed, 0 failed**.
- P131 genuine Chromium WebGL donor test: **72 screenshots**, both 163-bone figures, six views, widths 320/390/430, and 12 before/after comparison pairs. Its WebKit launch was unavailable because the runner lacks GTK/WebKit system libraries.
- P150 actual P148 owner-fixture app test: Chromium WebGL and source-photo SHA fixtures. It produced 18 screenshots (female/male × front/side/rear × 320/390/430), verified 163 bones, 7 skinned body materials, 1 retained hair cap, and unchanged saved-outfit state. Measured preview-open latency was 8,521 ms / 7,634 ms / 7,805 ms at widths 320 / 390 / 430; female-to-male figure switch was 2,723 ms / 3,235 ms / 3,101 ms. These are this runner's timings, not mobile hardware performance. The test does not use personal wardrobe data or live credentials.
- P150 WebKit: **UNVERIFIED** locally. Playwright cannot launch because system libraries are missing: `libgtk-4.so.1`, `libgraphene-1.0.so.0`, `libwoff2dec.so.1.0.2`, `libharfbuzz-icu.so.0`, `libhyphen.so.0`, `libmanette-0.2.so.0`, and `libGLESv2.so.2`. The workflow records this as unavailable rather than acceptance.
- Browser viewport emulation is not physical Android/iPhone verification. Account/auth and cloud paths in the P148 test use synthetic local fixtures; real signed-cloud RLS is not claimed.

The screenshot SHA receipts and per-width timing rows are in `benchmark/dual-humanoid-photorealistic-integration-150/screens-{320,390,430}.json`. Exact final commit and Actions result must be added after the dedicated workflow runs against the final PR head. A green CI run cannot change the visual realism failure above.

## Decision and boundaries

**Visual acceptance: FAIL. Priority readiness: REVIEW/incomplete pending a visible head-surface repair and exact-head CI. Family Alpha: HOLD.** Production and existing staging remain untouched. Do not merge, deploy, or lift the hold based on this research.
