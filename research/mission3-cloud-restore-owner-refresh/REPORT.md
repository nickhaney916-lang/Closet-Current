# Closet Current — Mission 3 cloud restore owner/session refresh (HOLD)

**Parent:** verified Mission 3 PR #931 exact HEAD `7ffbfefd0c3364b10e2676db00d024616e55adea`. All work is on an isolated draft stacked branch. No merge or deployment; no production or staging changes; Family Alpha HOLD #255 remains in force.

## Threat model and repair

1. **Legacy cloud restore reads and rendering:** `public/cloud-backup-bridge.js` previously captured no initiating authenticated owner/IndexedDB/session lease in its callback. When sign-out occurred during `readAll()`, `readDraft()`, `reloadCloudLooks()`, or `reloadCloudBoard()`, the continuation could use global `db`, `items`, `batch` and append old-account state to the next account's UI. The callback now captures its original owner, exact DB and epoch once, reads the original DB explicitly and rechecks after every awaited stage. Stale callbacks never render, refresh a new owner's index, queue old recognition, or show the new owner an old error.
2. **Inspirations and saved outfit board:** `public/trends.js` and `public/outfit-board.js` now accept an optional restore lease and owner database. Both check the originating session after asynchronous reads and before publishing any UI or model state. Native lossless board loading is checked again after its awaited loader.
3. **Cloud queue, research atomic restore, owner-reviewed cloud:** cloud `capture`, `canRestore`, optional research module loading, and setup result binding are fenced by the original lease. The optional native atomic and owner-reviewed restore paths use the same owner-bound refresh callback.
4. **Read-only research limits:** feature gates and the existing cloud backup engine, auth service, signed Storage RLS, and release hold remain unchanged.

## Evidence

- `tests/mission3-cloud-restore-owner-lease.test.cjs` executes exact source-extracted app owner-lease, cloud bridge callbacks, and real look/board reload functions with deterministic suspension points. Covers each asynchronous stage, same-ID relogin, queued cloud capture, authorized success, stale cloud warning, and old owner startup.
- `scripts/test-mission3-cloud-restore-owner-browser.mjs` loads actual `public/index.html`, `app.js`, cloud bridge, native IndexedDB and outfit/inspiration UI in real Chromium and WebKit at CSS widths 320/390/430. Synthetic A/B sign-in identities; outbound external HTTP calls are blocked; no physical camera, hosted cloud or real photographs are used.
- Strict no-deploy GitHub Actions requires exact `7ffbfefd...` ancestor, **seven** permitted paths only, source syntax, new tests, full serial Node tests, inherited crop/import/native private browser integrations, disposable signed-owner PostgreSQL Storage RLS, app build and receipts. Do not claim passing until exact final HEAD CI succeeds.

## Remaining release gates

Physically test Android Chrome and iPhone Safari. Hosted two-owner Supabase acceptance requires explicit authorization. Real-photo independently labeled recognition and photorealistic photo-to-3D dress/cloth fitting require independent sign-off. Family Alpha HOLD #255 remains active. Legacy same-owner JSON clothes/looks/board import is still not fully atomic; this change addresses stale-session identity and UI safety only.
