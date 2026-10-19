# Closet Current — atomic local fitting previews and bounded ephemeral cache

**October 19, 2026.** Isolated implementation on [PR #35](https://github.com/nickhaney916-lang/Closet-Current/pull/35). Draft only; not merged or deployed.

## Problem
PR #35 retains high-quality alpha edges, central fabric detail and source-based conservative rejection, but recomputed each garment on every preview rerender and progressively inserted layers as each expensive decode, matte and 32-triangle warp finished. Fast outfit or figure changes could temporarily display a half-completed look. Preview repetition needs to remain predictable at scale without usage-based AI services.

## Fix
- `public/figure-preview-cache.js`: volatile memory-only LRU scoped to the current signed-in owner. Key is stable garment ID **and** exact original image representation, category and color. A changed image/color evicts older versions. The cache retains at most **six entries and 8 MB of image-string storage**, and never retains source strings over 2 MB.
- On owner change, cache entries are cleared before another lookup. Unsigned sessions do not retain results. On pagehide, dispose the cache, revoke the selfie object URL, invalidate in-flight previews, and clear the displayed layers. No localStorage, IndexedDB, network fetch, sent photo or third-party inference is involved.
- Asynchronous render revision checks reject outdated decoding work. Clothes are prepared into a detached document fragment, and published atomically so partially assembled outfits do not flicker into view. A changed selection clears stale layers immediately.
- Repeated outfits or a change of figure reuse approved **display-only** PNG copies but calculate fresh body-specific placement rectangles. Original high-resolution photographs remain the **recognition/indexing inputs before clipping**; their source bytes and catalog records are not modified.
- Existing commercial-paid provider activation constants remain disabled.

## QA and limitations
Node tests cover identical-source hits, changed photograph/color invalidation, isolation on owner switch, entry and byte bounds, disposal, invalid data, and local-only IO rules. Android Chromium/iPhone WebKit **emulated browser** integration verifies zero repeated local image extraction on a cached outfit and deliberately delays an old garment image decode while a newer outfit completes; releasing the old decode must never overwrite current layers. Existing three SHA-verified licensed photographs **must remain on HOLD**, not be rendered as successes.

This fixes latency/flicker issues, **not** physical cloth, drape, true semantic collar/sleeve landmarks, outfit photo realism or rights clearance for the two 160x297 preview assets. Zero per-outfit paid generation calls does not mean zero hosting, storage, device processing or engineering costs. Actual phone and blind external AI quality comparison are pending.

## Scope / restrictions
No paid services, physical-device proof claims, deployments, merges, customer-data uploads or Drive Duel changes. The three license-attributed raw photo rejections are preserved, not retrospectively reported as acceptable garment renders.
