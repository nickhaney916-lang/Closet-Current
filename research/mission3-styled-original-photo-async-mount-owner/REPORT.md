# Mission 3 — Style original-photo viewer async initialization bound to exact owner

**Family Alpha HOLD #255 OPEN.** Isolated no-deploy branch stacked on green [PR #1100](https://github.com/nickhaney916-lang/Closet-Current/pull/1100), HEAD `ce2785fd5b2646f727cfd877bab39859d494eb8c`. No merge, production/staging deployment, hosted Supabase, actual owner wardrobes, or physical phones.

## Source-verified issue

`public/closet-stylist.js` `mountOriginalPhotoPreview167()` loads the normal Style My New Clothes **saved original-photo 2D viewer** using an awaited dynamic `import('./style-photo-preview-gate-165.mjs')`. Previously it checked only a **render ticket** after the awaited import, then installed a new viewer into `originalPhotoPreview167`. A same-user login replacement or private IndexedDB handle rotation could leave that ticket unchanged. Likewise, a new generated outfit set or request could replace the previous card references while an import was pending. If no session-lock redraw intervened, the previous generated outfit viewer could be installed under a newer signed session. This is a potential source-observed correctness/privacy race, not a documented leak.

PR #1100 separately secured the saved photo digest, owner-reviewed SHA and database read; this PR protects the **earlier viewer admission/init phase** without changing the photo verification module.

## Fix

- Capture the exact signed auth object, private IndexedDB handle/name, owner ID, persisted token epoch and capture generation via `currentPhotoOwnerSession167()` at mount initiation.
- Capture the original `styledCollectionResults` array and `styledCollectionRequestSerial` generation, and the current `originalPhotoMountSerial167`.
- New `stillCurrent()` checks every identity/result/ticket field before import, after import, after viewer creation, and after `viewer.mount()`. A stale viewer created during callback side effects is disposed rather than published into `originalPhotoPreview167`.
- Error status only appears when the original session and result set remain current; old owner module errors are suppressed. Existing `closet:session-locked` and photo viewer invalidation continue to dispose previews.
- No new garment editor, automatic clothing save, 3D substitute, owner photo persistence, account migration or production cloud integration. Canonical source SHA and owner review remain mandatory for 2D originals.

## Validation

- `tests/mission3-styled-original-photo-async-mount-owner.test.cjs`: source-executes the actual `mountOriginalPhotoPreview167` function and session helper. Only the module-import expression is replaced by a controllable deferred synthetic import to test late account changes, same-ID new auth, same-name DB replacement, owner gate, request/result/ticket rotations, canceled imports, mock viewer creation/mount exceptions and cleanup.
- `scripts/test-mission3-styled-original-photo-async-mount-browser.mjs`: **90 planned real Chromium/WebKit** synthetic mobile viewport cases at 320/390/430 widths, 15 modes × 2 engines × 3 widths, serving the original production ESM module and **deliberately holding the HTTP import response while changing the session**. The browser test checks that only an unrevoked signed-owner import actually installs the 2D preview button.
- `.github/workflows/mission3-styled-original-photo-async-mount-owner-no-deploy.yml`: exact-parent **five-file** strict gate; focused source/browser tests; inherited original photo SHA/session tests and 108 Chromium/WebKit browser scenarios; complete serial Node regression; original photographed garment→private wardrobe→saved outfits; signed disposable two-owner PostgreSQL/Storage RLS; browser evidence receipts.

**Final-head acceptance requires both no-deploy CI jobs fully green.** This is not physical phone, independently verified human 10/10 recognition, authorized hosted Auth/Storage, real photographed clothing to 3D reconstruction, or release approval. Family Alpha HOLD #255 stays OPEN.
