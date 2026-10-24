# Assignment #21 — Clothing recognition reliability and safe recovery

**Status:** isolated Family Alpha candidate, not integrated/deployed. Base: draft PR #279 exact commit `5ef76452649b016ba76fef42ec05a9d19108173d`, which itself stacks on recognition safety PR #234. Related independent mobile preview PR #275 is untouched. Issue #255 remains an explicit release HOLD.

## Reproduced code-path defects

1. `localRequest` accepted an arbitrary non-error worker message as a completed job. A malformed or mismatched `ready` response could be treated as a classification result, producing a downstream exception or confusing scan failure.
2. All worker `error` messages invalidated `localReady`; a per-photo JPEG decode error could poison the whole remaining automatic scan batch through `recognitionUnavailable`, forcing healthy photos to wait for explicit Retry and reload the scanner.
3. A non-object worker message threw out of the `onmessage` handler instead of rejecting pending requests immediately. A later watchdog timeout might eventually recover, but the user received delayed feedback.

## Isolated improvements

- Enforce **exact response type** by request: `load` must receive `ready`, `classify/features` must receive `result`. `identified` remains intermediate only. Malformed/unexpected responses fail closed, terminate the worker and reject all pending promises; no photo is removed or saved.
- Treat **only an explicit worker error code `image` on a non-load request** as a recoverable *per-photo* failure. Preserve the loaded scanner for other photos; keep the failed original in review with an actionable message for the user to retry/adjust.
- Keep runtime, memory, network, unknown, setup, and actual timeout failures fail-closed. The existing 60-second request/5-minute setup watchdog and explicit Retry remain unchanged.
- Preserve all existing source identity, user-edit, original-RGB, mask, duplicate and atomic IndexedDB gates from PRs #234/#279. No algorithm thresholds, photos, vector assets, training model, Auth, cloud or staging changes.
- Worker restarts have generation guard already in app; synthetic tests assert late events from terminated workers cannot settle a fresh request.

## Automated verification

`tests/assignment21-recognition-recovery.test.mjs` executes **actual extracted production functions** `stopRecognitionWorker`, `localRequest`, and `recognizeItem` inside a controlled Node VM. The fixtures use only synthetic JPEG identifiers, fake workers, deterministic watchdog timers, and stubbed IndexedDB/save. Cases include correct acknowledgment, isolated image errors, fatal errors, invalid/mismatched protocol, malformed payload, intermediate messages, timeout and fresh retry after stale reply, per-image batch resilience, preserved manual correction and duplicate removal.

Run:
```sh
node --test tests/assignment21-recognition-recovery.test.mjs tests/recognition-review-clearance-gate.test.mjs
node --test tests/*.test.cjs tests/*.test.mjs tests/avatar/*.test.mjs
node scripts/build.mjs
```

The attached no-deploy Actions workflow runs these suites on the branch. **Do not claim test pass or release readiness until the workflow completes.** Synthetic results do not measure real-photo accuracy, heavy-model inference on phones, or 4-account live Auth/storage behavior.

## Remaining issues and integration instructions

- Stacked draft PR depends on PR #279; integrate only these small controller error-handling changes into the main Family Alpha branch after independent review. Do not replace newer app, Auth, Supabase, Cloudflare, or preview controller code.
- Verify real offline Android/iPhone interrupted import and recoverable invalid JPEG, worker memory failure, model download timeout, and 15–20 garment batches. Browser/physical-device coverage in other PRs is complementary, not proof this new worker change works on devices.
- Failures and original source preservation should be monitored in synthetic telemetry, without uploading photos.
- Main Closet Current conversation controls merge, staging and Family Alpha release decisions; no merges, deploys, paid AI, spending, customer photos, or Drive Duel changes in this assignment.
