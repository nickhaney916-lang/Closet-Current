# Atomic offline PWA release consistency — Closet Current

**October 21, 2026 — isolated unmerged draft, not a live deployment.**

## Reproduced implementation risk

The previous app service worker prefetched a complete release and assigned versioned URLs to app scripts/styles. Its **runtime fetch handler nonetheless tried the network first**, then executed `cache.put` for every updated response — even for the release's cached `index.html` and versioned JavaScript. When a new deployment was on the public server but a previous worker still controlled a customer's open app, a successful request could replace the old worker's cached HTML with **the new HTML** while previously saved worker assets (and installed / offline scripts) still belonged to the old version. This could lead to incompatible app sources, blank pages and confusing offline recovery. Standard PWA releases should never cache mixed versioned file sets.

## Isolated safeguard

The worker still precaches **every** current release file during `install` using `cache.addAll`, before that worker becomes active. Native waiting lifecycle is retained; **no forced `skipWaiting`** into active customer pages. But every later GET for a known release asset — including the app root and `index.html` — is **cache-first and immutable**. The live server cannot rewrite an already installed version's HTML, JS/CSS, model resources or other pre-cached files. If an expected file is missing due to storage corruption/eviction, return a clear **HTTP 503 retry/reopen notice** rather than silently fetching a mismatched current-server file into the old version's cache. A fresh complete worker installation remains the update path.

Only same-origin, allow-listed static release assets are intercepted. The private API, Supabase remote data and customer photo storage remain outside the worker and are **never cached**. There is no removal/modification of IndexedDB, signed-in tokens, user wardrobe/photos, account recovery, recognition models or backup machinery. On activation the previous worker's cache is removed as previously designed. This is atomic **version consistency**, not a claim that a phone user is guaranteed offline authentication success.

## Verification and limits

Node tests use the *actual compiled service worker template* with virtual CacheStorage: old HTML/scripts do not change when the public server becomes a new release, protected assets fail closed after unexpected cache eviction, install fails without a complete cache, private/mutation requests bypass caching, and no runtime cache writes occur.

Browser tests launch real installed service workers under a local HTTP origin on **Android Chromium and iPhone WebKit emulation**, then simulate a server upgrade and interruption. Android Chromium tests **hard network-offline mode**. Playwright WebKit on the Linux CI runner can block even installed service-worker responses while browser transport is forced offline; when that limitation occurs, the WebKit test instead simulates the origin returning **HTTP 503 unavailable** while a real registered service worker continues serving the old versioned shell/assets. This is reported as an **origin-outage fallback**, *not* hard offline validated on iPhone. Both tests verify that private API requests are not cached and a fake IndexedDB wardrobe-like fixture survives. They **do not** represent physical devices, native iOS home-screen install/update behavior, actual Supabase auth, real customer photos or independent garment recognition accuracy.

This is deliberately independent of already verified PR #137 mobile quota reliability and PR #134 backups, and also separate from #128 integration. No Work tickets will be started for it. No paid APIs, publication, production merge or deployment. Prior verified PR #138 / all source-photo and human-approval gates remain unchanged.
