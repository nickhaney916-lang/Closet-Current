# Closet Current Mission 3 — recognition queue and private save owner epoch safety

**Family Alpha HOLD #255 — DRAFT / UNMERGED / UNDEPLOYED.**

## Exact parent
Pinned green PR #890, HEAD `b1e817c3bd6b8d1f77c253574f40600c832b5449`, no-deploy Actions #43147015094: 2/2 jobs, 1,539/1,539 Node tests, disposable signed-JWT PostgreSQL 17 RLS and synthetic Chromium/WebKit mobile browser suites.

## Actual-source race
Account sign-out invalidated the local Worker and its job map, but left `automaticQueue`, `automaticRunning`, `localLoadPromise`, `localReady`, pending recognition status and async `recognizeItem` continuations active. The former owner's delayed `checkPhoto`, worker setup, or database save completion could still repaint the new session, persist that new owner's review batch, mark its scanner ready after the old worker was terminated, or append a former owner's saved garment into the new owner's in-memory roster after a transaction completed. IndexedDB itself remains owner-private; the unacceptable risk is transient shared UI/in-memory contamination.

## Scoped correction
- On `closet:session-locked`, invalidate the queued/pending recognition and scanner state, revoke previous session capture receipt IDs, and preserve prior owner/private DB cleanup.
- Fence automatic queue finalizers to initiating monotonically increasing `captureOperationEpoch`.
- Fence deferred worker `enableLocal()` load successes/failures; an old load can never mark the new scanner ready or clear its new loader.
- Fence `recognizeItem()` after photo-quality and classification awaits, before auto-save, and in catch/finally. An old recognition may not persist/render the next owner's draft.
- Fence `saveIndexed()` at queued transaction execution and after IndexedDB commit; only initiating DB/epoch can update in-memory garments.

## Deterministic regression
New source-extracted `tests/mission3-recognition-session-epoch.test.cjs` tests the original and patched function bodies: old photo completion, old worker-load completion, old queue finalizer, old saved transaction completion, normal same-owner save, and session-lock cleanup. The dedicated workflow verifies **exact previous parent vs patched code**, rejects unrelated changed paths, runs full serial Node and the same local signed PostgreSQL and Chromium/WebKit mobile suites from the green P890 workflow, and uploads synthetic-only artifacts.

**Verification status: not yet accepted until exact-head GitHub Actions completes successfully.**

## Outstanding release gates
Real Android Chrome and iPhone Safari, an explicitly approved hosted Supabase two-owner sandbox, independently pre-labeled real garment recognition and photographed clothing-to-3D integration. Do not merge, deploy, change production/staging or remove Issue #255 hold.