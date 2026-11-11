# Closet Current — Mission 3 durable owner-local JPEG source validation and retry safety

**FAMILY ALPHA HOLD #255. Isolated DRAFT research only. No production or existing staging writes/deployment, no real owner JPEGs/hosted signed accounts, no Mission 1/2 modifications.**

## Exact verified baseline

Mission 3 draft [PR #824](https://github.com/nickhaney916-lang/Closet-Current/pull/824) HEAD `a6798941b0d47cd3cb5e4c3c297e8b5c86377282`, [NO DEPLOY Actions #42954660873](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42954660873) **SUCCESS**: 1,438/1,438 Node tests; six real Chromium/WebKit 320/390/430 owner-private photo reference integrity cases; 67/67 valid PNGs and 36/36 zero-axe-violation reports.

## Concrete local failure path

An owner can have a garment saved on-device with an image that is not a JPEG, has corrupted base64/JPEG magic, or exceeds the configured private cloud Storage bucket limit of **8 MiB** (8,388,608 bytes). The previous `imageBytes()` threw a generic error; `sync()` treated it as a temporary connection outage and automatically retried the same unbackuppable source every time the app was focused, came online, or ran its timer. A full PWA reload repeated the request. The owner received a misleading connectivity message and the original local source could be repeatedly cloned/decoded without any corrective path.

## Scoped repair

- Classify unsupported source format, invalid JPEG and oversized source as distinct **owner-local** validation errors only when they originate while encoding the current saved wardrobe. Raw JPEG image bytes are never silently compressed, altered or accepted without SHA receipt verification. A quick base64 length check rejects the 8 MiB + 1 oversized original **before decoded allocation**.
- Persist a small `localPhotoPause:{reason,revision}` in the existing authenticated owner's IndexedDB `cloud-sync` marker after an invalid **dirty local** source fails. No source bytes, passwords, or token data are persisted in that marker, and `cloud-sync` is excluded from cloud JSON. An owner restart/reload reads it **before any remote REST or original-JPEG read** and displays a visible actionable message: the original remains locally preserved, the user must correct the source or limit, or explicitly press `Sync closet`.
- On a deliberate Sync the pause is cleared and a new attempt is made; an unchanged invalid source re-records the pause. A genuine new saved `localRevision` automatically makes the old pause stale, clears it and retries safely. The write uses the existing generation/owner/DB lease and refuses to block a newer photo because of an outdated asynchronous validation result.
- If durable persistence itself fails, retain a session-only pause and explicitly indicate that it may not survive app restart. Do **not** treat remote 413/507, malformed remote legacy cutout, 503 network issue or device IndexDB quota failure as a local JPEG validation error; earlier dedicated recovery paths remain intact.
- Preserve actual original source JPEGs, private outfit IDs, reviewed cutout receipt requirements, source SHA-256, account isolation and atomic cloud restore. No changes to Auth, Supabase, recognition engine, 3D fitting or release workflows.

## Exact-parent and real-browser acceptance

`tests/mission3-durable-local-photo-validation.test.cjs` must demonstrate the exact verified PR #824 parent repeatedly schedules connection retries for an unsupported PNG, a damaged JPEG and an 8 MiB + 1 JPEG, then verify this branch persists an owner-specific reason and revision, makes **no automatic cloud requests on a reopened controller**, keeps every source photo unchanged, permits one deliberate retry, automatically clears an old reason when a corrected new revision is saved, and never blocks an unrelated signed owner.

`scripts/test-mission3-local-photo-validation-browser.mjs` must run the **actual built application** in Chromium and WebKit at **320, 390 and 430 CSS px** using synthetic user accounts and a locally rendered synthetic JPEG. It checks an invalid owner-saved image remains in the original private IndexedDB across a **full page reload** with no automatic cloud requests, status is usable and axe-accessible, a new correctly saved JPEG revision resumes sync with exact SHA-256 Storage upload and correct private cloud reference, and no inline original is copied to cloud JSON. Screenshots and SHA receipts are retained.

The dedicated NO DEPLOY workflow runs exact-parent baseline, repaired tests, the entire serial Node suite, genuine Chromium/WebKit camera/manual-review/private wardrobe/styling, revised storage-reference and owner-tag validation, revision-first 1,000-item cloud, remote 413/507 and device quota rollback. **Five scoped paths**: cloud controller, Node test, browser test, report and workflow. Do not claim exact-head verification before CI and synthetic artifact are checked.

## External release blockers remain

Actual physical Android Chrome/iPhone Safari background camera, interrupt/OS kill and real high-resolution 1,000-different-garment peak heap/quota tests; genuine authorized disposable hosted Supabase two-owner signed JWT/RLS/Storage rejection and cloud recovery; independent human-reviewed recognition and realistic photographed-clothing 3D integration have **not** been completed. These synthetic tests cannot authorize a family release. **FAMILY ALPHA HOLD #255 stays OPEN.**
