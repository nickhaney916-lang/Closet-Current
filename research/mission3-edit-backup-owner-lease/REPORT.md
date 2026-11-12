# Mission 3 — saved editor and backup import owner lease (HOLD)

**Parent:** exact verified Mission 3 crop-owner PR #923 HEAD `4217ea44a6961d78fbad26eea9b4954e3200066c`. This isolated stacked research does not merge, deploy, touch production/staging, or use real users. Family Alpha HOLD #255 remains active.

## Defects investigated and patched

1. **Signed-owner backup selection versus delayed File.text():** The old JSON importer captured no sign-in identity when the file was selected. Its later read could resume under another user's currently active DB, confirm, and write imported garments to the new owner's wardrobe. Capture an owner+DB+auth+session-epoch lease when the file is selected; re-attest after reading, before and after owner confirmation, around each awaited legacy restore stage, and before any UI status. Use the original DB for its roster re-read. Native atomic restore also receives owner-lease checks before/after its bridge call and owner confirmation.
2. **Saved garment editor and delayed correction:** The saved-item form was not leased at modal opening. A re-login during async exact-row read or label-module loading could allow an old editor to act upon a new session, including a same-ID account. Capture the modal owner's lease on open, use its exact private DB for reading, and re-attest before each persistence/refresh boundary, after all awaits, and before rendering/error/focus UI.
3. **Async saved-item transaction:** The existing `saveEditedGarment()` function used only the owner ID and DB object for its own write lease. Use the session epoch and authenticated DB binding and guard the read callback, transaction completion, and asynchronous native index refresh. The gated native correction loader similarly captures owner and exact DB before dynamic import, rather than after.

## Verification evidence policy

- `tests/mission3-edit-backup-owner-lease.test.cjs` executes the exact unmodified runtime function bodies (not a rewritten pseudocode implementation), with synthetic A/B owners, identical row IDs, delayed files, confirmation switches, same-ID re-login, held IndexedDB get/transaction completion, legitimate restore and valid owner edit.
- `scripts/test-mission3-edit-backup-owner-browser.mjs` exercises the actual app, two synthetic users, native IndexedDB, delayed backup file read, rejected cross-owner import, and the new owner's valid import in Chromium and WebKit at 320/390/430 widths. All external requests are intercepted and rejected (no hosted writes); screenshot/device claims are not made.
- Strict two-job no-deploy workflow requires exact-parent ancestry, five-path diff allowlist, node syntax validation, both regressions, inherited crop-owner cases, existing signed-owner disposable PostgreSQL RLS checks, current app build, full serial Node suite, and independent native Chromium/WebKit browser integration.
- Results are **not verified until an exact HEAD Actions run passes**. Do not infer any successful tests solely from this report.

## Remaining blockers

An isolated browser is not a physical Android Chrome or iPhone Safari camera. Local ephemeral signed PostgreSQL and browser simulations do not authorize a hosted two-account Supabase cloud trial. Legacy import retains its historical non-atomic clothing/looks/board stages: the session lease prevents stale-owner writes across stages but does not make partial same-owner restores atomic. Genuine user photo-recognition and realistic 3D fitting acceptance remain separate. No Family Alpha release or deployment is authorized.
