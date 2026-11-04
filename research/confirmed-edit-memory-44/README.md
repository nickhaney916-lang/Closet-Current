# CONFIRMED-EDIT-MEMORY-44 — restore confirmed non-color learning on actual My Closet Save

**Main controller RESEARCH ONLY, Family Alpha GitHub Issue #255 HOLD; do not merge, deploy, or modify production or existing staging.**

## Exact verified parent

[Priority #43 draft PR #601](https://github.com/nickhaney916-lang/Closet-Current/pull/601), exact SHA `4190ecc5fda8a3325fa83927f95ffabb5d65be65`, [dedicated no-deploy GitHub Actions #41933840225](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41933840225) **SUCCESS** with 570/570 Node and 30/30 native Chromium/WebKit research browser cases.

## Actual regression found

The earlier main-controller `COLOR-PROVENANCE-INTEGRATION-41` source patch correctly removed false automatic `photo-estimate` → `user` promotion from both Save handlers. But one generated explanatory comment in the **saved My Closet > Adjust details** handler accidentally appeared on the SAME line as the existing `if(typeof ClothingMemory!=='undefined') Object.assign(updated,ClothingMemory.confirm(updated))` call. JavaScript therefore treated the call as comment text:

```js
// Explicit color edits retain their existing user-owned provenance.if(typeof ClothingMemory!=='undefined')Object.assign(updated,ClothingMemory.confirm(updated));
```

The native editor still saved category/type changes to IndexedDB, which hid the regression. But the `confirmedDetails` label needed for trustworthy future local clothing recognition-memory suggestions was **not recorded or updated** in this handler; stale `learningReviewedWeek` could remain. The raw `clothing-memory.js` feature intentionally excludes color from `confirmedDetails`.

## Source fix

- Restore the executable `ClothingMemory.confirm(updated)` on its own statement, after the actual `collect()` value and before **both** normal `writeAll` and owner-safe CAS `commitOwnerCorrection10` calls.
- Preserve `photo-estimate` color source on notes/type edits, and preserve explicit `user` color edits and user-cleared blank. No new model classifications, color guesses, image uploads, or background learning.
- Keep all original photograph/sourceSHA256, private owner database, existing outfit references, late worker stop, data persistence, security and category/subtype commit checks from parent intact.
- Do not assert that all saved garments' labels are scientifically true: this only restores the intended explicit-save *non-color* training-example metadata path.

## Required reproducible verification

- All inherited Node tests plus five new tests which **execute the exact native saved editor onsubmit body extracted from current `public/app.js`** and persist/reopen rows through a real fake-IndexedDB implementation: normal save, CAS save, user manual color, user-cleared blank, and CAS stale-conflict rejection. Verify `confirmedDetails`, original photo SHA, all owner/session fields, unchanged estimated color and absence of color in `confirmedDetails`.
- Original application build.
- Existing #34 source epoch (6), #34 immutable receipts (6), #38 worker save finality (6), #41 owner-local color authority (6), and #43 category/subtype final commit (6) Chromium/WebKit research suites.
- New **six actual Chromium/WebKit mobile-width browser cases (320/390/430)** with unchanged locally-generated synthetic JPEG, source-extracted real `clothingFields` and **actual native saved editor submit closure**, `ClothingMemory.confirm`, real owner-named IndexedDB write/read, manual edit and clear consistency.
- Independently SHA/pixel/dimension audit **18 new PNG screenshots** across the new six browser cases and preserve sanitized JSON artifact.
- Strict parent SHA/changed-file CI whitelist, no deployment.

**Limitations:** Browser photos are synthetic; the form and closure are source-extracted in an isolated loopback research page, not a signed full production app test. Does not measure real FashionCLIP/SegFormer classification accuracy, independently verified true color, physical phone, or real cross-device signed cloud. Those remain owned by Work #31/#33, Parallel #27/#32/#30 respectively. Scientific recognition quality NEEDS REWORK. Family Alpha HOLD.
