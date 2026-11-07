# Closet Current — Priority #139: Cross-stream app integration

**Research integration candidate · draft PR #695 · Family Alpha Issue #255 remains HOLD · no production or staging changes.**

## Candidate and dependency decisions

- Branch: `research/cross-stream-app-integration-139-work55-20261107-HOLD`
- Parent: P138 `5a589dfe2f6fb744cade4150c3058f2d6a19ea3b`
- Final tested candidate before this report-only update: `73560b392ef56fc7c7483dd9a74ea5770ee3b410`
- Integrated completed source changes: P132 Mobile UX `e6adacd1e83ece145f7d0d825fa916b224e48e83` and P136 Large Wardrobe `df28329d09d40f8c234027940057fe0a2579f0d1`, applied on top of P138 and checked in the combined app.
- P137/P138 protected restore remains the parent research path and is exercised as a separate browser journey. P134/P137/P138 recovery code was not transplanted into the shipped app.
- P129/P51 signed-cloud work and P53 recognition work were excluded. Their exact verified, compatible deliveries were unavailable or explicitly retained by their owners.
- P122 photo-to-owned-outfits and P109/P110 WebGL work are separately mounted for research acceptance only. Their modules were not copied into the candidate. P109/P110 run in a detached, exact-SHA donor worktree.

## Files changed from P138

P132/P136 integration files: `public/app.js`, `public/app-theme.css`, `public/capture-navigation.js`, `public/index.html`, `tests/capture-navigation.test.cjs`, `tests/storage-resilience-136.test.mjs`, `scripts/test-family-alpha-mobile-ux-132.mjs`, `scripts/test-storage-resilience-136-browser.mjs`, their two existing research reports/workflows, and the P136 benchmark JSON/three Chromium screenshots.

P139 adds `.github/workflows/cross-stream-app-integration-139-no-deploy.yml` and this report. No auth, production cloud, database schema, RLS policy, credential, production deployment, existing staging, recognition model, outfit-board core, or 3D donor source changed.

## Acceptance matrix

| Requirement | Status | Actual evidence and limits |
|---|---|---|
| Photo selection to private closet | PASS (research path) | Six Chromium/WebKit cases at 320/390/430 used a genuine licensed JPEG in the real review-to-style app route, verified the original SHA-256 `fef606d6ed7354a2238f1bcc2584942747ca6fa4a2b16b2e9eec21f639d10667`, stored the reviewed item in owner-local IndexedDB, and reopened it. Image-file selection was exercised; a physical camera sensor was not. |
| Automatic recognition accuracy | REVIEW | The browser case deliberately uses a controlled low-confidence recognition fixture followed by human correction. It proves review and persistence, not model accuracy. P53 remains an independent dependency. |
| Human correction/source identity | PASS (research path) | Reviewed category/subtype/color and original source identity remain attached to the saved owner-local item; original bytes were unchanged. |
| Three owned outfit suggestions, pin/swap/save/reopen | PASS (research path) | Six browser cases show three distinct outfits from exact saved owned rows and original photographs; pinning, undo, swap, native compare-and-swap save, photo identity, and reopen were checked. No user wardrobe was accessed; the fixture owner has actual licensed original-photo test rows. P132 also verifies a separate synthetic roster save/reopen flow. |
| Original and cutout JPEG protection | PASS for tested paths | Original JPEG hash/bytes and P136 generated original/cutout JPEG data were retained; duplicate source / transaction behavior is covered by inherited regressions. Does not cover every phone quota or device crash condition. |
| Protected restore and saved outfit IDs | REVIEW | Six real-browser consent UI cases plus inherited tests verified atomic outfit restore and rejection of both local edits during approval and remote revision changes. This is research-only restore UI, not the shipping app restore path and not a live cloud test. |
| Two-owner privacy and RLS/CAS | PASS for isolated synthetic paths | Synthetic browser owner separation and disposable PostgreSQL owner RLS/revision-CAS tests passed. No personal closet data, live Supabase schema, signed JWT, or real authenticated accounts were used; this is not a live signed-account test. |
| Male/female 3D donor | PASS for the isolated donor demo; app integration REVIEW | Actual Chromium WebGL evidence used male and female original 163-bone CC0 rigs and two publicly licensed photographed denim sources: P109 generated 24 verified mobile frames with independent knee motion/reset; P110 generated 16 licensed-source WebGL frames and verified 8 saved-look reopens. Unsupported private user photographs remain exact 2D fallback. These are not the candidate’s normal saved-outfit viewer and do not prove dresses/shoes, arbitrary private-photo reconstruction, fabric simulation, or photorealism. |
| Large wardrobe 25–1,000 | PASS for browser benchmark | Chromium at 390 CSS px ran three baseline/optimized repeats at each size; 250+ displays 48 cards initially. WebKit and Chromium each passed a real 500-item responsive screenshot smoke check at 320/390/430. Timings below are hosted-browser results, not physical-device guarantees. |
| Mobile UX/accessibility | PASS for tested browser viewports | Chromium and WebKit at 320/390/430 passed navigation, overflow/error assertions and axe checks; permission-denied camera handling passed. Meaningful 390/430 landscape checks passed. This is viewport emulation, not Android/iPhone hardware acceptance. |
| Failure/recovery matrix | REVIEW | Current focused suites pass source changes, duplicate/CAS, denied camera, restore races, fallback and related regression paths. Not every requested injected fault (real storage quota exhaustion, corrupt/missing photo, interrupted phone save, revoked live session, offline camera/model recovery) was independently exercised. |
| Build and inherited regressions | PASS | Exact tested candidate built; full Node suite **1,212/1,212** passed; focused integration suite **58/58** passed; disposable PostgreSQL RLS/CAS passed. |
| Family Alpha readiness | FAIL / HOLD | The research candidate does not satisfy release readiness: model accuracy, real authenticated cloud, actual devices, application-wide 3D and human visual approval remain open. Issue #255 remains HOLD. |

