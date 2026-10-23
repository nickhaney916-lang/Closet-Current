# Issue #235 — Synthetic wardrobe photo-storage performance and resilience

**Date:** October 23, 2026. **Branch:** qa/issue235-offline-photo-storage-benchmark-20261023; based on current main 54c9e29ede069a05d1268e003f80cbda043c7d6a. **Research-only/no deployment.**

## Scope and coordination

Inspected main's IndexedDB in public/app.js, public/cloud-backup.js and public/cloud-backup-engine.js, the actual board cleanup in public/outfit-board-engine.js, existing cloud recovery tests, and overlapping draft PRs #220 (guarded 2D), #224/#226 (recognition), #228 (3D), #231 (synthetic 3D board schema), #233 (original-photo provenance); parallel #229, #232, #233 left alone. This branch changes **no existing production application module, Auth, Supabase, Cloudflare, 2D board, recognition, original photos or Drive Duel file**. CI enforces a source diff fence.

## Method and reproducibility

Run "node scripts/benchmark-wardrobe-photo-storage.mjs" with Node 22 and Playwright 1.56.1. Exact CI workflow: .github/workflows/issue235-offline-photo-storage-no-deploy.yml.

- Chromium and WebKit headless Linux browser engines, mobile-like viewport 390×844 px with touch emulation; **not** actual Android/iPhone devices.
- For each size **25, 100, 250, 500**, generate actual deterministic 512×768 canvas JPEG data URLs, preserving their bytes exactly through writes and mapping. Repeats every eighth item share a JPEG and every sixth may carry the full-frame original JPEG under originalPhoto.image. There are separate individual garment IDs, categories and original sharing. These are **synthetic images**, not real customer/photos or licensed clothing benchmarks.
- Real browser IndexedDB schema: version 2, "items" and "state" stores, item.id key and saved "outfit-board" row. Write all garments atomically, read back, create one DOM photo card per item, and call the unchanged actual cleanOutfitBoard on 5–25 saved boards. **Closet DOM timing is a gallery-construction proxy, not the total real app initial-load time or native image decode/paint time.**
- Actual cloud backup **offline** serializes full record via the existing CloudBackupEngine.mapImages and SHA-256 WebCrypto digests on every image field; outputs owner-scoped closet-photo:UUID/SHA.jpg paths. Measures JSON metadata bytes with images replaced by hashes; does **not** upload, fetch, contact Supabase, or measure network latency, storage API latency or cloud bill.
- Estimates deduplicated encoded JPEG bytes and hypothetical decoded RGBA memory from unique 512×768 images × four channels. **This is a calculated upper-bound-style all-images-resident pixel buffer estimate, not a measured JS heap/GPU residency guarantee.** Browser storage.estimate and optional performance.memory are captured when available in the full artifact; lack of API support is recorded as null.
- Simulate QuotaExceededError explicitly at the local write boundary; **not** a physical disk-full or actual browser quota test. Test an actual IndexedDB items+board **transaction.abort()** mid-write, then re-read both to prove neither changed. Delete one garment, assert its saved-outfit reference is pruned without replacing other garments. Restore after aborted/quota failure, preserve original JPEG data URI, and verify repeated image hashes resolve to one path.
- Generate a 2048×3072 synthetic JPEG as a large-photo stress sample and measure its encoded bytes; do not treat that as a limit-exhaustion test or guarantee all camera formats can be stored.
- Every scenario tests zero external service requests and no browser page errors. Measurements vary with warm-up/JIT, runner contention and engine scheduling: **single run per cell**, not p50/p95 or physical-device performance.

## Initial measured baseline — exact-head CI #40001849033

Source tested SHA 112ff17a175d2114fc860b88f166a56f8e108b43. [Successful run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40001849033), [JSON data artifact](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40001849033/artifacts/12521564412). The full Node suite passed 254/254 with source untouched. Values below are **milliseconds**, except the last column (MiB approx of unique compressed JPEGs).

