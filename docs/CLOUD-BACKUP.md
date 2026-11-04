# Private closet saving and recovery

Implemented October 14, 2026 for Closet Current project `hlkgymugtfbirlpunsra` only. Drive Duel was not accessed or modified.

## User behavior

On the next signed-in app visit, existing local clothing is migrated automatically to the account's private cloud backup. Local copies remain. New captures, saved clothing, edits, deleted items, unfinished review photos, saved inspiration and outfit-board data are synchronized. Images are kept inside app/browser storage and private cloud storage; the app does not create individual files in the phone gallery.

Open My account to see backup status or choose Sync closet. Wait for “Cloud backup up to date” before changing browser, app origin or clearing local data. Pending uploads retry after reconnection and on subsequent app visits. A compact closet status appears during restore, pending saves or errors. The separate phone-photo test remains local and does not upload its report or test photos.

## Storage and data safety

- `closet-private` is a private JPEG bucket, with an 8 MiB per-photo limit. Photo paths are account UUID plus a SHA256 content hash. Existing identical objects are verified rather than overwritten blindly.
- The owner-keyed `closet_backups` table stores photo references and metadata, not base64 images. Row-level policies limit data access to the authenticated owner. Anonymous table access and public photo URLs are denied.
- `save_closet_backup` is a security-invoker function. Revision comparisons reject stale writes. It does not trust a caller-supplied account ID and uses an empty search path.
- Local pending-change markers are durable before mutations. Snapshots share the local write queue so a capture cannot be acknowledged before being included. New changes during upload remain pending.
- Complete cloud documents and verified images are downloaded before replacing the local mirror. Restoration is atomic and checks for intervening local changes. Local drafts are retained and resumed.
- Three-way merges preserve unrelated additions and edits, including concurrent changes from separate devices and deletions. Conflicting changes to the same field stop synchronization rather than silently dropping either copy; My account reports that review is needed. Choose “Keep both versions” in My account to preserve the other device’s version and create a saved copy of the conflicting local version. Photos, drafts, inspiration and outfit references are retained. Copy identities are saved before upload so a lost save response can be retried without extra duplicates. Capacity failures keep the existing copies rather than truncate them.
- Cloud photo objects are immutable and are not automatically garbage-collected yet. Deleted pieces leave private old photo objects available; metadata reflects the deletion. Storage retention/cleanup needs a follow-up before large-scale use.

Only the existing publishable API key is used in the client. Session refresh is serialized and rejects account changes. No privileged key is embedded. Local account separation and camera resolution are unchanged.

## Validation

186 Node checks passed. [Final browser recovery run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38621528403) passed, verifying migration of nine sample pieces, restoration in an independent browser, account isolation, outfits/inspiration/unfinished-photo restoration, offline edit persistence through reload, retry, preservation of edits made during upload, deletion synchronization merging independent device edits, preserving both conflicting versions, retrying a lost save response without duplicates, and retaining local photos after a corrupt cloud download. It uses a controlled HTTP backend with the production browser client and licensed fixture images; no personal user wardrobe was inspected.

Separately, the actual Supabase Auth, REST and Storage APIs were exercised using two disposable synthetic accounts. Private upload/download, revision saving and stale-write rejection passed. Other-account and anonymous metadata/photo access and public photo access were denied. Synthetic objects were removed, sessions were signed out and synthetic accounts and their backup rows were deleted. No signup, reset or confirmation email was sent.

Database transaction tests exercised owner read/write policies, denied cross-owner inserts and ownership changes, and denied anonymous table/function access. The test transaction was rolled back. Performance advisors returned no notices; no cloud-table or storage RLS warning was reported by security advisors. One pre-existing Auth warning remains: [leaked-password protection is disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). SMTP readiness is tracked separately.

The schema source is `supabase/cloud-backup.sql`; the migration was applied through the Supabase connector. Raw verification booleans are in `cloud-backup-results.json`. No real phone hardware test is claimed, and the owner's actual nine items are uploaded only after their updated signed-in client runs successfully. Refresh loss in an existing browser session is not independently reproduced by these tests.


## Development-branch cloud regression — October 18, 2026

On draft PR #7, enabled cloud multi-device browser regression for the
integration development branch. The production cloud client is unchanged.
A controlled browser test now verifies manually confirmed Unsorted Clothing
category/color syncing to another session, a source-identical original photo
surviving sync and reload, and another user's synthetic account remaining
isolated. The longer original suite still tests offline retry, deletion,
parallel edits, lost responses, keep-both conflict recovery and corrupted
photo retention. A legitimate edit conflict during the test was resolved
through the app's existing **Keep both versions** control; cloud saves must
never silently overwrite either user's changes.

[Verified run 39173019247](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39173019247)
passed 762 of 765 Node tests (0 failed, 3 intentionally skipped)
and the complete controlled multi-session browser recovery. No
real subscriber account, live production deployment or fresh actual
Supabase RLS validation was performed for this change.

