# Closet Current — owner-bound private cloud recovery

**20 October 2026.** Independent main-chat priority based on draft PR #88. This code is **not merged, deployed, or authorized for customer production**.

## Customer concern

A wardrobe is private to a single authenticated account. The prior cloud client checked `window.closetAuth.user.id` before obtaining a token, but could continue after async token resolution, cloud GET, photo retrieval, IndexedDB transactions or remote save acknowledgments. A page-session change in the middle of those operations could allow an old response to affect current account UI, storage or sync status. Normal logout reloads the app, but this is insufficient to prove there is no late-callback race.

## Fix and scope

- Each cloud sync operation now carries an immutable account ID, IndexedDB handle, and generation identifier. Every remote operation checks that identity immediately before network access and after awaited responses.
- A token resolving from a previous login cannot start a new cloud request; a late remote response cannot restore or mark the new account's closet as synced.
- On every new cloud start, pagehide or BFCache pageshow, outstanding ownership generations are invalidated, scheduled old retries are canceled, and a new sync may begin without waiting for the old one.
- Cloud photo upload, path validation and decode use the pinned owner. Cloud restoration performs an additional owner check within IndexedDB's delayed `get('cloud-sync').onsuccess`, directly before replacing any records.
- The old sync's `finally` cannot clear the new sync's in-progress marker. Interrupted restores leave the next account and its photos intact.
- Local writes continue to set pending backup revisions in the correctly pinned user's database; a superseded request cannot falsely clear a pending backup.
- Customer features, original-before-masking garment recognition, cloud photo integrity hashes, color review, optional styling, and photo-resolution changes from #88 remain unmodified.

## Test coverage

- Node VM tests deliberately suspend authentication token resolution, return an old cloud result after switching users, and dispatch pagehide during an outstanding request. Assertions cover network owner Authorization, no old-owner network requests after token switch, no replacement of another IndexedDB closet, and no old pending marker.
- Chromium and WebKit 390-pixel emulated-mobile browser tests exercise the **real browser IndexedDB transaction API** against local authenticated mock cloud responses. Both require a fresh B wardrobe to restore while A's GET is held, then verify A's delayed response is ignored.
- Full application build and Node regression suite, auth and owned-only outfit styling across simulated mobile browsers, original-photo human-review provenance gate and zero-paid-production release veto remain mandatory in the dedicated workflow: `.github/workflows/cloud-owner-session-qa.yml`.

## Release blockers

This is a software race fix, **not proof of deployed Supabase RLS ownership**, real signup SMTP, Android/iPhone device data restoration, cloud bucket lifecycle/deletion or physical-phone clarity. It does not prove two approved human masks or commercially licensed production figures. Check the exact-head workflow status and acquire human/device evidence before authorizing a release. No merge, production deployment, paid services or Drive Duel modifications.
