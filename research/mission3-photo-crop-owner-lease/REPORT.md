# Mission 3 — Photo-crop editor owner lease and private draft integration

**Pinned green parent:** PR #917, exact HEAD `0e6fc1860f3eb0df116e4b05d41f83a7d7346d55`, GitHub Actions #43249843295, 2/2 passed, 1,587/1,587 Node tests, 6/6 genuine Chromium/WebKit native IndexedDB synthetic-owner isolation cases.

## Concrete defects in actual application

The saved-clothing mutation workflow already pinned the signed owner/DB/session, but `cropClothingPhoto(item)` in `public/app.js` did not:
- An old unsaved photo's `checkPhoto()` could finish after sign-out and then call `queued(()=>db.transaction('state'))` over another account's *current global DB*. Same ID in the new account meant its draft could be overwritten with the old account's image and metadata. The prior async completion also mutated old item data and rendered the new account UI.
- Delayed recognition from `enableLocal()` or `localRequest()` could produce stale suggestions across accounts.
- `openPhotoCrop()` in `public/photo-crop-editor.js` awaited the original JPEG's `Image.decode()` without checking whether the owner had signed out; its dialog could be built and shown after session cleanup had already closed previous dialogs.

## Narrow repair

- At crop initiation, capture the initiating signed user, authenticated object, exact owner-named IndexedDB and session epoch using the existing `ownerWardrobeMutationLease()` introduced by PR #917. Also require object identity membership in the current saved `items` or unsaved `batch`. Revalidate after model loading, recognition result, color/photo analysis, transaction completion and before any item mutation or render.
- Existing saved garment crops continue to use the protected `writeAll()`. Unsaved draft edits now queue against the *captured* original owner DB with a frozen per-transaction batch snapshot and check the lease before and after the transaction. Old edits never write a later account's DB, even when garment IDs collide.
- The actual crop editor accepts an optional backward-compatible `isCurrent` callback. It skips opening a dialog when `img.decode()` resolves after revocation, and suppresses stale recognition and Save UI continuations. Existing consumers without the callback work as before. Errors from revoked editors cannot show on the next owner's screen.
- The original JPEG and garment source metadata remain retained; no new auto-classification or fake review approval.

## Direct evidence

`tests/mission3-photo-crop-owner-session-lease.test.cjs` exercises exact runtime extracted code against both immutable parent and patched versions, including color analysis after owner switch, old queue after switch, same-owner re-login, late transaction, stale model load, stale editor decode, normal valid draft and saved garment crop, original source retention and editor functionality.

`scripts/test-mission3-crop-owner-lease-browser.mjs` uses the actual application, normal crop editor and native IndexedDB in Chromium and WebKit at widths 320/390/430 with two synthetic owners sharing the same garment ID. The old user begins crop Save, the account switches while photo analysis is blocked, and the new owner's private draft must remain unchanged. The new owner then crops successfully. Browser scenarios use a synthetic generated JPEG and block all hosted customer endpoints.

**Verification status:** exact-head workflow pending; do not claim green until complete.

## Release restrictions

**FAMILY ALPHA HOLD #255 / DRAFT / UNMERGED / UNDEPLOYED.** No main/staging/production changes, no live Supabase Auth/Storage writes, no customer photos, no physical camera access. Native browser synthetic owner testing does **not** substitute for hosted two-account privacy and physical Android Chrome/iPhone Safari acceptance. Mission 1 real-garment recognition and Mission 2 photo-fitted 3D remain independent release blockers.
