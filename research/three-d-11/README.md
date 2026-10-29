# Closet Current 3D-11 — verified original-photo fallback when WebGL is unavailable (HOLD)

**Reason for this development step:** Independent [Chat57 QA PR #407](https://github.com/nickhaney916-lang/Closet-Current/pull/407) identifies missing user-visible 2D/original photo fallback when actual 3D fails. This is **not** a request to improve or restart 2D avatar development. It preserves our 3D-first direction and prevents the experimental real-clothing showroom from going blank on a phone whose GPU, WebGL, or locally pinned GLB fails. Meanwhile Work59 handles natural garment drape and the independent QA team handles visual/mobile grading. We do not duplicate their code.

**Exact source base:** [main-thread source/relaxed skinned shirt PR #404](https://github.com/nickhaney916-lang/Closet-Current/pull/404) plus [scope-only QA PR #406](https://github.com/nickhaney916-lang/Closet-Current/pull/406), immutable parent commit `dabee1903c71c0d571b64bbb7570d788a127286a`.

## Implemented behavior

- Move Work47 licensed benchmark verification **before** constructing `THREE.WebGLRenderer`. Both original JPEG and provisional transparent PNG still require exact pinned original SHA-256 from the existing Work47 source and licensed manifest. If corrupt, do not show an unverified original or a 3D garment.
- The research showroom includes a visually centered, readable original-photo-only panel and a status that explicitly says **no fitted, saved or approved 3D garment**. Only the exact existing `commons-0003` original licensed JPEG can populate it; the current experimental garment fitting engine remains completely untouched.
- On WebGL construction failure, missing/corrupt local CC0 GLB, or WebGL context loss, reveal the verified original photograph; hide the unusable canvas and disable rotation, pose, model, preview approval, and fitting controls. No automatic garment save/owner approval or remote asset fallback.
- Failed source verification also fails safely: no image shown and an explanatory message, not a substituted uncited photograph. The original source and Cutout images are only loaded after source byte hashes pass. This is a privacy and device recovery feature, **not a release-quality 2D avatar**.
- No cloud, CDN, API, login, account/wardrobe write, family photo, production/staging or paid per-outfit service is involved. The fallback is explicitly for the experimental local research page. No changes to Work59's garment-builder and no Drive Duel edits.

## Verification and deliberate limits

The dedicated 3D-11 no-deploy workflow enforces the exact 7-file research-only diff from #406 head, reconstructs all Work47 licensed assets and the pinned male/female CC0 models, runs deterministic unit tests, **real Chromium at 390px with disabled WebGL, blocked model and tampered source JPEG**, then replays full inherited 3D10 WebGL2 320/390/430 real-shirt/relaxed-pose regression. The failure tests must prove:

- Verified original is visible when GPU/GLB unavailable, never an unverified replacement.
- No canvas body, copied source on a fake garment, enabled 3D control, saved outfit or owner approval.
- Missing/corrupt source JPEG produces no displayed original and blocks all fitting.
- Zero network requests outside the test's loopback origin. GPU and original-photo evidence are captured as HOLD artifacts.

**Human 3D appearance approval remains HOLD**. Passing recovery tests does not fix collar/drape/pose skinning, nor the separate camera/indexing CI failures. Last independent 15-garment photo visual baseline remains 0 PASS / 5 REVIEW / 10 FAIL. Four family members are still not invited until authenticated staging per-account JWT/RLS, backup restores, actual phones, and owner visual signoff.

Development only: **NO MERGE, NO DEPLOY, NO PRODUCTION/STAGING CHANGES**, no Drive Duel modifications.