## Large-wardrobe measurements

P136 results used synthetic but valid original/cutout JPEG fixture bytes, IndexedDB, Chromium at 390 CSS px, three repeats per baseline/optimized case. Table shows median card-render / bulk-write / reload-to-ready milliseconds (p50); screenshot smoke was separately run in WebKit at all three widths.

| Garments | Baseline p50 (render / write / reload ms) | Optimized p50 (render / write / reload ms) | Optimized visible cards |
|---:|---:|---:|---:|
| 25 | 199.5 / 61.7 / 246.7 | 605.1 / 72.8 / 486.4 | 25 |
| 100 | 250.3 / 257.4 / 504.5 | 310.1 / 257.5 / 470.3 | 100 |
| 250 | 541.3 / 634.2 / 507.5 | 153.7 / 622.2 / 482.3 | 48 |
| 500 | 398.9 / 1,104.9 / 898.6 | 164.7 / 1,110.8 / 869.1 | 48 |
| 1,000 | 725.3 / 1,884.5 / 1,421.1 | 164.3 / 1,906.6 / 1,444.1 | 48 |

Each p95 is the largest of three observations and is not a stable population estimate. Bounded rendering materially reduced card-render time at 250–1,000, while 25/100-card timing, bulk-write and reload-to-ready were neutral or slower in this run. This integration therefore demonstrates bounded UI work, not a blanket performance improvement.

## Browser and 3D evidence

- Exact-head P139 browser job passed at `73560b392ef56fc7c7483dd9a74ea5770ee3b410`, with no browser errors.
- P132: Chromium/WebKit at 320/390/430; denied camera permission; synthetic outfit swap/save/reopen.
- P122: 6 Chromium/WebKit licensed-photo cases, 51 screenshots, real review UI, original SHA, three saved owned looks, swap/save/reopen and synthetic owner isolation. This does not establish automatic recognition.
- P138: 6 Chromium/WebKit restore consent cases, 36 screenshots, local/remote revision-change rejection and atomic saved-outfit restore.
- P136: 36 performance/screenshot cases, 6 responsive 500-item screenshots, zero recorded case errors.
- P109: 24 verified mobile WebGL frames, 163-bone male/female rigs, exact source reset. Physical devices and human realism approval were false.
- P110: 16 licensed original-source WebGL frames, 8 saved-look reopens, all reopened pixels exact; private unverified photo remained in original 2D fallback.
- The combined Actions artifact contains 175 PNGs plus result JSON/audit receipts, including actual browser screenshots, axe output and P136 timings: [P139 browser and WebGL artifacts](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42401992944/artifacts/13585862982).

## Exact-head verification

- Workflow run: [P139 exact-head run 42401992944](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42401992944).
- Exact tested candidate before report-only update: `73560b392ef56fc7c7483dd9a74ea5770ee3b410`.
- All three P139 jobs succeeded: exact parent/scope and full regressions; disposable PostgreSQL owner RLS/CAS; genuine Chromium/WebKit app, performance and donor browser tests.
- Full inherited suite: 1,212 passed, 0 failed. Focused integration suite: 58 passed, 0 failed.
- Integration/scope artifact: [P139 reports and regression artifacts](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42401992944/artifacts/13585439680).

## Scope boundary and next work

The cross-stream candidate cherry-picks compatible completed P132/P136 changes onto P138. It does not incorporate unfinished P51 authenticated-cloud or P53 recognition work. No live signed-account acceptance was claimed, and live Supabase was not touched. No production, existing staging, merge, or deployment was performed.

The research integration is complete as a candidate, with Family Alpha still **HOLD**. Recommended next integration priority: wait for P51 and P53 verified heads, then implement one authenticated, real-device capture-to-owned-closet acceptance on isolated authorized infrastructure; keep personal-photo-to-3D and human realism as separate release gates.
