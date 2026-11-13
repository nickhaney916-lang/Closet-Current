# Mission 3 — Default Backup export is a verified, signed-owner durable snapshot

**Family Alpha HOLD #255 OPEN. DRAFT ONLY. NO MERGE, NO PRODUCTION/STAGING DEPLOY, NO HOSTED SUPABASE OR PRIVATE WARDROBE ACCESS.**

Parent is verified Mission 3 [draft PR #1014](https://github.com/nickhaney916-lang/Closet-Current/pull/1014), HEAD `e87c1b5cd85d3f55ea1aeef890c1932a00e10faa`.

## Source-verified hazard
Normal `$('export').onclick` in `public/app.js` created `closet-current-backup.json` v3 from the current JavaScript arrays `items`, `inspirationLooks`, and `boardBackup()`, and then displayed “Backup downloaded.” Those arrays can lag a second same-owner tab's committed garment edits or photo saves and can hold unsaved outfit edits. **Unfinished Photo results are entirely absent from v3 import/export**, so an owner could infer all original JPEGs had been backed up when pending photos were not included. There was no owner epoch or device-storage revalidation before sending the download.

The research-only v4 `restoreAtomic01=research` lossless export already exists, but its matching v4 importer and acceptance gates are explicitly opt-in. This milestone **does not** release an unsupported v4 importer or claim v3 is a full lossless backup.

## Correction
- Normal default v3 Export now acquires the signed-owner, original-DB, session-epoch `ownerWardrobeMutationLease` and waits for its current private write tail.
- Preflight refuses if any visible/failed/pending capture JPEG, camera, import, recognition, private write race, modal editor or unsaved outfit draft remains. This prevents an incomplete “backup downloaded” claim.
- The new `public/native-default-verified-backup-export-m3.mjs` reads saved items and state in **one IndexedDB readonly transaction**. It rejects a persisted `draft.batch` containing ANY photos, including photos from another same-owner tab unseen by the exporting tab. A malformed draft record is never silently treated as empty.
- It verifies signed owner and nested metadata, every source JPEG header and supplied SHA-256, bounded garment/looks/outfit data, exact saved outfit references, and a maximum JSON file size compatible with the normal 100 MiB v3 importer.
- Older ownerless v1-v3 saved rows are stamped with the current signed owner **in the exported copy only**, without modifying local bytes. The authoritative device values are preserved, including `originalPhoto`, source hashes, and owner-confirmed attributes.
- The snapshot checks the lease and idle work before/after async reads and SHA calculations. Revoked or switched owners cannot receive an old owner's download or notification.
- The new on-screen success message explicitly says **saved** clothing, inspiration and outfits were exported, and clarifies that v3 cannot restore unfinished Photo results. Research-only v4 export/import paths remain unchanged.
- Nothing is written to hosted Supabase, no additional telemetry/AI calls are made, and no private Wardrobe is accessed.

## Reproducible testing
- `tests/mission3-default-export-snapshot-cas.test.mjs`: native fake IndexedDB signed-owner read, original JPEG + verified hashes, exact persisted looks/board, stale UI-independent values, two-tab durable pending JPEG exclusion, corrupt draft, malformed/out-of-date source hash, missing outfit references, foreign owner metadata, account epoch and unsaved edits, empty closet, ownerless import/export continuity, source check against actual app handler.
- `scripts/test-mission3-default-export-owner-snapshot-browser.mjs`: actual unflagged app Export button and downloaded JSON in real Chromium/WebKit at 320/390/430 CSS px. Synthetic SHA-proven JPEG + real browser IndexedDB, same-owner second-tab-style writes while in-memory cards are stale, IDB draft photo exclusion without Blob creation, hash tampering fails closed, revoked session blocks late download, foreign account isolation, all off-host traffic blocked. No physical phone, hosted Supabase or independently human-labeled photo claims.
- Strict exact-parent six-file **NO DEPLOY** GitHub Actions repeats all inherited Mission 3 cloud/photo/privacy/camera/3D-style integration, signed disposable PostgreSQL two-owner RLS, native browser and full serial Node suites.

**Current verification status:** must be established by final exact-HEAD green Actions before being reported as completed.

## Remaining release gates
A v3 saved-only export is not a full backup of pending Photo results, and the owner still needs a separately accepted lossless v4 migration before broad Family Alpha release. Actual physical Android Chrome and iPhone Safari acceptance, authorized hosted Supabase Auth/Storage two-owner recovery, independently verified genuine clothing-photo recognition accuracy, photo-derived photorealistic 3D drape, final Mission 1/2/3 integration and owner approval remain blocked. Keep **Family Alpha HOLD #255 OPEN**.
