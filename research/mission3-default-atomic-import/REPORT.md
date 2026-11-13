# Mission 3 — Default private backup import commits atomically and never overwrites a different original JPEG

**Family Alpha HOLD #255 OPEN. DRAFT ONLY. NO MERGE / DEPLOY / STAGING / HOSTED SUPABASE / PRIVATE OWNER WARDROBE ACCESS.**

Verified parent Mission 3 [draft PR #1012](https://github.com/nickhaney916-lang/Closet-Current/pull/1012), exact HEAD `67162236613c6fda8f2717522562c26ba9f25fb9`.

## Root cause and source verification

The normal `$('import').onchange` legacy v1–v3 branch of `public/app.js` previously:
1. Parsed and validated only garment format and image data URL syntax.
2. Obtained one global confirmation and ran `writeAll(valid)`, which used `IDBObjectStore.put` for each item without comparing current ID/source identity.
3. Then read and published clothes, then wrote inspiration with `importLooks(data.looks)`, then wrote outfit board via `importBoardBackup(data.outfitBoard)` in independent transactions.

A later failed look or board import left clothing already committed, with the app possibly showing only part of the desired backup. A coincidental or stale same-ID backup could overwrite another already owned original JPEG and user-confirmed garment attributes before the owner discovered the conflict.

An isolated research implementation `research/mission3-legacy-atomic-import/legacy-atomic-merge.mjs` already demonstrated a single owner-private native IndexedDB transaction covering items, looks, board and cloud sync revision, with snapshots, consent, cryptographic source checks, rollbacks, and stale-tab/owner lease rejection. This milestone ports it into a **default reachable public module** under `public/native-default-atomic-import-m3.mjs` and adds stricter source collision and signed-owner stamping.

## Implementation

- In normal legacy import, require idle camera/import/recognition/editor, no unsaved original photo or in-memory failed retry, no pending outfit edits or busy private write. Defer if unsafe, rather than importing over a live uncommitted source.
- Prepare and validate a v1–v3 backup (max 100MB selected file; bounded clothing/looks/board/metadata), exact original JPEG bytes/SHA-256 when present, owner isolation, absent original-proof inconsistency, invalid IDs, prototype pollution, invalid outfit references, and source/cross-account metadata.
- For an incoming clothing ID already on the owner's device, **reject** if the image, canonical original JPEG, source SHA, or original SHA differs. A bulk import confirmation never authorizes silent replacement with an unrelated physical garment. Same-source metadata may still update atomically.
- Stamp missing legacy `ownerId` onto only the current signed owner, without permitting any incoming foreign `ownerId`.
- Show an explicit confirmation summarizing clothing, inspiration, and saved outfits. Cancel keeps all private data unchanged.
- Freeze and re-check all items+state under one native IndexedDB **readwrite** transaction; any concurrent change, browser quota, malformed board, or thrown write rolls everything back. Mark the cloud revision dirty in the **same transaction**, then notify cloud sync after commit. Atomic outcome is a single committed unit; no remote cloud content is sent by this milestone.
- Reload in-memory closet/inspiration/outfits only after commit using existing same-session lease and changed-photo guards. If reload fails after commit, accurately report 'Backup imported atomically. Reload My Closet to refresh the view.' Never misreport a committed import as unchanged.
- Existing explicit research-only `legacyAtomicM3=research` and `restoreAtomic01=research` branches remain unchanged. No migrations or changes to existing live hosting.

## Test plan and evidence

- `tests/mission3-default-atomic-backup-source-guard.test.mjs`: genuine synthetic JPEG header, native fake-indexeddb, exact production taxonomy and outfit cleaner, atomic success/rollback/transaction races, source proof, foreign owner, prototype rejection, invalid outfit references, same-ID different-original rejection, same-original metadata update, missing legacy ownerId becomes signed owner only.
- `scripts/test-mission3-default-atomic-import-browser.mjs`: actual public app with **default URL** (no special flag), real Chromium/WebKit 320/390/430 and native private IndexedDB, synthetic owner photos/garments, ordinary file input and confirmation, merged clothes+looks+outfits+cloud revision in one commit; invalid photo collision, duplicate ID, foreign account, unsaved canonical original, and real IDB staged outfit-write exception all leave full snapshot unchanged; cancel and revocation protect original wardrobe. No off-host writes.
- Exact parent six-file no-deploy GitHub workflow runs inherited Node, mobile browser, owner/privacy, original photo, recognition, cloud restore, signed disposable PostgreSQL Storage RLS and photo outfit styling regressions.

**Verification pending exact HEAD full green CI; do not represent the code as released or claim physical-device/human photo accuracy.**

## Residual limits and blockers

Native Android Chrome and iPhone Safari physical-camera/PWA acceptance, authorized hosted Supabase Auth/Storage two-owner cloud recovery and revocation, independent human-ground-truth original garment accuracy, source-proven photorealistic cloth fitting on 3D humanoids, cross-mission integration and owner release signoff remain BLOCKED. No production or staging deployment. Family Alpha HOLD #255 is OPEN.
