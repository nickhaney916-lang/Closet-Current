# Closet Current — Mission 3 mobile media lifecycle interruption (HOLD)

**Parent:** verified Mission 3 legacy atomic backup PR #939 exact SHA `98a9e3e9d240375a8c0efb88332d1c239d92b3f7`. All changes isolated to a new research branch and draft stacked PR. Family Alpha HOLD #255 remains active; no merge, production/staging deployment, hosted Supabase mutations or family wardrobe access.

## Defect and fix

An interrupted camera had been stopped on backgrounding, but video and gallery imports could remain pending inside HTMLMediaElement metadata/seek or original JPEG decode. On a brief hidden→visible cycle, the previous check of `document.hidden` could already be false when a pending Promise resolved, letting an old operation continue as if it had never been interrupted. During an old video metadata await, the video busy indicator and controls were also held until timeout. A stale former video finalizer could reset the new owner's or newly started gallery's controls.

- Introduced a **media lifecycle epoch** which increments on every pagehide and hidden-visibility event, even if visible again before the queued async Promise resolves. Signed owner `captureOperationEpoch` remains separate.
- All camera permission / playback work, verified shutter-original hashing, video metadata/seek and JPEG private draft commits, and multi-gallery photo decoding attest the initiating lifecycle epoch alongside their original signed owner/session. Sign-out continues to revoke all outstanding operations.
- Explicit active video/galleries use independent generation tokens. Interrupting either instantly releases the app controls, removes and pauses an active video blob source, and preserves any private photo whose IndexedDB write has already committed. The old finalizer cannot close newer media or enable buttons during a newer operation.
- A paused gallery returns without decoding its remaining images into the next owner. A fresh owner-selected retry reuses the ordinary JPEG verification and private draft commit; a frame that never committed cannot be promised recoverable after a process crash. User messaging distinguishes confirmed stored pictures from transient review-only pictures.
- Existing camera shutter and video scan behavior when uninterrupted is unchanged; no new storage of unverified captures or cross-account recovery shortcuts.

## Verification

`tests/mission3-mobile-media-interruption.test.cjs` runs the **exact source-extracted functions** with deterministically held video metadata / JPEG decode and synthetic owner changes. Covers interruption, rapid background→foreground, re-login same user ID, new media operation independence, no phantom interruption status, and uninterrupted valid gallery imports.

`scripts/test-mission3-mobile-media-interruption-browser.mjs` loads actual `public/index.html`, mobile source and real native IndexedDB in **Chromium and WebKit at 320, 390, 430 CSS pixels**. It uses synthetic original JPEGs with actual SHA-256, source-verification and owner-private IndexedDB writes. It stalls an actual media element's loadedmetadata await, triggers pagehide, immediately starts another JPEG gallery import, and proves the stale video finalizer cannot unlock the new operation. It then stalls a second gallery during a rapid hidden/visible transition and verifies no stale photo was added. A fresh retry must add the original privately. Finally, signed-owner switch during decode must prevent a former owner's photo from reaching the next owner. Off-host requests are blocked; video metadata is simulated and no physical phone or hosted cloud is claimed.

The dedicated no-deploy CI includes exact-parent and six-path allowlist, source tests, full serial Node suite, owner-private Chromium/WebKit regression, native restore and backup import, a disposable two-user PostgreSQL Storage RLS run, and proof artifacts.

**Do not mark verified until exact-HEAD dedicated CI is successful.**

## Remaining complete-release gates

Real physical Android Chrome and iPhone Safari app lifecycle/camera tests, authorized hosted Supabase two-owner Auth/Storage backup/restore, real-photograph category/color/instance and human approval benchmark (Mission 1), photographed garment-to-3D anatomical fitting (Mission 2), and a controlled owner-approved integration/rollout are still missing. Because of those dependencies, passing synthetic CI does NOT establish a finished release. Family Alpha HOLD #255 remains active.
