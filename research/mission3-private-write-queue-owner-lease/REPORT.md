# Mission 3 — signed owner queued mutation and cloud notification isolation (HOLD)

**Stacked on exact verified Mission 3 PR #943 head** `50256a76494feaa38a91149ea12ab25014979292`. Research branch only. No production, staging, hosted Supabase or family wardrobes changed. **Family Alpha HOLD #255 remains active.**

## Discovered asynchronous session bug

The shared `queued(work)` captured neither the signed owner nor the originating private IndexedDB connection at call time. A wardrobe save enqueued behind an earlier pending device/cloud operation could begin its `window.closetCloud.beforeWrite(db)` preflight after logout and login to another owner because the globally mutable `db` was used. The inner save's own owner lease could reject its subsequent transaction but could not undo a cloud dirty-marker already written to the next owner's account.

Two post-completion callbacks, `closetCloud.changed()` and `closetIndex02.refresh()`, also referenced globally active owner services after asynchronous completion. Former-session success could wrongly tell a new owner their cloud had unsynced changes or refresh the next owner's wardrobe index. An abandoned account A queue tail could block account B's queued saves, even though the accounts have disjoint private databases.

## Implemented

- Capture exact `window.closetAuth` object, user ID, IndexedDB connection and account-logout epoch synchronously at `queued(work)` submission. Verify the lease before `beforeWrite`, after that await and after the actual work promise. A revoked task cannot start work or signal success in the new account.
- Pass the captured original owner connection, not mutable global `db`, to cloud preflight. Prevent old quota-error notifications, dirty status and index refresh from repainting the subsequent owner. Valid current-owner successes still notify normally.
- Reset shared queue tail on the existing authenticated session-locked event. A blocked old owner request cannot stall a new owner's private save, and old closures remain fenced by their captured lease. Existing database commit guards and per-row optimistic compare-and-swap are unchanged.
- Preserve cloud sync's revision and RLS checks; this milestone does NOT bypass owner-reviewed cloud recovery or activate any research-only importer by default.

## Reproducible verification

`tests/mission3-private-write-queue-owner-lease.test.cjs` executes the **exact production `queued()` and auth lock callback source**, with deterministic deferred cloud preflight, stale queued writes behind earlier operations, quota errors and same-ID relogin. It checks that only the current owner gets cloud changed/index notifications and that account B's save is never blocked by a former A pending cloud request.

`scripts/test-mission3-private-write-queue-owner-browser.mjs` boots the real application in mobile Chromium and WebKit at 320/390/430 widths with **native IndexedDB** and synthetic authenticated A/B accounts, original SHA-stamped synthetic JPEG records, and no external writes. It holds A's actual queue preflight, signs into B, saves to B's native database, then releases A; confirms old A never committed to either wardrobe or sent B cloud/index events. It repeats with same-ID re-login, verifies B's continued local database state and captures screenshots plus SHA receipts. The test is synthetic, not a physical Android/iOS/hosted cloud sign-off.

The dedicated CI requires exact parent ancestry, five-file allowlist, source-based unit tests, full serial Node regression, six new mobile browser cases, inherited native-original/crop/cloud/edit/atomic import/video draft browser suites and disposable PostgreSQL two-account Storage RLS checks. **Only the final verified exact-head CI may justify a passing engineering milestone.**

## Still required for release and Mission 3 sign-off

Physical Android Chrome/iPhone Safari camera/background testing; authorized hosted Supabase Auth+Storage two-account backup/restore; controlled integration of parallel recognition/3D workstreams with real clothing photo evidence, final owner UX acceptance and release approval. **Do not merge, deploy or lift HOLD #255.**
