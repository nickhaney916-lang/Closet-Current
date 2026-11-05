# Closet Current — CORRECTED-GARMENT-NAME-INDEX-66

**RESEARCH ONLY — Family Alpha Issue #255 HOLD, no production/staging mutation or deployment, never merge.** Exact verified start: RECOVERY65 research-only HEAD `fb35cf9d45a63775743ac86522c95d7286523757`, [successful no-deploy Actions #42072825290](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42072825290): 681 inherited Node, 18 native Chromium/WebKit owner-private browser cases, 66 source-SHA audited new recovery screenshots.

## Reproduced source-level defect

Native owner-private `Adjust details` in the research app can correctly save manually adjusted `itemType`, `category` and `color` under a genuine source-preserving compare-and-swap (CAS) transaction. However the original multi-garment writer `verifiedRecord24` generates a human-confirmed title such as `Blue Sneakers` from the saved source/crop. The edit dialog preserves that title in `name` when the person changes the subtype to `Ankle boots` and the color to `Black` but leaves Name unchanged. The closet tile title and free-text search use `item.name`, so a Black boots correction can still appear as Blue Sneakers and match the wrong search.

## Implemented correction

- A pure `research/corrected-name-index-66/owner-label-sync.mjs` helper receives only the exact persisted `before` row and the human-edited `after` row. It returns a proposed name; it does not mutate either record.
- A source-verified human-reviewed saved crop is eligible **only** when original photo SHA matches, owner source-piece key is coherent, original name exactly equals the original documented human-confirmed `[color] [subtype]` generator, and Name was not changed during the edit.
- The title follows corrected category/subtype/color, e.g. `Blue Sneakers` → `Black Ankle boots`. Type `Other` becomes the corrected broad category in the suggested title; empty color never becomes `Unknown`.
- Preserve all explicit custom labels (both preexisting and newly edited), legacy or unverified-photo rows, uncertain source identity, photos with incomplete SHA proof and notes-only edits. Do not change any recognition suggestion or claim model-generated labels have been certified.
- The native `public/app.js` integration is guarded by **both** existing `nativeCorrection10Active()` ownership research mode and new `correctedName66=research` opt-in. It applies to a **persisted sourcePieceKey** row only, after source/CAS freshness checking and before the existing owner-private atomic correction transaction. Default production URLs and behavior are unchanged.
- No source photos/cropped images altered, no cloud endpoint change, 3D readiness always false for the original reviewed image, and no outfit board mutation.

## Required exact native evidence

Run 6 genuinely rendered mobile browser flows across Chromium/WebKit widths 320/390/430 using existing genuine licensed original 800×750 photograph, original source bytes/SHA, synthetic test authentication and actual separate per-owner IndexedDB:

1. Capture genuine original JPEG and manually crop, classify and confirm three real source regions.
2. Save three private rows and one owned Style My New Clothes look, block exact duplicate.
3. Verify V4 backup/restore, source-provenance and saved Outfit Builder.
4. Reopen exact source Shoes garment in native My Closet and verify it is initially titled `Blue Sneakers`.
5. In real Adjust details, edit only specific type and color, leaving generated Name unchanged; save `Black Ankle boots` with the original unchanged photo and owner-private ID.
6. Confirm searching `Blue Sneakers` returns zero cards, `Black Ankle boots` returns precisely one. Visually capture before and after screenshots.
7. Export V4 again with corrected category/type/color/name, delete item, restore actual V4 document, reload browser and prove corrected index/search survives while original SHA remains.
8. Log out, verify source previews removed, and prove second owner's closet is empty. Do not make model-accuracy claims from typed test values.

Audit all 72 screenshot PNG SHA-256 checks, 320/390/430 widths, pixel/entropy and the exact six configurations. Run full inherited Node tests, plus 15 adversarial helper/unit/source-contract tests. Keep normal capture regression intact. Strict research-only modified-file allowlist and no-deploy GitHub Actions required.

**Scientific boundary:** The typed browser inputs are test actions, NOT independently verified model predictions or true image ground-truth labels. Parallel Work #36 handles learned garment detection, #37 independent photographed dataset labels, #38 photographed cloth fitting. This priority fixes naming and search *after* a person corrects an item; it **does not** improve automatic category, subtype, or color prediction accuracy. Physical Android/iPhone acceptance remains undone; Family Alpha #255 HOLD.
