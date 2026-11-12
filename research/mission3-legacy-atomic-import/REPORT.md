# Closet Current — Mission 3 legacy backup atomic merge (HOLD)

**Base:** verified Mission 3 cloud-restore protection [PR #935](https://github.com/nickhaney916-lang/Closet-Current/pull/935), exact commit `19b82836d9ed22fc739034d2b1a3773d9b443870`.

**Status:** isolated, research-only, draft, unmerged, undeployed. Family Alpha HOLD #255 is active. No existing production, staging, hosted Supabase, or private wardrobe is modified.

## Concrete reliability defect

The legacy v1–v3 JSON import handler in `public/app.js` committed clothing first via `writeAll`, then saved inspiration via `importLooks`, then saved outfits via `importBoardBackup`. A quota error, invalid board reference, concurrent-tab modification, logout, or crash between those writes could leave a partially restored wardrobe and a misleading "Import failed" message after garments had already been saved.

## Isolated engineering change

Opt-in `?legacyAtomicM3=research` routes legacy backup import through `research/mission3-legacy-atomic-import/legacy-atomic-merge.mjs`. The default legacy path is intentionally unchanged until additional owner review and integration authorization.

- Owner/signed-auth, exact IndexedDB connection and session epoch are attested when a file is selected, after decoding and every await, before and after confirmation, and at all transaction boundaries. Same-ID relogin is revoked.
- Before any write: validate backup version/shape, duplicate IDs, dangerous metadata keys, nested owner claims, JPEG byte signatures and SHA claims when supplied; normalize garments and inspiration; reject outfit references that would be silently dropped; check unsaved outfit drafts and the 1,000 garment / 100 inspiration / 50 saved outfit limits.
- Read all existing private `items` and `state` as one fingerprint before confirmation. Build a merge preserving original stored clothing, draft, looks, saved outfits, and other state. Re-read that fingerprint *inside the final readwrite transaction* so a simultaneous tab/cloud mutation fails rather than being overwritten.
- In one IndexedDB `['items','state']` write transaction, save new/updated clothing rows, merged looks, optional outfit board, and increment/dirty the local cloud revision. Any transaction failure or deliberate fault injection rolls back all four domains. No cloud network call occurs in the importer. Post-commit cloud scheduling and UI refresh are separate and never misreport the committed data as lost.
- Existing backup versions 1–3 are still **merge** imports, not full replacement; version 4 remains owned by the existing independently reviewed atomic replacement pipeline. There is no destructive implicit deletion.
- No changes to `auth.js`, `cloud-backup.js`, server schemas, model weights or native 3D paths.

## Verification protocol

- `tests/mission3-legacy-atomic-import.test.mjs`: runs the actual module on `fake-indexeddb` with source-extracted real taxonomy, validated looks and outfit cleaning. Covers confirmed success, all-state rollback on injected mid-transaction failure, owner revocation, cross-tab CAS, no consent, same-ID relogin, missing optional sections, duplicate IDs, foreign metadata, unsafe keys, missing/incompatible outfit references, invalid looks, SHA mismatch and preserved original-JPEG identity.
- `scripts/test-mission3-legacy-atomic-browser.mjs`: runs the real app and private browser IndexedDB in actual Chromium and WebKit at 320, 390 and 430 CSS widths, six synthetic two-owner scenarios. Exercises successful three-domain legacy v3 import, intact originals, cloud revision, invalid backup rollback, cancellation, next-owner privacy after an old delayed file read. All off-host requests are blocked; the private cloud transport is stubbed.
- Dedicated GitHub Actions **no-deploy** requires exact-parent ancestry, six-path allowlist, pinned Node syntax checks, above tests, full serial Node tests, disposable signed-owner PostgreSQL Storage RLS, native camera/crop/import/cloud-recovery/3D-style Chromium and WebKit regressions, and portable evidence receipts.

**Do not claim completed acceptance until CI passes at the exact final commit.**

## Remaining release blockers

This is opt-in, **not** production-shipped. Physical Android Chrome and iPhone Safari camera and local-storage tests, authorized hosted two-owner Supabase backup/restore and human acceptance remain absent. Synthetic photographs, mock authentication and local PostgreSQL RLS are not independently labeled clothing-recognition accuracy or realistic photo-to-3D fit evidence. Family Alpha HOLD #255 remains active.
