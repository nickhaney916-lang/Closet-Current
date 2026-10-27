# Closet Current — retain real phone-still detail without regressing protected camera (HOLD)

**2026-10-27 · Issue #255 · development branch only, no staging or production deployment**

## Discovery

Work #40 [draft PR #342](https://github.com/nickhaney916-lang/Closet-Current/pull/342) is useful exploratory research but its own browser integration is red (test timed out before preview), and it does **not** implement live wardrobe capture. Crucially, the currently source-pinned Family Alpha recognition candidate already supports `ImageCapture.takePhoto()` for *manual* still photos with a 4-second hung-driver timeout, camera identity guards, cancellation on new session, EXIF/orientation-aware `createImageBitmap()`, metadata-stripping canvas JPEG encoding, and bounded video-frame fallback. Replacing that with #342's simpler prototype would regress previously built protections. Work #41 independently owns clothing layer compositing and is untouched.

## Implemented improvement

- Keep the protected manual still path intact, changing only its ordered size targets from `[3072,2560,2048,1536,1024]` to `[4096,3072,2560,2048,1536,1024]`.
- Allow source-backed manually acquired stills to fit the same maximum encoded data URI length, **5,600,000 characters**, as protected high-resolution gallery imports in PR #340. Retain the descending quality attempts `.94/.88/.82`; each resolution attempt always redraws from original decoded sensor-still RGB, never a prior scaled JPEG.
- Keep auto hands-free video-frame capture capped at **2048px** with its pre-existing 2,850,000-character URI limit to control continuous multi-photo memory and IndexedDB quota pressure. It never pretends those video frames are genuine stills.
- No change to manual shutter timing, expiry, cancellation, camera permission, preview health, automatic cadence, worker recognition, original JPEG crop/indexing, clothing cutouts, full 2D human, favorites or atomic-save rollback.
- The manual still passes `createImageBitmap(blob,{imageOrientation:'from-image',colorSpaceConversion:'default'})` and **canvas re-encoding**. No original EXIF/IPTC/GPS marker bytes are directly saved or uploaded. It is a genuine higher-resolution *decoded still*, not a raw original JPEG preserved byte-for-byte and not synthetic pixel enhancement.

## Source-pinned, synthetic-only proof

`scripts/build-family-alpha-43-still-source-hold.mjs` inherits the exact [#341](https://github.com/nickhaney916-lang/Closet-Current/pull/341) disabled stage Auth/Cloud full Family Alpha candidate. Only the **`captureCameraStill` function within offline `app.js`** is permitted to change. All other pixels, photo importer, private wardrobe, owner session, worker, 3 outfits, shoe safety, IndexedDB, and network routing files are audited for byte identity.

The direct Node tests enforce exact camera bounds, one function and fail-closed release flags. Browser automation in Chromium/WebKit at 320/390/430 uses a **synthetic decoded 3400 × 2300 JPEG** with an added artificial APP1/GPS marker, mocks ImageCapture hardware without any user camera access, and checks:
- output still retains 3400px detail when within size cap, instead of automatically downscaling to 3072px or 2048px;
- output contains no injected GPS text and remains decodable;
- a late camera-result after session cancellation cannot be retained;
- zero requests leave the local test server.

The inherited #341 complete 3-outfit Style My New Clothes, source JPEG, original-photo recognition privacy, manual cutout, full 2D human and atomic save/rollback browser regressions run as well. Browser emulation does **not** verify physical Samsung/iPhone camera support, quality from real apparel, memory on low-end devices, actual RLS or four signed-in family accounts.

## Remaining blockers

Unverified camera hardware performance, no successful real-phone photo source review, unfinished garment clipping/visual fitting, incomplete Work #41 multi-garment compositing research and 4-account live JWT privacy gate. These are not certified by a synthetic PASS.

**FAMILY ALPHA HOLD.** No merging, staging/production deployment, Supabase/Cloudflare/Resend configuration, account creation, real family photos, new Work assignments, paid model/service, spending or Drive Duel modifications.
