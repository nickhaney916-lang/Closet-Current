# Priority #136 — Mobile Wardrobe Storage Resilience

**RESEARCH ONLY · Parent P134 PR #690 at `59ec81353d03a6a5443c9370f209d7e367456e26` · Family Alpha Issue #255 HOLD · No production or existing staging changes.**

## Scope and source findings

The isolated branch is `research/mobile-wardrobe-storage-resilience-136-work54-20261107-HOLD`. It starts directly from the exact verified P134 research head; no parallel branch was changed. GitHub Issue #235 is still open and its offline synthetic benchmark requirements align with this work.

The current local store is owner scoped (`closet-current-user-<owner>`) and has `items` and `state` stores. The app reads saved clothing with `getAll()`, retaining each record and its photo data URLs in the app's `items` array. Multi-garment records keep the original JPEG and a separate garment cutout, and the existing record format can repeat both data URLs across related pieces. My Closet already sets `loading="lazy"`, but it built a card for every matching garment at once. Outfit board state is stored separately under `state/outfit-board` and existing reads/writes retain its item IDs.

Existing camera and multi-garment writers already use atomic IndexedDB transactions at their save boundaries. The inspected group writer checks duplicate IDs/source pieces and writes the selected group in one `items` transaction; single-piece save writes the garment and draft in one `items` + `state` transaction; saved outfit writes complete through their `state` transaction. Account-session checks and owner-specific database names are already present. Those paths were not rewritten here.

## Changes

- `public/app.js`: for matching results above 100, render the first 48 cards and provide an accessible “Show more clothing” button in 48-card increments. Searching or changing the active closet filters resets the window. Lists of 100 or fewer retain the full current rendering behavior. Large-list photos use asynchronous browser decoding and continue to use lazy loading. All owner records remain available to search, the Outfit Builder, and backup; the page window does not delete or rewrite photographs.
- `public/app.js`: a propagated `QuotaExceededError` now gives a plain storage-full message that says saved clothing and outfits remain in place.
- `tests/storage-resilience-136.test.mjs`: synthetic original/cutout byte-preservation round trips at 25, 100, 250, 500, and 1,000 records; transaction-abort preservation of an existing garment and saved outfit; and separate owner-store isolation.
- `scripts/test-storage-resilience-136-browser.mjs`: serves the real app, seeds generated test JPEGs into actual browser IndexedDB, compares the exact P134 app source with P136, measures write/reload/render/serialization, checks saved outfit recovery, exercises offline paging and filtering, and captures browser screenshots.
- `benchmark/storage-resilience-136/results.json` and three Chromium screenshots: raw run data and screenshot hashes. The no-deploy workflow uploads the complete Chromium + WebKit results and screenshots from CI.

The change does not alter the IndexedDB schema, persisted clothing metadata, photo bytes, crop bounds, source hashes, or backup structure. It does not contact cloud services. Two synthetic local account IDs are used only in isolated IndexedDB tests.

## Benchmark method

The baseline is the actual `public/app.js` fetched from exact P134 parent SHA `59ec81353d03a6a5443c9370f209d7e367456e26`; the optimized case serves the P136 file. Each case uses the app and actual browser IndexedDB, seeds the selected count in one transaction, reloads the app and restores the saved outfit, then times opening “Browse all” through two animation frames. At 390 CSS px, there are three baseline and three P136 Chromium runs per wardrobe size. p50 is the median; p95 is nearest-rank and therefore the maximum of three samples, a small-sample tail estimate.

Test photos are locally generated geometric-garment JPEGs: original 63,434 bytes; independently cropped cutout 54,473 bytes. Related garments share a logical source ID in pairs. Browser seed rows model the current repeated source/cutout data URL shape. These are not user photos and are not used to claim recognition accuracy.

Local environment: Linux x64, Node v24.22.1, Playwright 1.56.1, Chromium 141 headless. Actual mobile-sized browser contexts use 320, 390, and 430 CSS px. Local Chromium verified all 33 cases and captured three screenshots. The locally installed WebKit binary could not launch because the host lacks GTK/WebKit runtime libraries; the dedicated pinned Playwright CI container is configured to run WebKit at all three widths. These runs are browser emulation, not physical Android/iPhone certification.

