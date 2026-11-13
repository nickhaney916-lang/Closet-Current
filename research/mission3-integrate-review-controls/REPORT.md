# Mission 3 — integrate owner-bound pending Photo controls into latest Stylist branch (HOLD)

## Provenance and exact integration
- Target exact parent: Mission 3 [draft PR #1059](https://github.com/nickhaney916-lang/Closet-Current/pull/1059) HEAD `6f116c8293f4e98ddfb3c71cefc8fc009eec5d98`.
- Source donor: independently verified [draft PR #1055](https://github.com/nickhaney916-lang/Closet-Current/pull/1055) HEAD `302ad8172416587494b684704e4daa347a9e9140`, no-deploy SUCCESS [43510741476](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43510741476).
- The complete `$('refreshReview').onclick` through `$('discard').onclick` segment in target `public/app.js` was confirmed **byte-for-byte identical** to donor base [#1049](https://github.com/nickhaney916-lang/Closet-Current/pull/1049) `12472bab696ca3ec006dc05a54f230982798b695` before substitution. Thus no overlapping edits or reverse changes to other Mission 3 controls were needed.
- Replaced precisely that segment (1,264 source chars -> 2,901 source chars) with the verified donor segment, keeping all other application source identical. Imported the donor's 21 actual-source synthetic regression tests and 54 Chromium/WebKit synthetic mobile-viewport race scenarios unchanged.

## Safety improvement
- Pending Photo results **Discard** is bound to the originating signed-owner/auth object, native private DB handle and capture epoch; checks frozen batch identity and row values, duplicate IDs, scanner activity and concurrent photos before/after the original private IndexedDB CAS.
- A late callback cannot clear a newly signed-in owner's photos, capture receipts or UI; uncertainty after a possible committed deletion is accurately described rather than misreported as a guaranteed rollback.
- **Refresh** re-enables its existing button only for the exact originating owner/session; stale asynchronous completions cannot alter a new owner's control.
- Original JPEGs, SHA-256, confirmed garment data, backup restore and 2D outfit fallback are not changed by this transplant.

## Acceptance and release gate
The dedicated branch workflow inherits full serial Node, native IndexedDB, Chromium/WebKit 320/390/430, original photo integrity, private backup/restore, synthetic signed PostgreSQL two-owner RLS and current 3D/recognition integration source checks. Its exact-parent diff gate permits only `public/app.js`, the donor's two test files, this report and the CI workflow.

**This integrated head is not PASS until its exact new no-deploy GitHub Actions run completes successfully.** Automated mobile viewports are not physical device tests. Live owner-authorized hosted private cloud testing, independent real-photograph recognition, real-photo 3D fidelity, and family release consent remain blocked. Family Alpha #255 stays open/HOLD. No merge, deployment or hosted/private data mutation authorized.
