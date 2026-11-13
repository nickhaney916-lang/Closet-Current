# Mission 3 — exact pending-photo crop, category and discard CAS

**DRAFT / HOLD — no merge, no deploy, no hosted Supabase or private family data. Family Alpha HOLD issue #255 stays OPEN.**

## Exact parent and scope
Parent: Mission 3 [PR #977](https://github.com/nickhaney916-lang/Closet-Current/pull/977), exact verified HEAD `6c5e582c9f0b6258b3a195be4bd31c8414622e1c`.
Only six allowlisted paths: `public/app.js`, new `tests/mission3-draft-row-cas.test.cjs`, updated original crop owner-session fixture, new native browser test, this report and exact-parent no-deploy workflow.

## Safety defect
The pending-photo crop path wrote `state['draft']` from `batch.map` without reading the persisted batch, so a delayed same-owner tab could erase a newer separate captured original photo. The "Discard all" and "Apply category" controls also persisted the stale whole in-memory batch, potentially deleting other-tab original photos and overwriting changed human review/cropped records.

## Changes
- `commitReviewedDraftCAS(changes,assertCurrent)` freezes exact pre-change rows and checks signed owner, exact private DB and session epoch, duplicate ID safety, original-photo bytes/SHA and owner-bound source identity. Inside one native `state` IndexedDB readwrite transaction, read actual pending photos, compare normalized exact reviewed rows, and replace/delete only those verified row IDs. Preserve all untouched rows, including newly captured originals in other tabs.
- Unsaved Crop photo freezes a separate exact draft snapshot **before** slow async image/model work; stale/changed/deleted drafts reject without touching the newer source. Saved crop's pre-existing saved-garment CAS is retained.
- Discard all requires human confirmation and no active recognition, CAS-removes only the exact local reviewed draft rows after successful commit, then updates the visible batch; conflicts leave local photos visible and prompt reload.
- Apply category similarly CAS-updates only the exact uncategorized local drafts after success, preserving all other-tab pending photos and human edits. Do not silently claim the category changed if the transaction fails.
- Existing `persistDraft()` generic writer remains unresolved for fresh captures/status changes and **can still overwrite other-tab state**; release is not ready.

## Verification
Tests execute the **actual** new app.js writer against a transaction-faithful synthetic owner-private IndexedDB; include second-tab new JPEG retention, batch bulk update/discard, stale changed color/SHA/JPEG, deleted/duplicated IDs, owner session changes, and queued errors. Inherited exact crop controller owner epoch tests run with an updated fake IndexedDB transaction. New browser suite runs real Chromium/WebKit native IndexedDB at 320/390/430, with separate same-owner tabs and foreign-owner private DB, original JPEG/SHA retention, crop, category and discard.

The dedicated exact-parent no-deploy Actions suite, full serial Node, actual native browser tests and synthetic disposable two-owner signed PostgreSQL/Storage RLS are **not verified until exact final HEAD CI is SUCCESS**. Do not claim independent real garment labels, real phone acceptance, hosted Auth/Storage verification, or an application release.

### Remaining hard blockers
Replace generic stale whole-draft `persistDraft()` paths for candidate capture, recognition status and retry; verify actual physical Android Chrome and iPhone Safari camera/PWA recovery; obtain authorized hosted two-owner Supabase Auth/Storage acceptance; integrate stacked missions safely, independent real-photo recognition (Mission 1), real source-garment 3D fit (Mission 2), owner sign-off. Keep Family Alpha HOLD #255 active.