## Results — browser rendering and reload

Times are milliseconds. Each pair is `p50 / p95 (n=3)` at 390 CSS px. “Render” measures the user-visible card-window opening. “Bulk write” seeds the same full records and outfit in one transaction. “Reload” is navigation start until the large closet count and saved outfit are restored.

| Garments | Render baseline | Render P136 | Cards shown baseline → P136 | Bulk write baseline → P136 | Reload baseline → P136 |
|---:|---:|---:|---:|---:|---:|
| 25 | 451.9 / 977.9 | 404.8 / 802.2 | 25 → 25 | 76.3 / 151.2 → 91.6 / 121.7 | 194.7 / 335.8 → 445.6 / 570.0 |
| 100 | 414.5 / 472.7 | 260.4 / 559.8 | 100 → 100 | 372.5 / 379.0 → 380.8 / 386.6 | 492.5 / 587.9 → 544.7 / 561.5 |
| 250 | 398.3 / 518.1 | 196.6 / 378.6 | 250 → 48 | 631.3 / 897.9 → 651.7 / 734.4 | 488.9 / 867.7 → 512.9 / 560.2 |
| 500 | 684.2 / 689.6 | 184.3 / 185.9 | 500 → 48 | 1,240.4 / 1,346.3 → 1,308.3 / 1,372.0 | 858.8 / 1,059.0 → 760.2 / 767.8 |
| 1,000 | 1,358.1 / 1,723.1 | 204.1 / 272.7 | 1,000 → 48 | 2,702.7 / 2,733.3 → 3,313.8 / 4,196.6 | 1,907.8 / 2,948.4 → 1,669.7 / 2,570.8 |

The 250/500/1,000-item card-opening median improved by about 51%, 73%, and 85%. The improvement comes from constructing 48 cards instead of hundreds; it does not make the underlying database read or bulk write faster. Bulk-write and reload differences are noisy and do not demonstrate a reliable improvement. The 1,000-item P136 bulk-write p50 and p95 were slower in these runs, so large local writes remain a bottleneck and are not claimed as improved.

The measured one-shot offline JSON backup serialization took 67.1, 176.1, 514.4, 1,184.5, and 1,678.6 ms for 25, 100, 250, 500, and 1,000 records, respectively. Serialized size reached 230,436,024 bytes at 1,000. This measures JSON serialization only; no network request or real cloud backup occurred.

## Storage and memory findings

Chromium `navigator.storage.estimate()` reported approximately 5.8 MB, 23.1 MB, 57.7 MB, 115.4 MB, and 230.7 MB of origin storage for 25, 100, 250, 500, and 1,000 synthetic records. The browser's reported quota varied between fresh contexts (roughly 543–581 MB in these runs), so it is not a phone quota measurement. At 1,000 items, Chromium's non-standard `performance.memory.usedJSHeapSize` was 254 MB in both baseline and P136; at 500 it was 157 MB baseline and 131 MB P136. This indicates that the full `getAll()` record/photo hydration remains the dominant large-wardrobe memory cost after reducing card DOM work.

This assignment does not claim an image-memory solution. A follow-up should split photo payloads from wardrobe metadata and lazily hydrate visible/selected photos, while preserving original and cutout bytes, source identities, backup compatibility, and the existing styling/outfit interfaces. That is a cross-cutting migration and should be independently benchmarked and integrated before relying on 1,000-photo phone use.

## Integrity, recovery, and privacy checks

