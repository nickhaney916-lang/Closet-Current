# Closet Current — Priority #139: Cross-stream app integration

**Research only · draft PR · Family Alpha Issue #255 remains HOLD · no production or staging changes.**

## Parent and source selection

- Exact parent: P138 `5a589dfe2f6fb744cade4150c3058f2d6a19ea3b`.
- Candidate branch: `research/cross-stream-app-integration-139-work55-20261107-HOLD`.
- Compatible completed changes cherry-picked: Family Alpha mobile navigation and accessibility P132 (reviewed head `e6adacd1e83ece145f7d0d825fa916b224e48e83`), then large-wardrobe browsing/storage-resilience P136 (reviewed head `df28329d09d40f8c234027940057fe0a2579f0d1`). P136's tested `public/app.js` changes coexist with P132 navigation and P138's separate research-only restore dialog.
- P138 remains the parent, preserving P137/P138 consent and revision checks. Its research files and the P134 consent chain were not rewritten.
- P130 source-merge work, P129 signed-cloud integration, live cloud credentials, and unfinished P51/P53 deliveries were excluded. P122/P123 owned-outfit and P110 3D modules are treated as test-only pre-existing research, not transplanted from those owners' branches.

## Files changed from P138

The imported P132/P136 changes are limited to `public/app.js`, `public/app-theme.css`, `public/capture-navigation.js`, `public/index.html`, their focused tests, test runners, reports, benchmarks and no-deploy workflows. This priority adds only this report and `.github/workflows/cross-stream-app-integration-139-no-deploy.yml`. Production/auth/cloud schemas, storage policies, recognition model, outfit-board core, 3D donor source, credentials and other projects are outside the diff.

## Acceptance matrix

Status is pending exact-head CI until the draft branch workflow finishes; no pending run is counted as a pass.

| Requirement | Status | Evidence boundary |
|---|---|---|
| Mobile navigation/accessibility | REVIEW | P132 actual app tests are included at Chromium/WebKit 320/390/430, with camera permission denial, axe checks and synthetic outfit save/reopen. This is viewport emulation, not a physical phone. |
| Large closet browsing, 25–1,000 records | REVIEW | P136 compares the real app against P134 using browser IndexedDB, original and cutout JPEG bytes, saved outfit reload, three repeats per case and Chromium/WebKit. Exact timings and failure conditions will be attached from P139 CI. |
| Camera photo → private closet and correction | REVIEW | P122 browser path uses a licensed real JPEG, actual app review UI, human correction, WebCrypto original hash and owner-local IndexedDB. Camera sensor and model output are fixtures; this is not physical camera or recognition-accuracy proof. |
| Recognition accuracy | REVIEW | Existing recognition gate tests enforce uncertainty and review; this integration does not claim automatic model accuracy. The P122 browser uses controlled low-confidence model output then human correction. |
| Three actual owned outfits; pin/swap/save/reopen | REVIEW | P122 exercises real saved owned rows; P132 separately exercises a synthetic five-garment roster. No owned garments are invented in the P122 source-photo path. CI asserts the saved-outfit results. |
| Original photo integrity | REVIEW | P122 original licensed JPEG SHA and byte preservation checks plus inherited original/cutout privacy regressions. No user wardrobe photographs are used. |
| Protected cloud recovery | REVIEW | P137/P138 tests use synthetic owners and browser consent UI with local/remote revision races and atomic outfit restore. They do not mount into the shipping app and do not establish live signed-account RLS. |
| Two-owner privacy / Postgres RLS | REVIEW | Synthetic browser owner isolation and disposable local PostgreSQL RLS/CAS checks; no real signed Supabase accounts or live schema access. |
| 2D fallback and 3D compatibility | REVIEW | Existing P110 source-licensed research demonstrates WebGL saved-look previews and private-photo 2D fallback on male/female donors. It remains an isolated research route; arbitrary user clothes, shoes, dresses on both figures, integrated shipping 3D, and independent realism are not all established by this priority. |
| Full inherited regressions and build | REVIEW | P139 workflow runs complete Node suite and app build at its exact final commit. |
| Family Alpha readiness | FAIL / HOLD | Research-only gates, synthetic account fixtures, unverified recognition accuracy and no physical-device acceptance leave Family Alpha on HOLD. |

## Current findings and limits

The integrated shipped-app changes are limited to mobile readability/navigation, camera review wording and bounded DOM rendering for large closet grids. P136 bounds visible card work to 48 above 100 matches and provides “Show more”; all stored records remain available to search, outfit references and backup. The P136 tests verify transactional original/cutout byte and outfit persistence at each size. The exact P139 browser benchmark must provide the measured times before they are reported.

Camera-to-outfit evidence intentionally separates a genuine licensed JPEG and browser SHA calculation from controlled recognition output. The recognition result is a low-confidence test fixture; category, subtype and color are accepted only through human review in the proof. The integration does not turn the licensed test photograph into a user's owned garment or imply model accuracy.

Cloud restore remains an owner-consented research dialog with fail-closed local and remote revision checks. Local synthetic accounts and disposable PostgreSQL do not establish live JWT, Storage policy or signed two-account acceptance; this is not a live signed-account test. The new workflow never writes to live Supabase.

P110 WebGL evidence concerns indexed public licensed garment sources on authenticated synthetic research identities; an arbitrary private photographed garment remains 2D. It is not a photorealism score or a completed standard-app 3D integration. This candidate preserves that boundary and does not edit the humanoid source.

## Release boundary

This branch is a research integration candidate, not Family Alpha release acceptance. Do not merge it to `main`, production or existing staging. Family Alpha remains **HOLD**. Actual signed-account cloud acceptance, scientific recognition accuracy, broad photo-to-3D fitting, physical Android/iPhone acceptance and visual realism review remain next-stage blockers.
