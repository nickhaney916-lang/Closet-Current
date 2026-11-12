# Mission 3 — capture operation epoch protects the next signed-in owner

**DRAFT / UNMERGED / UNDEPLOYED / FAMILY ALPHA HOLD #255.**

## Exact accepted starting point

Directly stacked on [Mission 3 PR #884](https://github.com/nickhaney916-lang/Closet-Current/pull/884) HEAD `505e085b21730ca3cd38700a016e632dd75579e0`, [Actions #43139135116](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43139135116) **2/2 success**, with full serial Node regression, disposable signed-owner PostgreSQL 17 RLS, 6 real Chromium/WebKit synthetic video owner-switch browser cases and two archived synthetic evidence bundles.

## New race

P884 guards old capture failure state and video messages after signout, but the **`finally` of an older `upload(file)` still runs unconditionally**, resetting shared `busy`, camera controls, the `video` source and capture status. If a different owner starts a new video/camera import after the lock while that older `upload` is in flight, the prior owner's finalizer can remove the new owner's video or re-enable buttons during its capture. `importClothingPhotos` has a similar late-result path: its old result is published into the new owner's UI and its finalizer clears new-owner busy/controls. A pending camera proof can also finish after lock and release the next owner's `captureProofTaking` flag. Session lock did not explicitly clear an active video Blob URL or the outstanding import busy state.

## Implementation

The actual `public/app.js` maintains **one monotonically increasing `captureOperationEpoch`**. Every `closet:session-locked` increments it before shutting down the camera, closing owner-visible data, clearing active upload/busy controls and retiring an old Blob media source. Video import, photo/video gallery import, live camera capture and delayed error callbacks capture the current epoch, checking it after each asynchronous stage and before manipulating UI or shared media. An old video's `finally` revokes only its own temporary URL, never clears a new owner's media, buttons or status. Same-owner normal completion still cleans everything. Owner and IndexedDB checks remain in place, not replaced by the epoch: re-signing in with the same owner ID does not revive an earlier import.

Four existing source-extracted test fixtures now supply a generation variable to the actual extracted `app.js` functions; no unrelated production source, authentication, storage SQL, or hosted resources are changed.

## Tests and scope

New `tests/mission3-capture-operation-epoch.test.cjs` runs actual extracted app functions against the pinned green P884 parent and current source. It covers: old video finalizer after a new owner starts video; normal same-owner cleanup; stale gallery result/finally; ordinary gallery import; old live-camera proof vs new capture flag; stale vs same-session capture error; and session-lock release and Blob revocation.

`scripts/test-mission3-video-epoch-controls-browser.mjs` uses real Chromium/WebKit native synthetic video decode at 320, 390 and 430 CSS widths. It signs a synthetic old owner out after a completed JPEG frame, creates a fresh second-owner media source and busy state while the old import is still resolving, then tests that **the second owner's media URL, disabled capture controls and status remain unchanged**, alongside old/new account isolation and original photo SHA. Six test cases, screenshots and JSON SHA evidence only.

Dedicated no-deploy GitHub Actions enforces the accepted parent SHA and **nine changed paths**: one `public/app.js`, four inherited source-extraction fixture tests, one new unit test, one new browser test, this report and one new workflow. It reruns full serial Node, signed disposable PostgreSQL RLS, all previous synthetic Chromium/WebKit viewport suites and the new six cases, then packages only synthetic evidence.

## Limits

This is not a physical Android/iPhone camera, background/suspend or device-quota test. Real hosted Supabase Auth/Storage two-account acceptance, independently labeled real garment recognition and Photo-to-3D realism remain unverified. Family Alpha must not be enabled or deployed without the owner's explicit release decision.

**Exact-head CI pending; no release signoff.**