| Engine | Garments | IDB write | IDB read | Gallery DOM | Saved-board cleanup | Cloud SHA+serialize | Exact-photo memo | Unique JPEG MiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Chromium | 25 | 15.2 | 9.6 | 2.4 | 0.4 | 70.4 | 50.1 | 1.09 |
| Chromium | 100 | 33.9 | 31.9 | 8.7 | 0.5 | 294.1 | 212.6 | 4.65 |
| Chromium | 250 | 153.1 | 62.6 | 21.1 | 0.9 | 694.7 | 542.5 | 11.60 |
| Chromium | 500 | 391.8 | 142.7 | 45.4 | 2.0 | 1405.0 | 1141.8 | 23.26 |
| WebKit | 25 | 3 | 3 | 10 | 1 | 28 | 55 | 1.09 |
| WebKit | 100 | 9 | 9 | 46 | 0 | 64 | 47 | 4.64 |
| WebKit | 250 | 24 | 24 | 93 | 0 | 162 | 118 | 11.57 |
| WebKit | 500 | 51 | 48 | 179 | 0 | 295 | 223 | 23.19 |

Note WebKit timing resolution is coarser and sometimes reports zero for short cleanups. These figures do not show a device-platform performance ranking; runner/container/JIT variability dominates.

### Capacity and image-memory implications

At 500 garments: 458 distinct JPEG image values, 584 occurrences of nested JPEG fields mapped, 149,609 bytes (146 KiB) of cloud JSON references per snapshot before service/database envelope, roughly 24.3 MB of deduplicated JPEG payload bytes in base-10 units, and hypothetical **~687 MiB** of decoded 512×768 RGBA buffers **if all 458 distinct images were decoded and resident simultaneously**. This is not peak observed memory, browser back/forward cache memory, or GPU allocation. Eagerly decoding every picture on a phone could be costly; lazy image loading and bounded visible cards should be investigated separately on actual hardware.

The synthetic large-frame JPEG was ~673 KB encoded (2048×3072 pixels). It is not a realistic worst-case noisy high-resolution image; do not infer quota limits from this. Existing cloud JPEG maximum is 8 MiB per stored photo; see public/cloud-backup.js.

### Observed optimization opportunity

The normal existing cloud backup re-hashes repeated JPEG data URI fields even when exactly the same photo is referenced more than once. The 500-garment snapshot caused 584 hash operations for 458 unique JPEG values. A **research-only exact-string memo** performed 458 instead, with bit-for-bit identical resulting JSON. Baseline sample improved from 1405 to 1141.8 ms in Chromium (~18.7%) and 295 to 223 ms in WebKit (~24.4%) for 500 records. **At 25 photos the WebKit memo was slower (28 ms baseline vs 55 ms), so don't assume improvement for small closets.**

A reusable **bounded 64-entry cache** is provided only in scripts/issue235/photo-digest-memo.mjs, with owner/session scope supplied by the caller, no stored transformed photo, in-flight dedupe, eviction, clear and failure cleanup. Its performance is separately measured in the final CI; it is NOT imported by production cloud backup and does not alter SHA/storage paths. The existing backend already deduplicates *uploaded object paths* by content hash, so memoization reduces duplicate hash work only, **not uploaded photo bytes for distinct sources or cloud storage quota**.

## Resilience results and remaining failure gates

The test harness checks full item count for each size and preserves the original unmodified data URI after write/read. A **real explicit IndexedDB abort** after staging both a photo edit and board edit rolls back both. The **injected** quota error leaves the preexisting data intact. Deleted garment cleanOutfitBoard drops only its source reference; the other selected items persist. Exact duplicate JPEG references share cloud SHA path without merging distinct item IDs. Hashing is byte exact; no lossy image changes were introduced.

**Not measured/proven:** actual browser quota-exhaustion/recovery, 500 full high-res customer-photo 8MiB payloads, end-to-end cloud upload/backoff/restore timing, simultaneous real device camera/model inference, image decoding/paint and peak GPU/JS memory, long-session thermal/performance, real physical phones, offline service worker behavior, authentication and live RLS. Main and guarded 2D/recognition branches are not modified; any product integration requires main Closet Current chat release/integration approval. No paid inference, storage purchases or customer photos were used.

**Disposition:** Offline synthetic benchmark complete; any product-side code performance change remains **HOLD** until physical-phone performance and source-preserving Auth/privacy review. Research-only bounded hashing helper may be considered for an independently reviewed future candidate, not silently merged.
