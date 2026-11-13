# Mission 1 P868 — No stale worker callbacks after a finished recognition request

**Family Alpha HOLD #255 OPEN. DRAFT / UNMERGED / UNDEPLOYED.**

**Pinned base:** Mission 1 P867 draft [#1041](https://github.com/nickhaney916-lang/Closet-Current/pull/1041), exact commit `8e56a4298a995492c04e1f1b028fb9e6f329c396`. Parallel #83 exclusively investigates genuine continuous WebKit dual-model crashes; this patch does **not** fix or characterize that crash.

## Source-verified failure window
`browserRequest82()` already closes its Promise on cancellation, timeout, worker errors and successful results, but the previously registered `worker.onmessage` callback does not check `finished`. A queued/captured late worker event can still call `onProgress` after cancellation or timeout, or unnecessarily attempt to validate stale results. If `terminate()` itself throws, event handlers remain attached with access to captured request details.

## Conservative change
- Terminal `end()` detaches worker message/error handlers before attempting best-effort terminate, even when termination throws.
- Every worker message checks `finished` *before* invoking owner progress or performing response validation. Stale requests are inert and never authorize automatic saving.
- No request, inference, model, original-photo, session, recognition thresholds, default opt-in, schema, cloud, outfit, or production code changed.

## Tests and limitations
Synthetic source-running Worker regressions cover aborted requests followed by deliberately delivered late progress/result/error, immediate next-request capacity, timer expiration and a throwing terminate, and the existing review-first HOLD evaluator. This is deterministic JavaScript behavior, **not** genuine WebKit crash recovery, physical phone testing, or recognition accuracy validation.

New scope-locked no-deploy workflow re-runs full native Node suite, both builds, inherited original-JPEG IndexedDB Chromium/WebKit browser checks, dual policy tests and shoe pairing. Actual result and exact HEAD must be checked from GitHub Actions before claiming a pass.

The 48 public development-photo result from donor #82 / P866 remains *historical* and does not establish 10/10 independent human-labelled accuracy. **No release or Family Alpha promotion.**
