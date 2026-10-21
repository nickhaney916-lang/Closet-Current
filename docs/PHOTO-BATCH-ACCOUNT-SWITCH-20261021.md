# Fail-closed multi-photo import across customer account switch

**October 21, 2026 — isolated development fix stacked on verified draft PR #133. Nothing merged or deployed.**

## Reproduced exposure

The camera-roll import handler did not capture an owner identity when initiating a batch and handed every newly decoded image to the customer closet's `candidate()`. Phone JPEG/HEIC decoding may take seconds per image. If a user logs out and another customer logs in during the asynchronous decoding, a late photo can be queued into the newly signed-in person's review flow. The raw `window.__lastPhotoImportResult` diagnostic may also continue showing results from an earlier customer's batch.

## Scoped fix

- Capture the current account ID **before** starting a multi-photo import. Do not start at all if there is no signed-in user.
- The existing `readPhotoBatch()` is now optionally provided an `isCurrent` callback. It checks that callback before every file, **immediately after every awaited photo decode, before `onPhoto` can save an image**, and after the callback returns. Cancellation stops the remaining batch rather than continuing with another user's files. Existing three-argument callers remain compatible.
- Once an owner change is detected, the import handler does not open the new user's review view; it displays a simple account-changed message, clears potentially identifying stale batch diagnostics and restores controls. Already completed original-owner photos remain eligible for existing draft/session recovery logic.
- Original high-res `photoToJPEG` code and image orientation, color budget, category/classifier before mask, photo recognition, cloud owner isolation, login and user backups are unchanged. Existing developer-only `importFilename` metadata remains for source-locked real-photo diagnostic tooling; this ticket does not redesign backup record privacy or change the Work #134 backup assignment.

## Verification

Node regression verifies multi-file success, logout before decode, account change during a later frame decode, decoder error after logout, unsigned user, stale diagnostic clearing and optional callback compatibility. Synthetic Android Chromium/iPhone WebKit tests decode a real generated 4032×3024 JPEG into the existing 3072×2304 maximum source and then simulate delayed account-switch completion. Those fixtures **cannot establish real two-user Supabase isolation, real device permissions, network/decode performance, or true garment recognition accuracy.**

Static scope guard ensures full exact application and importer Git blob hashes plus byte-exact app exclusion of this one modified handler and unchanged import conversion function. No paid AI, production changes, live customer accounts, Drive Duel or parallel Work project changes.
