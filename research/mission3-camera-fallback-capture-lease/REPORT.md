# Mission 3 — Camera permission fallback and in-flight shutter restart owner safety

**Immutable pinned Mission 3 parent:** PR #902 exact HEAD `d7e448ed56c380a45aa9ca46dbe1fb54ef71e758`, Actions #43155101476 completed 2/2 jobs and 1,558/1,558 Node tests, disposable signed owner PostgreSQL 17/RLS and Chromium/WebKit 320/390/430 synthetic browser checks.

## Actual-source defects

1. In `startCamera()`, a preferred-facing `getUserMedia()` rejection from an old permission prompt could settle *after* the camera was stopped, account switched, or page backgrounded. The `NotFoundError`, `NotReadableError`, or `OverconstrainedError` catch unconditionally initiated a second fallback `getUserMedia({video:true})`, unnecessarily reopening/requesting camera access from a revoked task. The stream was eventually stopped by the post-acquisition guard, but the second permission/device access was itself inappropriate.
2. `stopCamera()` did not reset `captureProofTaking` when a JPEG/source SHA verification was awaiting. Starting a replacement camera in the same account could leave its shutter disabled until the old image resolved. Its old `finally` was fenced only by account epoch, not by the camera request, so it could also incorrectly release the replacement camera's in-flight shutter state.

## Narrow correction

- Before initial camera permission after a deferred optional AudioContext resume, refuse work if the browser is hidden; stop/restore controls immediately.
- Before relaxed camera fallback, verify exact `captureOperationEpoch`, current `cameraRequest`, and document visibility. Old camera rejection cannot trigger another permission prompt; same-session hidden state stops and releases controls. Normal current-session unsupported facing selection still falls back as before; actual permission denial still cannot trigger fallback.
- `stopCamera()` immediately revokes `captureProofTaking`; `captureProofPhoto()` only releases that flag if both the owner epoch **and exact camera request number** still match. The old image may settle harmlessly without blocking or unlocking a newer camera.

## Evidence

The `tests/mission3-camera-fallback-capture-request-lease.test.cjs` file directly extracts unchanged runtime functions from both previous and current `public/app.js`. Ten deterministic cases cover old-account preferred camera failure, Stop/Done, hidden fallback, hidden delayed sound setup, normal supported fallback, real denial, stop while photo verifies, restart with old proof pending, current successful proof, and error cleanup. The dedicated GitHub Actions workflow strictly limits changed paths, verifies pinned baseline and candidate, executes full serial Node, synthetic Chromium/WebKit at 320/390/430, and disposable signed local PostgreSQL owner RLS. **NO DEPLOY.**

**Verification state:** waiting for exact-HEAD CI; no claim of physical device or hosted Supabase verification.

**Release restriction:** Draft only. FAMILY ALPHA HOLD #255. No merge, deployment, live user data, hosted Supabase calls, production or staging changes. Physical Android Chrome and iPhone Safari, authorized hosted two-account Auth/Storage and independent real-garment/3D acceptance remain open.
