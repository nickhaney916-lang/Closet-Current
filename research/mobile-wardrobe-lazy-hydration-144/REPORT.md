# Priority 144 — lazy wardrobe hydration (research only)

**Status:** research implementation complete. The verified implementation head `759b694de9fc152f81a31c712c714f2f934e0cb0` passed exact-head hosted Chromium/WebKit and full regression acceptance (run #42410507063). Family Alpha remains **HOLD**. No production or existing staging changes were made.

## Branch and dependency

- Branch: `research/mobile-wardrobe-lazy-hydration-144-work56-20261107-HOLD`
- Parent: P143 branch `research/app-plus-cross-browser-recovery-143-main-20261107-HOLD`, commit `663d42d721881dc3b5716259c49ea89ec5681d54`.
- Parent selection: P143 exact-head CI was verified before use. It layers the independently verified P142 cross-browser recovery work and P138 restore protections. P136 (`df28329d09d40f8c234027940057fe0a2579f0d1`) is used only as the large-wardrobe comparison application.
- No unfinished authenticated cloud, recognition, or humanoid branch was stacked.
- This report and all benchmark files are research artifacts. The hosted workflow has no deploy step.

## Implementation

The v3 owner IndexedDB adds a metadata-only `wardrobeIndex`, with category, item-type, and saved-time indexes, and a separate thumbnail cache. A cursor migration creates metadata for existing v2 saved rows while retaining the original photo-bearing `items` records. Normal wardrobe boot, search, filters, count, and outfit inventory read metadata only. Full garment records are fetched by ID for views that need the source photograph (details, crop, styling, and cloud source upload).

Closet cards use 320-pixel JPEG display derivatives, generated from source bytes only when visible and with at most two thumbnail decode jobs active. Original and cutout bytes stay in their source records and are not rewritten. Cutout byte identity is SHA-256 checked before display-cache creation. The metadata cache stores source identity but never a photo data URL. `IntersectionObserver` removes offscreen object URLs; navigation/logout invalidates outstanding loads and clears registered URLs. Indexed garment changes update item, metadata, thumbnail invalidation, and draft/outfit state atomically where those records participate in the same operation.

Cloud backup now enumerates metadata, reads one source record at a time, verifies its declared JPEG digest, then uploads source bytes one source at a time. Recovery rebuilds the metadata index and invalidates thumbnails in the protected replacement transaction. Existing owner/revision/consent checks remain in the P143 recovery baseline.

## Browser benchmark

Run locally with Chromium 1.56.1, headless browser emulation, exact P136 app comparison, 390×900 viewport for size timings, three repeats. Fixture garments and images are synthetic; this is not a camera recognition accuracy test. Table values are medians. Heap is Chromium `performance.memory.usedJSHeapSize` after closet render. Initial latency is time from reload to the indexed wardrobe count; rendering is two animation frames after opening the closet. Small-count startup is noisier and sometimes slower in P144; large-wardrobe memory is the main measured improvement.

| Garments | P136 heap | P144 heap | P136 ready (ms) | P144 ready (ms) | P136 render (ms) | P144 render (ms) |
|---:|---:|---:|---:|---:|---:|---:|
| 25 | 13.5 MB | 3.9 MB | 595 | 2,006 | 209 | 167 |
| 100 | 34.7 MB | 3.7 MB | 860 | 2,111 | 244 | 184 |
| 250 | 67.3 MB | 4.3 MB | 1,082 | 1,748 | 146 | 144 |
| 500 | 127.8 MB | 4.5 MB | 1,743 | 1,534 | 181 | 191 |
| 1,000 | 239.7 MB | 4.5 MB | 2,785 | 1,625 | 213 | 166 |

The browser suite also exercised 320, 390, and 430 CSS-pixel layouts; 48-card initial loading and incremental loading; search and category filtering while offline; detail/crop opening and source-photo display; saved outfit persistence and reopening; and six home/closet navigation cycles. Across P144 cases, median retained heap after repeated navigation was approximately 4.5 MB at 1,000 garments (4.53 MB in repeat 3), with one currently visible object URL. No browser `pageerror` occurred. Browser emulation is not physical Android/iPhone acceptance.

## Verification and findings

- Focused P144 IndexedDB tests: metadata excludes image payloads; fixture original and cutout bytes/hashes remain intact; atomic transaction abort preserves the pre-existing garment and saved outfit; two synthetic owner databases with the same garment ID retain separate photos and saved looks.
- Full Node inherited suite: 1,217/1,217 passed on the final local rerun (the prior concurrent run produced one transient timeout in an inherited SHA test; that test passed 9/9 in isolation and the full rerun).
- Build: `node scripts/build.mjs` succeeded.
- Browser benchmark: 33 Chromium cases, 3 screenshots, 0 page errors. Screenshots and raw measurements are in `benchmark/mobile-wardrobe-lazy-hydration-144/`.
- Local WebKit launch is unavailable in this container because Playwright's WebKit system libraries are absent. Exact-head GitHub Actions run #42410507063 installed both engines and passed 36 cases across Chromium and WebKit; this is browser emulation, not physical-device acceptance. The initial `ubuntu-latest` attempt resolved to unsupported Ubuntu 26.04 and failed during Playwright installation; the no-deploy workflow now pins Ubuntu 24.04.
- No real smartphone, live signed Supabase account, or customer wardrobe was used. No AI model recognition was run. The fixture workflow does not establish recognition accuracy, photorealistic 3D quality, hosted cloud security, or physical-device readiness.
- Cloud backup is source-streamed. Protected restore still decodes the full replacement document to prepare its atomic transaction; peak restore memory for large remote wardrobes remains an unmeasured limitation.

## Acceptance summary

| Criterion | Status | Evidence / limitation |
|---|---|---|
| Metadata-only normal wardrobe load | PASS | P144 browser and IndexedDB tests; 0 photo-bearing `items.getAll()` app reads. |
| Original and reviewed-cutout identity | PASS | Source data unchanged, hash checks, synthetic JPEG byte tests. |
| 25/100/250/500/1,000 browsing | PASS (Chromium emulation) | Three-repeat P136 comparison; detailed medians above. |
| Search, category filter, incremental load | PASS (Chromium emulation) | Offline browser case. |
| Details and photo display | PASS (Chromium emulation) | Full source fetch only on detail/crop path; P136/P144 screenshot set. |
| Saved outfit reopen | PASS (synthetic) | Persisted outfit ID and garment references reloaded after browser restart. |
| Repeated navigation/object URL cleanup | PASS (Chromium emulation) | Six cycles, bounded retained heap, one visible URL. |
| Chromium at 320/390/430 | PASS (emulated) | Screenshots in benchmark directory. |
| WebKit at 320/390/430 | PASS (emulated) | Exact-head GitHub Actions run #42410507063; three viewport screenshots. |
| Interrupted write / owner isolation | PASS (synthetic IndexedDB) | Transaction abort and two-owner fixture tests. |
| Cloud recovery compatibility | REVIEW | P143 protected research baseline retained; no signed live cloud run. Restore peak-memory limit above. |
| Live camera-to-closet recognition | REVIEW | Not exercised here; synthetic fixtures only and no model accuracy claim. |
| Full inherited Node suite | PASS | 1,217/1,217 on local rerun and exact-head GitHub Actions run #42410507063. |
| Family Alpha | HOLD | No physical-device, genuine capture/recognition, signed-account, or family user acceptance. |

## Source files

Implementation: `public/app.js`, `public/wardrobe-index.js`, `public/index.html`, `public/cloud-backup.js`, `public/closet-browser.js`, `public/closet-stylist.js`, `public/navigation.js`, `public/outfit-board.js`, `public/trends.js`; P119/P138/P140/P141/P142 recovery adapters were updated to keep the new metadata index coherent during reviewed saves and atomic restore.

Tests, workflow, browser runner, screenshots, and raw JSON benchmark results are part of this branch. Exact verified implementation head: `759b694de9fc152f81a31c712c714f2f934e0cb0`. Exact-head Actions run #42410507063 passed 2/2 validation phases (browser/regression job and artifact upload). Artifact: https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42410507063/artifacts/13589427447. The workflow reruns on any later branch head; final head and newest run are recorded in the draft PR description.
