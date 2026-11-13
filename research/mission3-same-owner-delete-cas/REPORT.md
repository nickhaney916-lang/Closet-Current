# Mission 3 — same-owner two-tab saved-garment deletion CAS (HOLD)

**Exact verified parent:** Mission 3 draft PR #956 HEAD `f4555891b8e5a9f48320c6f1c9bccc1bed50d1ed`. This branch is isolated research only. No production, staging, hosted Supabase, family photos or wardrobes are touched. **Family Alpha HOLD #255 remains OPEN.**

## Defect

`saveEditedGarment(updated,expected)` already protected a corrected saved garment against another tab editing the same row by using an IndexedDB readwrite compare-and-swap. In contrast, the shared `removeItem(id)` did `objectStore('items').delete(id)` without comparing the row the user had last reviewed. If tab B edited a garment's category, color, original photo reference, or other metadata while tab A kept its old closet open, tab A's delete would erase the newer garment on device and potentially include that loss in cloud backup.

## Implementation

- `removeItem(id,expected)` now **requires** the exact initiating reviewed row. It clones the reviewed snapshot synchronously before waiting for prior private writes and cloud preflight.
- Under one owner-bound IndexedDB `readwrite` transaction, `get(id)` compares the present normalized saved row to the reviewed snapshot. Only an identical row is deleted; a changed or already-missing row aborts the transaction with `CLOSET_STALE_DELETE_REOPEN_EDITOR`. No stale row is erased.
- Both normal My Closet deletion and owner review dialog removal pass their exact displayed row. On conflict the app instructs the user to reload My Closet before repeating any destructive action. No automatic merge or deletion.
- The owner/session epoch, account-specific database, original JPEG SHA provenance, saved garment edit CAS, and deferred native index refresh remain unchanged.

## Automated evidence

`tests/mission3-same-owner-delete-cas.test.cjs` executes the **actual production** owner lease, queued write and delete source against deterministic transactional simulations. Covers current deletion, two-tab changed color, changed original SHA, already deleted row, absent/mismatched reviewed snapshots, re-review success, owner switch and same-ID relogin.

`scripts/test-mission3-same-owner-delete-cas-browser.mjs` runs actual `public/index.html` and `public/app.js` in **Chromium + WebKit at 320/390/430 CSS pixels**. Two same-owner browser tabs share native IndexedDB. Tab B commits a metadata edit; tab A's stale delete must abort; native persisted original JPEG/SHA and B edit remain. After A reloads and reviews the updated row, explicit delete commits. Another account's native private database is unchanged. Only synthetically generated photo data and mock signed users; no live hosting.

The no-deploy CI pins the exact parent, restricts all modifications to five files, runs dedicated source tests, all existing serial Node tests, native Chromium/WebKit photo backup/restore owner controls, disposable signed PostgreSQL Storage RLS and cross-browser results with SHA proof. **Do not claim verified until exact-HEAD CI is green.**

## Whole-mission release blockers

This is a local data-loss prevention milestone, not release sign-off. Physical Android Chrome/iPhone Safari capture/PWA/visibility testing, owner-authorized hosted signed two-account Supabase Auth/Storage restore, review of parallel recognition/3D outputs, controlled integration and product owner acceptance remain outstanding. Maintain Family Alpha HOLD #255; do not merge or deploy.
