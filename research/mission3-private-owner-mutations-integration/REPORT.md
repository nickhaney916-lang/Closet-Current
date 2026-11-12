# Closet Current — Mission 3 owner-private delete and bulk-edit integration

**Baseline:** verified draft PR #912, HEAD `ba6602ca9f3122bbad3bab3c4a7df410ac0af258`, GitHub Actions #43244867698 attempt 2 COMPLETE SUCCESS, 2/2 jobs and 1,578/1,578 serial Node tests. Family Alpha HOLD #255 remains absolute.

## Integration-level defect

The previous owner-lease fixes protected single garment `savePiece()` and startup `closetReady` but the two other native saved-wardrobe mutations remained unfenced:

* `removeItem(id)` queued a transaction over mutable global `db` rather than the invoking owner's DB. After a signout/signin, stale queued deletion of garment ID *X* could delete the newer owner's garment with the same ID.
* `writeAll(values)` was similarly queued over mutable `db`, allowing old-owner crop or legacy-import updates to overwrite a newer owner's record with the same ID. Old transactions could also report success and run new-owner index refresh after account switch.

These are real privacy/integrity boundary issues regardless of independently reviewed photo model quality.

## Implemented changes

`ownerWardrobeMutationLease()` captures authenticated object, signed owner ID, exact owner-named IndexedDB handle and monotonically increasing capture session epoch. It requires that the owner and all handles still match before any native item transaction. `removeItem` and `writeAll` preserve their existing function signatures and same-owner behavior, but bind their transaction to the captured DB, check the lease when the transaction completes, and re-check around native 3D/owned-inventory refresh. Old-owner or same-ID relogin transactions cannot be reported as new-owner success.

## Source and integration evidence

- Nine deterministic source-extracted tests in `tests/mission3-private-mutation-epoch.test.cjs` run **unchanged real `public/app.js` functions** against pinned vulnerable parent and patched branch. They verify old queued delete, old queued bulk update, same account ID relogin, delayed transaction success, delayed refresh, and normal current-owner delete/update.
- A genuinely executed **Chromium and WebKit native IndexedDB** integration test in `scripts/test-mission3-private-mutation-browser.mjs`: six viewport cases at 320/390/430 CSS pixels. It loads actual `public/index.html` and `public/app.js` from localhost, signs in a synthetic owner A, seeds distinct private IndexedDBs with intentionally identical garment IDs, suspends *only* the app's queue to simulate an account switch, dispatches the actual `closet:session-locked` event, activates owner B, and checks that both stale old-owner delete/bulk update reject and owner B's records remain byte-for-byte in place. It also verifies owner B can then save and delete normally. No hosted request is permitted; all external requests are blocked and any such attempts are recorded.
- Dedicated strict five-path no-deploy Actions workflow includes immutable parent vs patched tests, full serial Node, disposable signed two-owner PostgreSQL/JWT/RLS, Chromium/WebKit synthetic mobile app/backup/restore tests, and new browser integration evidence.

**Verification:** pending exact HEAD Actions completion; do not claim final green until 2/2 jobs pass.

## Protect release hold

**DRAFT / UNMERGED / UNDEPLOYED. Family Alpha HOLD #255**. No Supabase migrations or hosted Auth/Storage, no main/staging/production writes, and no genuine owner garment photos. Synthetic browser two-owner login and local PostgreSQL RLS are not hosted Supabase or real Android/iPhone proof. Mission 1 genuine clothing-recognition accuracy, Mission 2 photographed clothing-to-3D realism, and physical devices remain independent release requirements.