- **Round trips:** PASS for 25/100/250/500/1,000 synthetic records in actual fake-indexeddb transactions; the browser benchmark also reloads actual browser IDB at each size and confirms all item counts and saved outfit references.
- **Original/cutout bytes:** PASS in storage round trips. The test compares exact original and independent cutout byte arrays and their SHA-256 values. Existing source/cutout verification suites remain unchanged and are included in full Node regression.
- **Interrupted multi-record save:** PASS for a real IndexedDB transaction abort in fake-indexeddb. Neither the first pending garment nor replacement outfit state commits; the previous saved garment and outfit remain. Existing atomic group writer remains unchanged.
- **Duplicate and partial review:** Existing MULTI24 tests cover duplicate group checks and explicit human-reviewed group atomicity; no UI/save-path changes were made.
- **Saved outfit recovery:** PASS in actual browser IndexedDB after application reload; selected garment IDs and the synthetic saved look remain available. Offline paging and search also pass in Chromium.
- **Two local owners:** PASS using distinct owner-named IndexedDB databases. Existing owner/session privacy tests run in inherited Node suites. This is not signed cloud RLS or a hosted two-account test.
- **Quota exceeded:** REVIEW. The app now surfaces a propagated `QuotaExceededError`; transaction abort recovery is verified, but this environment did not force a genuine browser storage quota exhaustion on a physical phone. No claim of real-device quota certification is made.
- **Cloud/backup:** No remote cloud calls. Existing backup compatibility tests are covered by inherited regressions. JSON serialization cost is measured locally as above; hosted upload and restore are outside this branch.
- **Categories and owner review:** PASS by scope and inherited tests; the only saved-record write here is synthetic benchmark seeding. No category, subtype, color, review evidence, recognition input, or original photo is edited by the production UI change.
- **2D/3D and mobile navigation:** source integrations are untouched; the entire inherited Node suite passes. Chromium screenshots are captured at 320/390/430. WebKit browser acceptance will be run by the pinned CI job; physical phones remain unverified.

## Acceptance status

| Requirement | Status | Evidence / limitation |
|---|---|---|
| 25/100/250/500 successful round trips, no lost records | PASS | Synthetic transaction and browser reload tests |
| 1,000-item stress round trip | PASS | Synthetic browser IDB reload and Node transaction |
| Required atomic writes do not partially commit | PASS | Aborted IDB transaction preserves old garment/outfit |
| No cross-account local-store leakage | PASS | Distinct synthetic owner databases; inherited session tests |
| Original/cutout identity preserved | PASS | Exact byte and SHA round trips; inherited source-proof regressions |
| No silent saved-outfit deletion | PASS | Abort and reload recovery checks |
| Real quota exhaustion recovery | REVIEW | Exception reporting implemented; real quota exhaustion not induced |
| Measured performance improvement | PASS, scoped | 51–85% p50 improvement in 250–1,000-item card opening; not DB I/O |
| 320/390/430 mobile-sized acceptance | REVIEW | Chromium local screenshots pass; WebKit awaits CI; no physical devices |
| Production and staging untouched | PASS | Exact-path CI allowlist; research branch only |

## Automated verification and deliverables

- Focused P136 tests: 3/3 pass.
- Full inherited Node suite on the final P136 source: 1,198/1,198 pass.
- `node scripts/build.mjs`: pass.
- Chromium local browser benchmark: 33/33 cases, 3/3 genuine 500-item screenshots, zero page errors. The CI workflow runs both Chromium and WebKit at 320/390/430, verifies six screenshots, all five sizes and three timing repeats, then uploads artifacts.
- Benchmark data: `benchmark/storage-resilience-136/results.json`.
- Screenshots: `benchmark/storage-resilience-136/chromium-{320,390,430}-500-browse.png`.
- No production deployment, existing staging modification, live cloud request, or Family Alpha release occurred.

## Remaining deficiencies and next integration priority

This priority delivers a measured rendering improvement but is **not full phone-storage resilience certification**. Full-resolution data URLs are still loaded by `getAll()` into memory, large saves and backup JSON remain expensive, real quota exhaustion is unverified, and physical Android/iPhone acceptance is not performed. Keep Family Alpha on HOLD.

Recommended next integration priority: **P137 — owner-scoped lazy photo hydration and lossless photo-store index**. Benchmark a metadata-first local read path and selected/visible-photo hydration against the current `items` schema. Preserve original and cutout JPEGs byte-for-byte, shared-source associations, SHA identities, owner isolation, saved outfit references, cloud backup format, and 2D/3D fallback. Require migration rollback tests and Chromium/WebKit acceptance before integration.

**Draft PR:** [#693 — P136 large-wardrobe browsing and storage resilience](https://github.com/nickhaney916-lang/Closet-Current/pull/693). **No merge or deployment is authorized by this assignment.**
