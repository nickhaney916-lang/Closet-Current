# REVIEW-COLOR-PROVENANCE-23 — save should not forge explicit user color correction

**Main-controller isolated draft research**, stacked on exact accepted PR #578 SHA `876b680272b6e2c40be24410a14b92802bdf991b`. Family Alpha issue #255 HOLD. Never merge or deploy. Parallel #25 subtype recognition, Parallel #26 segmentation, Work #27 overall integration, Work #28 real-photo color **accuracy benchmarking** remain separate.

## Actual demonstrated code path gap

The existing `public/app.js` `clothingFields` form sets `item.colorSource='user'` on an actual Color field input event and labels an untouched `photo-estimate` as a user-review suggestion. However, **two save handlers unconditionally overwrote that provenance** when `value.color` was nonblank: a newly reviewed photo's Save, and an existing My Closet `Adjust details` Save, changed `colorSource:'photo-estimate'` to `colorSource:'user'` even when the person only edited notes or item type. PR #577 correctly protects `colorSource:'user'` from future model changes, so wrongly promoting an AI estimate is especially harmful. Even reviewing and pressing Save did not prove that a color input or explicit color confirmation event occurred.

## Surgical implementation

Only those two unverified promotions in `public/app.js` were removed. Unedited color estimates keep `colorSource:'photo-estimate'` after either Save. Actual Color input changes still produce `colorSource:'user'`, including intentionally cleared/empty color. Recognition outputs keep `recognition` provenance. The existing user-adjusted garment flags, confirmed classification details, owner-private save, original photo, SHA/source reference, atomic CAS, V4 restore and indexing behavior are otherwise unchanged. `ClothingMemory.confirm` does not include color among its learned categorical fields.

## Genuine source-anchored tests

`tests/review-color-provenance-23.test.cjs` executes the **actual two form submit handler bodies extracted from current `public/app.js`**, not a duplicated save algorithm. Its isolated storage mocks assert the final row handed to `savePiece`, to normal `writeAll` and to native lossless owner CAS `commitOwnerCorrection10`. Tests include untouched photo-derived color during note-only save, recognition provenance, explicit user edits and intentional clears, owner SHA and source photo identity, other confirmed fields and absence of false user-color promotion.

The earlier source-locked original photograph browser runner `scripts/test-color-confidence-19-real-photo.mjs` is extended to load the **actual `clothingFields` DOM function from the current `public/app.js`**, on top of its unchanged real Chromium and WebKit `checkPhoto`, `PhotoColor` and `ClothingDetails` calls. Six distinct original JPEGs pass exact preexisting source SHA-256 verification; each of twelve actual browser cases makes a real Notes field input event and confirms color remains `photo-estimate`, then a real Color input event and asserts `user`, then a real clear event and asserts `user` for empty value. The special Blue and Green colors used to exercise this form are **synthetic test selections**, not true primary-color annotations or improved recognition predictions. Existing browser tests separately verify real model photo estimates. Zero private upload and source SHA checks remain.

`scripts/audit-review-color-provenance-23.mjs` independently checks the twelve genuine form results, inherited user-correction and cross-browser color safety, original photograph SHA, six 320/390/430 screenshot SHA-256 values, no JS errors and no external photo uploads. `NO DEPLOY` GitHub workflow pins immutable PR #578 commit, requires a strict changed-file allowlist, runs the full Node test suite, app build, real browser source-lock test, and all independent audits.

**Limitations:** The fake-store Node tests prove actual consumer save-handler provenance output, not signed cloud persistence or all real user journeys. The browser tests execute the actual `clothingFields` DOM function extracted from source in an isolated test page; this is not a full app signed user E2E or physical phone test. True garment-color accuracy remains unmeasured pending Work #28; the previously recorded source filename hints are not independent human ground truth. No garment segmentation, model improvements, 3D rendering, private account isolation on live RLS, cloud backup, or production deployment is accepted by these tests.

## Scientific/release verdict

Accept only if the exact final PR HEAD successfully builds and passes all Node and licensed original-photo/browser tests, authentic screenshot inspection and independent audit; remain **HOLD** for Family Alpha #255. User-approved research changes are draft only. Never merge or deploy.
