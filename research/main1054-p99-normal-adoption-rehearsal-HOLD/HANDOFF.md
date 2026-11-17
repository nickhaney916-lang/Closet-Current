# M174 — P99 normal-user source integration rehearsal on protected Mission 4 M172 (HOLD)

**Scope:** review-only isolated adoption candidate, NOT a merge into protected M4, main/master, staging or production; Family Alpha issue #255 remains OPEN/HOLD.

## Immutable source and lineage
- Protected Mission 4 M172 exact base: `5b8e149a3eaa61aabeb3696bb9642209eaa765ce`.
- Accepted P99 isolated source: `715a515baf1cccb365579d2a6c94d6f2de583e94`, draft #1238.
- P99 original M4 source parent: `59e3d041c24a4419e3d876d204889a40ae48feef`. All three edited legacy public files (outfit-board.js, index.html, capture-navigation.js) have exactly the same Git blobs on M172 and on that P99 parent. No silent clobber of newer consumer code.
- M172 added exact test `scripts/test-main172-24mp-private-state-invariance.mjs` at blob `ad4cb6bfee719b6083b9abc6d11ade2551e77c58`, carried forward unmodified.
- Separate M173 EXIF original-JPEG rotation research #1239 is not adopted or altered. Same for M2 photo-fit and P97 physical-device missions.

## App integration
Exact P99 source blobs, without transforming the successful browser and owner/source guards:
- `public/outfit-board.js`: b8ed5ebe18e81ec3f8f5659257289b8217a6877b. Native default 2D original-photo viewer, M95/P95 exact source+slot verification, opt-in M59 gallery remains guarded. Never enables consumer photo-fitted 3D.
- `public/index.html`: abd56ec794b44a447c9aac88129d6f6516180bd0. Review-first capture guidance.
- `public/capture-navigation.js`: f3404f6fd325a1ea805d04d8a84e9761a780ece3. Both 'Choose' and 'Unclear pieces stay here for review' legacy behavior preserved.
- `public/native-2d-preview-p99.mjs`: 52d2b6d8834f27d9114e022fe8574947eda85206.
- `public/native-outfit-source-plan-p99.mjs`: 58a2a1a81ad19e2341cebcdee83005296cd1d3a8.
- `public/native-photo-3d-veto-p99.mjs`: 82b93d12d2fbcba146a190f5dce87a6ac5fc44af.
- `scripts/test-parallel99-normal-app-browser.mjs`: 9b8c3b37d1d8116e4bf9bc6dbf7ea82e2752433d.

No changes to public/app.js, auth, source receipt code, original capture/recognition workers, M3 backup/restore, any Supabase or cloud deployment configuration.

## Dual-source acceptance contract — pending exact-HEAD run
Dedicated `.github/workflows/main1054-p99-normal-adoption-no-deploy.yml`, no deploy credentials:
1. Compare full diff against frozen M172 source HEAD, and reject any path outside the nine-file allowlist. Verify P99 consumed file blob SHAs and unmodified M172 full-private-state test.
2. Build offline native PWA; run the full inherited Node suite (including M172-era tests) on this combined commit.
3. Genuine Playwright Chromium and WebKit, three viewport widths each, default `/index.html` with no research URL flags; click Home -> original public licensed JPEG chooser -> explicit synthetic owner review -> saved local IDB rows -> closet and native outfit builder -> exact full original-JPEG 2D -> owner-approved v3 download/restore -> offline warm original-photo preview -> modified selected source revocation -> separate synthetic owner no original pixel disclosure. Include canceled input, oversized image and exact duplicate source no-write checks.
4. Both real browser engines independently replay *unchanged* M172 original 4000×6000 JPEG + source pin under opt-in research, full owner `items` and `state` snapshots unchanged when stale original source is rejected and when the correct original is reverified, under actual P88 installed WASM. Still only synthetic owner approval, not human classification truth.
5. Require independent push and PR exact-head 3/3 green runs before concluding isolated engineering acceptance.

**Explicit not verified:** live hosted JWT/RLS, real Android/iOS camera or other physical devices, OS-level picker/lifecycle, owner classification quality, garment pairs or genuine garment-to-3D fitting, cold offline install, entire v4 draft recovery, independent family trial signoff. The P99 native v3 flow excludes unfinished Photo results by design; no invented photo data is uploaded. Real P88/WASM model execution in M172 is NOT evidence of accurate real clothing-unit classification.

## Cross-mission adoption gate
Only Mission 4 owner may reconcile and adopt these reviewed consumer-file deltas into a NEW protected M4 research HEAD, and must re-run its seven-job source-pinned no-deploy CI, whose current hardcoded source allowlist rejects unreviewed native files. Do not change or weaken that protected workflow in this isolated branch, and do not merge this candidate directly into main or deploy. Preserve FAMILY ALPHA #255 HOLD until authorized evidence from all four missions.

## CI result
**PENDING final exact-head push and independent PR run.** Later read comments on draft PR and #1054 for the two exact verified results. Never infer release readiness from browser emulation.
