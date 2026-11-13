# Mission 3 — signed-owner lifecycle and honest acknowledgement for bulk Photo results category changes

**Research-only, Family Alpha HOLD #255 OPEN.** Stacked exactly on verified Mission 3 [PR #1036](https://github.com/nickhaney916-lang/Closet-Current/pull/1036), parent `7329b25b353210a9c06452a87ba4b5e824903946`. No merge/deployment, hosted Supabase, real accounts, staged app or private wardrobe modifications.

## Source-level finding

The `Photo results → Apply category` handler calls the previously hardened `commitReviewedDraftCAS` to atomically update owner-reviewed pending photo rows. The CAS verifies exact durable rows in owner-private IndexedDB and prevents bulk stale rewrites, but the handler previously **always** wrote to in-memory `batch`, `render()`, and `message()` after its awaited result, without checking its initiating session. A logout/account switch or same-ID re-login between native transaction completion and the handler's continuation could therefore publish an obsolete category or acknowledgement into a new signed session. A related race: if in-memory draft changes after the transaction but before continuation, applying the stale snapshot overwrites the newer local note/category. Existing rejection text also categorically claimed that no categories saved, although the DB might have committed before a late owner-session revocation triggered a rejected acknowledgement. These are code-path risks, not observed personal-data disclosure.

## Implementation

- Bind `ownerWardrobeMutationLease` at the beginning of bulk review, pinning exact auth instance, owner ID, DB handle and `captureOperationEpoch`.
- Pass that lease to the pre-existing `commitReviewedDraftCAS` state/source validator, which already ensures per-row normalized equality and preserves original JPEGs and unrelated drafts.
- After a resolved database commit and before mutating cards, recheck the initiating owner/session and reverify local row object membership and normalized opening snapshots plus scanner idle state. If still same owner but locally changed, **do not replay stale category**; advise that durable category was saved and Photo results must refresh.
- Suppress old-session success/error messages entirely (including same-ID re-login); on a still-current rejected operation use an acknowledgement-neutral message rather than falsely saying storage definitely rolled back.
- Preserve human owner review requirements, original full resolution JPEG, no automatic closet save, and all cloud/backups unchanged.

## Tests

`tests/mission3-bulk-review-category-session.test.cjs`: 15 deterministic scenarios execute the **real production app handler** and the **real owner mutation lease** from `public/app.js` in a synthetic JS VM. Covers unchanged owner success + exact item selection/original source, different owner switch, same-ID re-login, stale errors, a still-current rejected transaction, changed/local-removed source after commit, a scanner starting during commit, invalidated CAS callback, missing category, busy scan, already categorized items, invalid private DB and source lease assertions.

## No deploy evidence and remaining blockers

The strict exact-parent four-file no-deploy workflow must pass source tests, full serial Node suite, Chromium/WebKit mobile CSS sizes, synthetic owner-private IndexedDB/two-tab and disposable signed-owner PostgreSQL tests before acceptance. **CI not claimed prior to exact-head success.**

Independent genuine labeled clothing photo recognition, physical Android Chrome/iPhone Safari, hosted Supabase RLS/backup, realistic photo-derived 3D fitting, integrated Missions 1/2/3 and explicit family owner release approval still remain. Maintain #255 HOLD.
