# Mission 3 — same-owner saved garment crop CAS (HOLD)

**Parent:** exact Mission 3 draft PR #965 HEAD `9c49059414ca546d217ae317a27851124ed1b185`. This isolated branch is **not merged, not deployed**, and does not alter protected main, production, staging, Supabase, or family accounts. **Family Alpha HOLD #255 remains OPEN.**

## Actual remaining defect after deletion CAS

`public/app.js` already made Adjust details use `saveEditedGarment(updated,expected)` to compare against the row in the same owner-private IndexedDB transaction. But `cropClothingPhoto` continued to use `writeAll([value])` to save a cropped version of an *already saved* garment. A still-open old tab could therefore unconditionally replace a later same-account edit, overwrite source metadata, or resurrect a deleted row. That bypassed the protections added for saved edits and deletes in inherited Mission 3 drafts.

## Code change

- Capture the **exact previously persisted garment snapshot at crop opening**, prior to asynchronous photo decoding and model work.
- For an already-saved garment, save using existing owner-private `saveEditedGarment(value,expectedSavedCropRow)`, which performs an IndexedDB **atomic read/compare/write** and rejects changed or deleted rows.
- Keep unsaved crop drafts on the original, existing owner-private `state` write path; **no new photo storage, no auto deletion, no new model calls**.
- For a stale editor, show a reload-and-reopen instruction; never assert a saved crop succeeded.
- The source original JPEG and SHA remain preserved. No merge, migration, hosted cloud modification, or authorized family-data operation.

## Reproduction and acceptance

- `tests/mission3-crop-saved-row-cas.test.cjs` executes the actual `app.js` crop and saved-row CAS functions in a deterministic transaction harness. Cases: concurrent color change, concurrent source-SHA change, concurrent delete, valid fresh crop preserving original JPEG, same-id re-login revocation, and guard against blind `writeAll`.
- The inherited real Chromium/WebKit `scripts/test-mission3-same-owner-delete-cas-browser.mjs` now exercises stale saved crop rejection and a fresh crop after reload across **320/390/430px**, using actual native same-account IndexedDB, a second independent owner's private store, and synthetic JPEG/SHA. It also retains inherited stale delete and original-photo integrity checks.
- `.github/workflows/mission3-saved-crop-cas-no-deploy.yml` pins the exact parent and enforces the **five-path allowlist**. It runs the complete inherited full serial Node regression, named source suites, PWA/Chromium/WebKit synthetic-browser and disposable local two-owner PostgreSQL RLS checks. All off-host writes stay blocked.

**Validation:** CI results must be checked against the exact final branch HEAD before claiming success. Parent PR #965 was independently reported passing before this child branch.

## Unresolved mission-level release gates

This milestone does **not** establish that the entire mobile/private-cloud app is ready for Family Alpha. Real Android Chrome and iPhone Safari camera and background acceptance, expressly authorized live Supabase Auth/Storage two-account recovery, independent human-labeled recognition (Mission 1), actual photographed-garment 3D fit acceptance (Mission 2), controlled integration of the full application and owner release approval remain pending. Keep [HOLD #255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) in place. Do not merge or deploy.
