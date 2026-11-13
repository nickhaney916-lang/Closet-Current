# Mission 3 — fence asynchronous "Style My New Clothes" form submission to original owner and requested wardrobe

**Family Alpha HOLD #255 OPEN**. Isolated research stacked on [PR #1052](https://github.com/nickhaney916-lang/Closet-Current/pull/1052), exact green parent `c1f5155d78fed310873f8dbad89114a83db4d76e`. No merges, staging/production updates, hosted Supabase, actual owner wardrobes, private photographs or physical-device actions.

## Source-verified issue

The normal `public/closet-stylist.js` `styleCollectionForm.onsubmit` callback awaited `closetReady` and `refreshTrendLibrary(true)`, but then read the **globally active** `items` wardrobe and form fields, replaced global `styledCollectionResults`, rendered garment images and displayed status, and unconditionally re-enabled the current button. There were no signed-owner/session checks after these waits, no original wardrobe snapshot binding, and no protection from an older result completing after a newer user request. A pending owner A request could therefore render owner B's garments/results or modify the new account's status. The same-owner form could also publish combinations for preferences changed during the trend fetch. This is a source-observed potential race, not an observed personal-data incident.

## Implementation

- `beginOwnerStyledCollectionRequest()`: capture exact auth object, owner ID, private IndexedDB handle, capture operation epoch, **exact in-memory garment object references and order**, and occasion/audience/season/focus inputs.
- A monotonically increasing `styledCollectionRequestSerial` ensures that a replaced form request never publishes a result or clears a newer request's loading control.
- At each awaited boundary, after the pure style planner and after render, the handler must still own the same signed session, wardrobe snapshot, form inputs, and serial. Fail closed without UI updates otherwise. All current failures use a generic privacy-safe error string.
- Session lock and preference edits revoke prior requests, while letting the owner submit an updated request; finally only reenables the button if the initiating session and request still own it.
- Existing verified trend fetching, output count and styling semantics, original JPEGs, SHA-256, private IndexedDB, explicit review, outfit save controls, 2D original-photo preview and 3D gates remain in place. No changes to Cloud backup, production database, schemas, private accounts, 3D assets, or hosting.

## Reproducible acceptance tests

- `tests/mission3-stylist-submit-owner-request-lease.test.cjs` extracts and executes **actual source** in Node VM with synthetic owner accounts and photos. 18 cases cover ordinary generation, account switch/same-ID relogin while fetching trends, revoked auth, capture epoch rotation, same-ID item rehydration, added garment, changed focus/season, explicit preference supersession, safe failure messages, two overlapping requests, waiting for closet readiness, and wrong DB/gate.
- `scripts/test-mission3-stylist-submit-owner-request-browser.mjs` executes the production lease and form handler in Chromium and WebKit with 320/390/430 mobile-sized viewports. 14 modes × 6 browser/viewport combinations = **84 planned browser cases** using synthetic identities and no external network or hosted app. These are NOT physical Android/iPhone tests.
- Strict exact-parent **five-file** no-deploy GitHub Actions job with focused tests plus inherited real Chromium/WebKit full-app original-photo styling integration, synthetic two-owner PostgreSQL, full serial Node, storage/RLS, owner review and recovery tests.
- Verify the **final head** workflow results before claiming passed tests. Do not infer real-image recognition accuracy or genuine 3D reconstruction from synthetic pass counts.

## Next release blockers

Physical Android Chrome and iPhone Safari acceptance, authorized hosted private-cloud two-owner Auth/RLS/Storage backup/restore, safe real garment photo recognition and human review, Mission 2 photo-derived 3D fitting and drape, final independent end-to-end Missions 1/2/3 integration, explicit owner acceptance. Keep #255 OPEN.
