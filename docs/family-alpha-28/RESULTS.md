# Assignment 28 — mobile storage/performance investigation

October 26, 2026 · #255 · **Family Alpha HOLD**

QA branch based on main `39deed987afe2e5668d64e145835ad43ad14c7be`. Reviewed PR #316's pinned recognition baseline, #313's staging Auth scope and #315's acceptance deliverable. No changes to their files, public app source, generated deployment packages, accounts, services or production. This is an independently reviewable **offline storage candidate**, not an integrated or deployed fix.

## Finding and safe candidate

The actual pinned original-photo app at `795ad6637f8d4f782bc99751211b25e8e72a3a7d` has `writeAll` and `savePiece` transactions whose operations can throw before completion handlers are attached. Rejecting the JavaScript promise does not itself abort a transaction. With a successful first put and a second synchronous exception, an earlier item can commit even though the user sees failure. For `savePiece`, item and draft can diverge. This is a synthetic reproduction, not a reported family data-loss incident or server isolation breach.

`abortSynchronousWriteFailure()` changes only those two extracted transaction blocks, attaches handlers before writes and explicitly aborts on synchronous exceptions. It preserves the existing queue, stillCurrent/account preflight, nextBatch callback, object stores and all payloads. It refuses unknown transaction operations and repeat application. It does not delete, resize or replace originals. It is not automatically applied to an app build; main thread must integrate/review against its exact candidate and rerun the existing original-photo/avatar suite.

| Synthetic recovery check | Baseline | Offline candidate |
| --- | --- | --- |
| Second bulk put throws injected synchronous QuotaExceededError | Promise rejects, first row still commits | Promise rejects, zero partial rows |
| Item put succeeds, draft put throws same injected fault | Item row commits despite failed save | Both aborted, zero partial rows |
| Actual fake-indexeddb DataCloneError on non-cloneable second row | First row commits | Entire transaction aborted |
| Retry after failure | Queue resumes | Queue resumes |
| 20 rapid queued saves; corrected metadata/source string hashes | Not separately repeated as rapid scenario | All 20 retained |
| Throwing nextBatch callback | Not separately executed on baseline | No partial item row |
| Existing stillCurrent=false guard | Source retained | Rejects before writing |
| Previously committed data after explicit abort | Retained | Retained |
| Same fake-indexeddb factory connection close/reopen | Retained | Retained |

Synchronous quota injection tests a failure-handling branch. Browser quota errors may instead arrive asynchronously and abort natively. fake-indexeddb is not real browser storage, actual disk pressure, eviction, crash durability, browser refresh/restart or cloud recovery proof. No authentication or backend is involved; account isolation is not certified by this test.

## Measured baseline and candidate

`results.json` records all samples, runtime and source hash. Node v24.22.1/Linux, fake-indexeddb 6.2.4; actual extracted app functions run in VM with the queue dependency modeled locally. 20 synthetic garments each carry a roughly 1 MiB image string in both image and originalPhoto plus fixed corrections. These are deliberately large string payloads, **not decodable JPEGs**, high-resolution processing or recognition accuracy tests. No private photographs used. Three baseline samples precede three candidate samples, in a shared process without forced GC: warmup/order effects apply.

| Local workload | Baseline | Candidate |
| --- | --- | --- |
| Write + read 20 records, samples (ms) | 75.29 / 54.61 / 31.11 | 34.10 / 39.84 / 39.36 |
| Median (ms) | 54.61 | 39.36 |
| Node heap delta range (bytes) | 41,986,440–122,555,176 | -19,688–42,001,864 |

**No speed or memory improvement is established.** Small samples and GC/warmup can explain differences; negative heap delta is collection, not memory savings. This change addresses atomic failure recovery. No target latency or phone-memory budget was invented.

A separate synthetic clone+JSON workload over growing batches 1..20 serialized **440,435,495 characters**, taking **1462.11 ms** locally. This estimates payload amplification from whole-batch snapshots; it is not an instrumented app measurement or browser memory peak and includes JSON serialization overhead absent from persistDraft. `persistDraft` repeatedly clones the full batch, so this is a future profiling lead. Coalescing/delaying drafts could lose the last capture on interruption; no such optimization was made without durability evidence.

## Existing safeguards reused

Existing code already shares `localLoadPromise`, processes imported photos sequentially, revokes importer/video object URLs in finally blocks, and stops camera tracks/timers. Existing Node tests for capture cleanup, photo resolution, import partial failure, failed recognition/save recovery and worker lifecycle were run unchanged in the main-based suite. Recognition accuracy, worker initialization protocol, cropping and avatar code were not modified. This is separate from #315's acceptance checklist.

## What was actually run

- `node scripts/build.mjs`: PASS, local output only.
- `node --test tests/*.cjs tests/*.mjs`: **255 PASS / 0 FAIL** (main's suite plus two new source-overlay tests; excludes #315's five tests on its separate branch).
- Storage harness: PASS for assertions documented above, raw baseline/candidate data in results.json.
- Chromium/WebKit: **NOT TESTED**. Bundled Playwright resolved but neither browser executable was installed. Installation attempt received invalid/truncated Chromium archives and failed; no working browser runtime was obtained.
- Initial app load, first model download/init/inference, actual 20 high-resolution photos, wardrobe ↔ builder timing, browser/GPU memory, Android/iPhone layout/performance: **NOT TESTED**.
- Interrupted recognition with uncommitted originals, real refresh/restart, asynchronous disk quota, storage eviction, offline↔online/cloud restore: **NOT TESTED by this harness**. Do not substitute an in-memory connection reopen or source-level unit test for these checks.

## Reproduce

No API keys, account or provider settings required. Install one test-only dependency outside the repo:

```bash
npm install --prefix /tmp/cc28-deps --no-package-lock --ignore-scripts fake-indexeddb@6.2.4
git fetch origin 795ad6637f8d4f782bc99751211b25e8e72a3a7d
CC28_IDB_MODULE=/tmp/cc28-deps/node_modules/fake-indexeddb/build/esm/index.js node scripts/run-family-alpha-28-storage.mjs
node scripts/build.mjs
node --test tests/*.cjs tests/*.mjs
```

Optionally set CC28_REPORT to an output JSON path. No benchmark threshold is enforced; integrity assertions are enforced. Raw measurements vary by host. Source extraction is pinned; never silently substitute another branch.

## Integration handoff / remaining blockers

Main thread should apply the narrow candidate only after checking its exact compiled writeAll/savePiece source and rerun #316's existing combined original-photo, queued draft, backup and avatar checks. Full compiled artifact tests were not executed here. Verify real Chromium/WebKit IndexedDB sync exceptions and async quota handling, then actual Android/iPhone 15–20 garment workloads with cold/warm model/cache timings. Capture per-operation durations, browser version/build, heap where available and persisted source hashes; avoid screenshots/exports containing personal data. Keep originals at existing quality. Follow #315 for adult isolation before children and #255 for invitation/release approval. **No merge or deployment is authorized by this report.**
