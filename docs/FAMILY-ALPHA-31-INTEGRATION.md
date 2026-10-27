# Assignment 31: avatar and styling integration — OFFLINE HOLD

## Immutable sources

| PR | Head | Role |
|---|---|---|
| 321 | 97397e80a7cf66e5e656c5b74c924a51e50f0f6f | Styling workflow parent |
| 320 | 094896d1b0655662787a78bc80d61af822a9e265 | Articulated humanoid parent of 322 |
| 322 | 68bed0c0f0f25538d0d5a00fbaf9aa34d80b8663 | Exact renderer and layer-plan assets |
| 318 | c86f48f0119329e4001002304e2dfe480815b099 | Storage failure recovery reference, not applied |

321 and 320 share base 45de5df69f82a290cc4bdbd3db50fd9f297add03. 322 descends from 320. All 18 avatar commits were cherry-picked onto a new branch based on 321 without conflicts. No existing branch changed. Both geometry assets equal 322 byte-for-byte; styling workflow/engine equal 321 byte-for-byte. No new geometry, segmentation or recommendation implementation.

## Compatibility

The existing 321 boot imports the saved-board renderer from the built output. The inherited 320 build overlay replaces only the two authorized avatar modules, so reviewed presentation PNGs flow directly into the improved humanoid and 322 alpha positioning. Source assertions fail closed if inputs differ. Original recognition app, Auth, cloud, saved-board owner guards and review processor remain identical to the parent held artifact.

Recommendations/favorites retain garment references, original-source hashes and metadata fingerprints. Existing tests reject deleted garments, changed photos/details, foreign ownership, account changes while requests wait, concurrent board edits and interrupted favorite writes. Three recommendations and nonpin swapping reuse 321 and its unchanged 276 engine. Favorite restore returns correct board references and original sources, but does not persist reviewed presentation PNGs: previews need renewed review after reload. No cloud favorite backup/export claim.

318 is not a dependency of either input. Its synchronous IndexedDB failure overlay remains an independent candidate and is deliberately not silently imported. Its reported partial-write risk remains an integration gap for the inherited wardrobe write path; 321's favorite transaction abort coverage does not certify all wardrobe quota failures.

## Reproduction

Use the build prerequisites and commands in `.github/workflows/family-alpha-31-offline.yml`. Build 29 then 31, run full Node suite and fake-IDB tests, then the new 31 compiled-browser workflow and inherited alpha PNG geometry browser suite. CI uses pinned Playwright 1.56.1 and existing immutable browser container. No deployment job, credentials or hosted service calls.

## Results so far

Local: held builds PASS; 571/571 Node tests (including 2 added pin tests) and 5/5 fake-IDB workflow tests PASS. Local browser launch BLOCKED (missing executables for runtime Playwright 1.62.1).

Verified source commit 1fbf2a9ac4ce03995d8e43ea4ba4a26c4a16facf: [integration CI 40446077058](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40446077058) SUCCESS: 571/571 Node, 5/5 fake-IDB, 6/6 compiled journey cases, 6/6 separate alpha positioning cases. Chromium and WebKit each passed 320, 390 and 430. Existing #29 workflow, combined recognition HOLD workflow and camera scenario workflow also SUCCESS on this commit. The initial unsorted all-source comparison failed because IndexedDB reload orders records by key; comparing stable garment IDs corrected the test without changing application code.

Two inherited shallow-checkout Node jobs initially failed on missing immutable styling source objects (their browser jobs passed). A subsequent CI-only change explicitly fetches the three source pins. No tests were removed or skipped; no application changes after verified 1fbf2a9a.

Browser workflow covers synthetic JPEG import, manual recognition confirmation/save, three options, explicit cutout approvals, three articulated humanoids, unchanged image aspect, swap, favorite save/reload/restore, all saved original source payloads, mobile overflow/touch controls, logout hiding and zero external requests at 320/390/430 for Chromium/WebKit. Separate inherited PNG alpha suite checks placement, transparent padding and unchanged image source.

## Limits and release

Synthetic Auth/cloud/classifier mocks; real browser decoding/DOM/IndexedDB only when CI passes. No family photos/accounts, model accuracy, live RLS, hosted authentication, browser restart, cloud restoration or physical-phone validation. Synthetic figures cannot establish realistic fitting. Layer overlap, sleeve alignment, visible clipping and pixelation on real garments remain unmeasured and owned by main fitting work / Work 30.

Family Alpha HOLD. No merge, deployment, staging/production/provider changes, spending, Drive Duel or existing PR branch modifications. Main conversation owns integration and release.
