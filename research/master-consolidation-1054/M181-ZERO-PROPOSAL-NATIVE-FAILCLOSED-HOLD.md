# M181 — Normal PWA zero-proposal model failure recovery (HOLD, no deploy)

## Root cause in genuine default user experience
The M177 independently observed WebKit real P88/SegFormer model sometimes produces **zero unverified clothing proposals** after successfully obtaining pinned WASM and model files (two separate genuine Red WebKit attempts). The model root cause is separately owned by WebKit reliability M178/M180 diagnostics, which this branch does not modify.

Existing native `public/outfit-capture.js` previously treated `{type:'done',count:0}` as a **successful** scan and set `#outfitRetry.hidden=true`, stranding a normal-user outfit import without a retry even though 0 clothing pieces were accepted. A dishonest worker-supplied nonzero `count` could also not prove an accepted crop. This is a proven default UI behavior gap **regardless of WebKit's eventual model root cause**.

## Isolated correction
- In `public/outfit-capture.js`, decide terminal success from `job.added > 0`, not worker `data.count`. Zero new accepted crops are an honest failed/no-write outcome with visible `Try separating again` and direct instruction to select the already-existing **Single item** control for real individual-photo review. Previously reviewed photos/private closet are retained. Worker termination, timer cleanup, account/source proof, original-JPEG preservation, missing-credential refusal, manual confirmation and no-fitted-3D remain unchanged. No 2D viewer or worker modifications.
- Extend existing `tests/outfit-capture.test.cjs` with negative zero, hostile worker count, stale worker after retry, duplicate-only, no automatic owner saves and retained source tests.
- `scripts/test-main181-zero-proposal-native-browser.mjs` runs the **actual built normal unflagged PWA** in genuine installed Chromium/WebKit (320/390/430 CSS widths) with a **deliberate negative-only Worker message `done count 0`**. Asserts Home→whole outfit→real licensed photo file chooser→zero-result retry visible→repeat failure doesn't write→Single item→normal gallery→Adjust explicit synthetic owner category, subtype, color and one-garment confirmation→private IndexedDB row with unchanged licensed public JPEG SHA and 3D denied. The Worker is synthetic **ONLY to force the known negative case** and does not establish real model accuracy/recognition, WebKit P88 inference reliability, segmentation performance, or physical phone results.
- New *separate* 3-job source-pinned no-deploy CI: all inherited Node tests, offline PWA build, Chromium/WebKit negative-path native acceptance × three viewport widths; no cloud or hosted data writes, no model substitution in production app.

## Source and acceptance contract
- Immutable held Mission 4 parent: `38322b2c48e27f7b0d636395306a68777115487b` (M179 accepted default normal P99 consumer + EXIF orientation).
- Allowed diff limited to `public/outfit-capture.js`, `tests/outfit-capture.test.cjs`, `scripts/test-main181-zero-proposal-native-browser.mjs`, `.github/workflows/main181-zero-proposal-native-no-deploy.yml`, this handoff.
- No `public/app.js`, real source worker, auth/owner receipt, Supabase, v3/v4 backup/restore, original fixtures, training data, photo fit, other parallel assignments, staging/production or release.
- **Completion gate:** exact-HEAD independent push/PR 3/3 CI, original negative-path regression and full inherited Node test green. This is a narrow failsafe app correction, not a model reliability fix; the original M177 WebKit genuine worker 2/2 red and separate M180 genuine repeated first-load results remain authoritative for real-model reliability. Admission into protected held M4 requires separate scope and protected 7-job source-pin review, not automatic merge.

Release: Family Alpha #255 OPEN/HOLD, no default-main merge, deployment, real family data, physical Android/iPhone acceptance, blind garment accuracy, hosted JWT/RLS, or genuine source-fitted photorealistic 3D.
