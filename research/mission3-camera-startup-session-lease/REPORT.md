# Mission 3 — Camera startup session lease (Family Alpha HOLD #255)

## Scope and immutable baseline
- Exact compatible parent: draft PR #886, `213261a06510a4e00c781f2547b1492b629c2e45`, independent no-deploy signed two-owner baseline.
- This isolated draft changes only `public/app.js`, `tests/mission3-camera-startup-session-lease.test.cjs`, this report and a dedicated NO DEPLOY workflow. No merge, deployment, hosted Supabase change, owner-data operation or protected-branch modification.

## Identified defect in actual source
- `startCamera()` awaited `video.play()`, then reset `session`, `sessionCount` and the last-capture image *before* checking whether a new account replaced the request.
- The old camera's `finally` could unlock the new owner's busy capture when `cameraOpening` and `stream` had been cleared during sign-out.
- A deferred `AudioContext.resume()` could continue requesting `getUserMedia()` after session revocation.

## Narrow fix
- Bind `startCamera()` to the existing monotonically increasing `captureOperationEpoch`.
- After audio resumes, decline to request permission if the session or camera request changed.
- Stop any acquired camera tracks if the initiating session/request was revoked.
- After `video.play()`, check the original lease **before** mutating next-owner counters or rendering.
- Restrict catch/finally cleanup to the active initiating epoch and request, never to the generic `!cameraOpening && !stream` state.
- Same-owner manual-camera startup remains unchanged.

## Reproducible independent verification
- New source-extracted Node test executes the exact application `startCamera()` in a restricted VM.
- Four cases: old `video.play()` resolution after owner switch; late old `getUserMedia()` finalizer during newer busy capture; deferred `AudioContext.resume()` after sign-out; ordinary successful same-owner manual camera start.
- Dedicated CI uses the exact pinned P886 parent as EXPECT_BASELINE=1 and the patched app as current; guard refuses modifications outside the four scoped paths. It additionally runs inherited serial Node, local signed-JWT disposable PostgreSQL RLS and Chromium/WebKit synthetic mobile browser suites.
- **Verification status: awaiting exact-head CI completion. Do not claim acceptance from source inspection or successful commit alone.**

## Remaining external release gates
Physical Android Chrome and iPhone Safari camera lifecycle/memory; authorized hosted two-account Supabase sandbox; real garment recognition and photograph-to-3D integration. No real-owner cloud, staging or production was touched.

**DRAFT / UNMERGED / UNDEPLOYED / FAMILY ALPHA HOLD #255.**
