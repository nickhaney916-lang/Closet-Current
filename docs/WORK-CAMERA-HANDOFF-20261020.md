# Closet Current — Work session camera-recovery cleanup and ownership handoff

**2026-10-20. Draft-only engineering integration. No production deploy, merge, or paid inference.**

## What Work completed and what had not finished

- Parallel ChatGPT Work finished [PR #89](https://github.com/nickhaney916-lang/Closet-Current/pull/89): bounded high-resolution 3072-pixel native capture, safe 2048-pixel repeated/video frames and orientation handling.
- Work independently finished [PR #91](https://github.com/nickhaney916-lang/Closet-Current/pull/91), exact `2d364a8537dc0e5be8ac7495d64bb78abad9b208`, with a final green [CI 39503986925](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39503986925), **1,186 Node passed, 0 failed, 3 skipped** plus Chromium/WebKit startup recovery. It resolves indefinite permission or video.play startup, optional audio lockup, stale request cleanup and delayed camera track termination.
- Work then began a follow-up investigation of *frozen/muted previews*, identified drivers that stopped delivering frames while the app could still queue photos, but created no new final commit or PR before its session capacity was exhausted.
- Main conversation independently completed [PR #92](https://github.com/nickhaney916-lang/Closet-Current/pull/92) (camera #89 + private cloud #90) and [PR #93](https://github.com/nickhaney916-lang/Closet-Current/pull/93) (the optional saved-closet accuracy audit). Neither included Work's #91 recovery until this handoff.

## Exact-history integration

This branch is based on PR #93 exact `cd99b47dce2ccd3fc2efa5c25c51d8b4f8837458`. Its historical **two-parent** handoff commit `6b85dfd61428f5bfd656dd6a4b702ad1c791ac7b` has both main #93 and Work #91 commits as actual Git parents. Work's five non-conflicting camera/test/QA/doc blobs were copied byte-for-byte at merge; the main pilot data, source asset hashes and human review evidence remained unchanged. Neither source PR was force-rewritten or merged into production.

All subsequent changes are deliberately scoped to camera frame-delivery handling, its regression tests, the narrowly updated historical app-byte/independent-review validation gates, and this QA/handoff package. The ownership-integrity script still rejects unrelated changes to recognition, indexing, figure preview and independently approved masks.

## Frozen / muted preview follow-up

The camera now monitors **delivered video frames**, not changing brightness, motion, or texture. A stationary dress or shoe legitimately produces repeated nearly identical pixels and must remain capturable if the browser is still delivering frames. The implementation:

1. Uses `HTMLVideoElement.requestVideoFrameCallback` when available, and a progressing `currentTime` video playback clock when frame callbacks are absent.
2. After a sustained 4.5-second observed frame-delivery stall, stops the camera and offers a clear restart/import path rather than indefinitely queuing stale frames.
3. Never accepts a manual or automatic photo while the camera's live video track is muted or ended, including during native ImageCapture fallback or a late still resolution.
4. Preserves the photos already in the queue and immediately enables a fresh retry. Generation-bound callbacks and interval cancellation prevent old camera sessions from altering newer ones.
5. Suspends stall detection when a browser tab is hidden, because browsers normally pause frame delivery in the background; identity guards remain active.
6. Does **not** falsely claim to detect all freezes on older browsers without a frame-callback or advancing-playback observability API; muted/ended tracks and manual invalid-quality paths remain guarded.

The original whole-scene RGB photo remains the input to recognition **before clipping or masking**. No garment preprocessing, identity, backup policy, or paid rendering path is changed.

## Reproducible software evidence

GitHub workflow `.github/workflows/work-camera-handoff-integration.yml` runs:

- Complete customer build, all Node tests, immutable Work/main two-parent lineage, human reviewer source evidence and release-denial gates.
- Android Chromium and iPhone WebKit emulated startup/permission timeout and recovery from Work.
- Browser-delivered frame simulation in both mobile engines: stationary garment with live frames accepted; frozen preview stops with retained photos; muted track blocks capture; retry and older-session callback isolation.
- Native full-resolution still capture, orientation and photo import, original-source/duplicate indexing guards.
- Private saved-closet audit, owner-specific cloud IndexedDB recovery, full multidevice backup/conflicts and owned-clothing styling flow.

**Tests are synthetic driver/browser emulation, not proof of physical phone camera behavior.** Actual iPhone and Android permission prompts, OS backgrounding, black/frozen preview modes, 5-second photo cadence, high-resolution color, HEIC import, low memory, real account/RLS access, login SMTP, two independently approved original-pixel masks and reusable model-figure rights require controlled human evidence. A simulated 100% test run cannot authorize a launch.

## Current project plan

Keep this chat as the single main product-development thread. PR #94 (this follow-up) is the newest integration successor to PR #93; older PR #89/#90/#91/#92/#93 remain immutable draft historical checkpoints, not separate active action lists. **Do not close or merge source PRs merely to reduce GitHub clutter**, since they form an auditable ancestor chain. No production deployment, billable AI providers, user photographs in CI, or Drive Duel modifications without separate approval.
