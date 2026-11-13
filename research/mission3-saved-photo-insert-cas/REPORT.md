# Mission 3 — general saved-photo edit and new-item collision CAS (HOLD)

**Stacked exact parent:** draft [PR #966](https://github.com/nickhaney916-lang/Closet-Current/pull/966) HEAD `27a80dc9b1e8a2b4b942ec9924937e4b5f6cf2ec`. This branch is isolated, unmerged, undeployed research only. **Family Alpha HOLD #255 OPEN.** Main, staging, production, hosted Supabase and private wardrobes untouched.

## Defect in the real application

The ordinary `adjustPhoto` modal recorded `expectedSavedRow` only while the optional `nativeCorrection10` research flag was on. Without that flag, `savePiece` unconditionally `put` the garment in IndexedDB and rewrote the draft state. In two browser tabs signed into the **same account**, an old modal could overwrite a newer metadata/original-photo correction, or resurrect a row another tab had deleted. A separate newly captured item whose ID already existed also silently replaced that persisted item.

## Implementation

- Always snapshot the exact opening saved garment row for an existing `adjustPhoto` modal, regardless of the optional CORRECTION10 flag.
- Freeze `expectedSavedRow` synchronously when `savePiece` is invoked. Keep the special human-reviewed CORRECTION10 commit path intact when selected.
- For ordinary saves, use a single owner-private IndexedDB `['items','state']` readwrite transaction: read the existing row, compare normalized row against the saved expected snapshot, then write the garment and draft together **only if unchanged**. A missing/modified existing row aborts with `CLOSET_STALE_SAVED_GARMENT_REOPEN_EDITOR`.
- For a genuinely new garment, reject pre-existing IDs with `CLOSET_ALREADY_SAVED_RELOAD_WARDROBE` rather than silently overwrite another saved item. A noncolliding new item still saves with its draft in one transaction.
- Both conflicts preserve newer rows, original JPEG evidence and previously committed drafts. Show a specific reload-and-review instruction for the unflagged Adjust path.
- Preserve owner ID, exact DB object, auth object and login epoch fences. Do not change recognition, 3D, cloud schema or production paths beyond this isolated branch.

## Tests

- `tests/mission3-saved-photo-insert-cas.test.cjs`: exact extracted `savePiece` tests with synthetic transactional IndexedDB semantics covering normal edit, two-tab color/source conflict, stale deleted row, duplicate new-item ID, valid new insert, frozen expected snapshot, and revoked owner epoch.
- Extend `scripts/test-mission3-same-owner-delete-cas-browser.mjs` to exercise the **actual public/app.js savePiece** against two same-owner tabs using real native Chromium/WebKit IndexedDB at 320/390/430, proving the newer row survives stale edits and attempted ID collisions, in addition to inherited crop and deletion tests.
- `.github/workflows/mission3-saved-photo-insert-cas-no-deploy.yml` pins exact parent and a **strict five-path allowlist**, source tests, full serial Node, native Chromium/WebKit and disposable signed two-owner PostgreSQL/Storage RLS tests. This workflow is **NO DEPLOY**.

CI must pass at the **final exact branch HEAD** before labeling this milestone verified.

## Mission-wide release gates still unresolved

Not a complete real-world app release: actual Android Chrome/iPhone Safari PWA and camera/background acceptance; owner-approved hosted Supabase two-account Auth/Storage backup/restore; independently human-labeled recognition acceptance; photographed clothing 3D fidelity; controlled full-application integration and owner release signoff. Keep [HOLD #255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) OPEN; no merges/deployments.
