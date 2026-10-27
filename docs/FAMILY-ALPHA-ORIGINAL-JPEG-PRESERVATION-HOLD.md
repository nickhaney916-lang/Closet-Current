# Closet Current — preserve authentic clothing JPEG detail without metadata leakage (HOLD)

**2026-10-27 · Family Alpha issue #255 · main-chat independent integration**

## Problem and measured source limitation
[Work #39 / draft #338](https://github.com/nickhaney916-lang/Closet-Current/pull/338) found that the original application's `photoToJPEG()` always decoded and recompressed selected photos, downscaling any image above **2,048 pixels**. Even a sharp JPEG was unnecessarily re-encoded before garment recognition, saving and background isolation. The camera `snap()` captures a decoded video frame at up to 2,048 pixels and is **not** equivalent to a full camera-sensor still photograph.

## Source changes
This development candidate makes a **minimal actual app-source improvement** in `public/photo-import.js` only. The existing `readPhotoBatch`, `importClothingPhotos`, camera, duplicate handling, recognition-first-from-unmasked-image, garment clipping, normalized wardrobe model and IndexedDB atomic save are unchanged.

1. When a selected file is a JPEG, **≤4 MiB**, **≤4,096px** each axis, has structurally valid JPEG markers, contains only ordinary thumbnail-free JFIF (APP0), and has **no EXIF, XMP, unknown APP, Photoshop/IPTC, ICC vendor payload or comment metadata**, preserve the **exact bytes** as the authoritative JPEG source data URI. There is no secondary JPEG encode, no simulated sharpening, no upscaling, no derived fake context. A plain exported/studio JPEG benefits immediately.
2. If those strict conditions fail—including an ordinary phone JPEG containing GPS-bearing EXIF—use the old decode→canvas path that **strips source metadata**. Increase maximum downscale dimension from 2,048 to **4,096** pixels when size permits, quality .96 initially; progressively reduce JPEG quality/large-frame dimensions when necessary to cap the stored URI at ~5.6MB. Never return the original file's metadata to the wardrobe through this optimization.
3. Both paths are local to the user's browser. Original import file is **not uploaded by this function**, privacy/session/RLS checks remain outside. Exact-byte JPEG preservation is an optimization **only when safe**, never promised for arbitrary phone JPEGs, PNG/HEIC, corrupted files, compressed originals with embedded metadata, or oversized files.

## Security and testing
New `tests/photo-source-preservation.test.cjs` tests byte-for-byte input equality, known EXIF/GPS/APP marker rejection, thumbnail/metadata/comment rejection, source immutability, fallback and object URL cleanup. `scripts/test-family-alpha-original-jpeg-browser.mjs` opens the compiled offline source in Chromium and WebKit at **320/390/430**, synthesizes a genuine **2,200×1,600 JPEG**, checks retained size and exact bytes whenever its browser's JPEG is plain JFIF, injects a synthetic Exif/GPS marker to confirm it is removed by the canvas fallback, and verifies no outside requests. All browser evidence is explicitly SYNTHETIC, no real garment, account or cloud photo.

Full staged no-deploy source-pinned build reuses [draft PR #339](https://github.com/nickhaney916-lang/Closet-Current/pull/339) and its existing fit/atomic/preview safeguards; only the single app photo-import source and new tests differ from parent. **No merge and no deployment.**

## Limitations
- Phone camera video-frame capture remains 2,048px; this change deliberately **does not** alter camera behavior or claim real camera still-image quality.
- EXIF-bearing photographs still require one JPEG re-encode; there is no lossless metadata stripper in the browser. To preserve original phone JPEG pixels *and* remove location tags, investigate a separate trusted safe metadata-only JPEG rewrite with independent pixel and malware tests.
- Saving 4MP/12MP photo sources costs more storage and local decode memory. Size caps mitigate, but actual Samsung/Android, iOS camera and IndexedDB storage quota remain untested.
- Photo quality warnings/retake guidance from #338 are still experimental and **not yet integrated**. Work #37 draping and #38 isolation remain incomplete. Clean real cutouts/fabric realism, 4 real accounts, live RLS, staging Auth credentials and physical phones still block release.

**FAMILY ALPHA HOLD.** No staging/production/Supabase/Cloudflare/Resend/provider changes, no family/customer pictures, paid AI, Drive Duel, merges or new Work assignments.
