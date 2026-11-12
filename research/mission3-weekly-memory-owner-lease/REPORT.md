# Mission 3 — Owner-Private Weekly Clothing Memory Refresh Safety

**Status:** isolated research implementation; Family Alpha HOLD #255; no merge/deployment.

## Immutable compatibility baseline
Exact previous Mission 3 checkpoint is PR #894 HEAD `52a45375528e18050333ece2e4936d6f7f5f6c20`, 2/2 green GitHub Actions jobs and 1,545/1,545 serial Node tests, local signed disposable PostgreSQL 17 security checks, Chromium/WebKit at 320/390/430 pixels.

## Verified source weakness requiring regression
The scheduled weekly clothing-memory refresh selects old owner `items` then awaits model loading and feature computation. On account switch, the old promise can later run `items.find(target.id)` against the next owner's roster, even if both owners legitimately imported the same item ID/JPEG. `saveMemoryReview()` uses the current mutable global `db` inside its asynchronously queued transaction and validates only image equality. Old callback completion can therefore write owner-A model-derived metadata into owner-B's private record or overwrite new owner scanner state. Timers and `memoryReviewRunning` were not reset at logout; old finalizers can release the new owner's running state.

## Narrow source changes
- Cancel pending weekly timer and reset its running state at session lock.
- A single owner lease binds the initiating `captureOperationEpoch`, signed owner ID, and exact owner-private IndexedDB handle, including same-ID re-login revocation.
- Scheduled timer callbacks verify token + lease before clearing their shared timer slot or starting recognition.
- Weekly worker reads, their model-result handling and all finally callbacks verify the same lease.
- `saveMemoryReview` freezes its starting owner/DB, rejects stale queued work before opening a transaction, aborts a changed-owner transaction before `put`, and returns null instead of updating state on revocation.
- Existing same-owner source photo, confirmed category/color, and owner review semantics remain unchanged.

## Testing
Six source-extracted actual-code tests cover: queued prior-owner write into a new account with identical ID/JPEG; revocation during an IDB request; current-owner edit preservation; delayed weekly model result; delayed model initialization; old timer firing after next owner scheduled a timer. They run against both immutable baseline (known bad reproduction) and patched source (safe behavior).

The inherited `clothing-memory.test.cjs`, `mission3-capture-operation-epoch.test.cjs` and `mission3-recognition-session-epoch.test.cjs` restricted VM fixtures were aligned with current controller state, without changing their assertions. A dedicated exact-parent, strict-scope NO DEPLOY GitHub Actions workflow executes those tests plus the complete signed local PostgreSQL, Chromium/WebKit synthetic mobile and serial Node suite.

**Verification status:** awaiting exact-head CI. Do not call the work accepted until both jobs pass.

## Explicit release restrictions
Draft only; unmerged, undeployed. Existing staging and production remain untouched. No Supabase migration, actual owner photo, hosted user session, email, or protected branch mutated. Physical Android Chrome and iPhone Safari tests, authorized hosted two-account Supabase, independently labeled real-image recognition, and realistic photo-to-3D integration remain separate release blockers.
