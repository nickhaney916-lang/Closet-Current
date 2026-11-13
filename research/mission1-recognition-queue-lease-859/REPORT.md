# Mission 1 P859 — exact draft-owned recognition queue leases, no pending-state theft

**FAMILY ALPHA HOLD #255 OPEN — MISSION 1 RELEASE NO-GO.** Research DRAFT, unmerged, undeployed. No production/staging, hosted Supabase, private owners/wardrobes/photos, protected main, or other mission/parallel branches changed.

## Verified parent and defect

Parent [P858 Draft PR #1004](https://github.com/nickhaney916-lang/Closet-Current/pull/1004) exact verified commit `cf55fa8c712b8034bfa4424dce64920e8ebce6ab`, [no-deploy #43441891483](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43441891483), 4/4 jobs SUCCESS, 519/519 native; real three publicly exposed development-photo FashionCLIP worker and dim/crop; 54/54 real-photo desktop quality guard cases; 6/6 owner panel cases; current signed-source scanner lease and strict independent human annotations. All are software/policy evidence, not independently human-labeled real-world accuracy.

Source inspection found an **actual same-ID scanner-lifecycle race**, distinct from the P854 owner/source safety protections:
1. The scanner's `finally` cleared `localPending.delete(item.id)` and `recognitionState.activeId` whenever signed owner matched, even if its original draft object had been replaced by a new same-owner same-ID draft in a newer queued scan. The old result did **not** overwrite the changed photograph thanks to P854's `live854`, but it could release the *new* pending marker prematurely.
2. `drainAutomatic()` admitted an old queued item using `batch.some(x=>x.id===item.id)` instead of object identity. A replacement with the same ID made the old queued item pass that outer test, but the inner scanner's exact draft identity check returned **before its try/finally**, leaving the pending state stranded.
3. A crop/source revision of the same pending object could invalidate the old job without arranging a fresh scan. This is primarily a reliability and misleading-status problem, not a previously proven privacy breach or model error.

## Implementation

- Only `public/app.js` runtime modified, preserving default opt-in-disabled recognition model, P858 early quality preflight, taxonomy, source JPEG, masking, private store schema, P854 original/photo/mask/signed-account lease and owner-confirmation requirements.
- `pendingScanLease859` is an **in-memory map** from item ID to one exact queued draft object, signed-owner reference, connection reference. It never goes into persisted wardrobe state. Queuing the same object twice refuses duplication; queuing a same-ID replacement supersedes the old lease, but not a still-current distinct item.
- `drainAutomatic` only recognizes the exact leased object, skips superseded FIFO entries, and clears a pending marker only if that exact lease remains current. An old queued or owner/DB-invalid source can never clear its successor. An unreviewed replacement is safely requeued after the old stale job exits.
- `recognizeItem` captures the immutable *lease object identity* at start; a stale same-ID job may still return false under P854, but only its own current lease can clear the pending/active state or persist draft snapshots. On a changed same-owner source it queues fresh analysis only when the draft is still unreviewed/unanalyzed; it does not overwrite user-reviewed fields.
- If signed owner/DB changes while an asynchronous model request is pending, P854 still prevents old-owner writes; P859 only cleans abandoned queue state without writing to the new owner's private store.

## Reproducible adversarial engineering acceptance

After the first P859 full-suite attempt, 29 older source-executed tests failed because their synthetic VM harness omitted the new app-wide `pendingScanLease859` map (`ReferenceError`). All six new P859 overlapping worker/owner/source tests passed. **Only `tests/automatic-indexing.test.cjs` synthetic fixture** was updated to provide this map and a fake test user without a browser document, rather than adding a permissive real-app fallback. Fresh exact-head CI is required before claiming the full inherited suite green.

New `tests/mission1-recognition-queue-lease-859.test.cjs` extracts and **executes the actual app's queue functions and scanner** using synthetic original JPEG strings, worker-deferred requests, owner objects and database connections. It checks:
- overlapping same-owner same-ID old and new photo scans (old worker resolution must not clear new pending/active ID or persist);
- same-owner replacement after old scan started but *without* user manually rescheduling (new scan automatically runs);
- old queued object replaced before FIFO execution (only current object's source checked);
- cross-owner same-ID old worker resolution (no old owner persistence/new pending theft);
- in-place photo recrop/source change during worker in-flight (old result discarded; revised source scanned);
- unchanged review-first owner confirmation, private lease, optional subtype save gate and footwear physical-pair/consent.

All tests are **synthetic behavior assertions**, not actual clothing subtype accuracy. Both unchanged research app builds, entire inherited native suite, actual desktop Chromium/WebKit owners/pairs/color/duplicate/save/quality tests, lawful existing public original bytes and P851 `BLOCKED` release gate are required in exact-head CI.

## Scientific acceptance and release policy

The historical 32-public-photo default-path benchmark still reports **10 legacy subtype/automatic-indexing failures across five boot sources**: `Shoes/Unknown` rather than historical development-exposed `Ankle boots`. This P859 queue-lifecycle patch does not alter model weights, taxonomy, default recognition or baseline. The independent P75/P79 genuine human source-disjoint double-reviewer labels/masks remain unavailable. **Independent actual subtype accuracy UNKNOWN**, no claim of 10/10, no physical Android Chrome/iPhone Safari acceptance, and no authorized hosted signed-two-owner RLS/restore/revocation validation. [Family Alpha HOLD #255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) remains OPEN. Do not merge/deploy or invite family pilot.

Final exact-head evidence belongs in P859 draft PR after CI, not inferred from earlier P858.
