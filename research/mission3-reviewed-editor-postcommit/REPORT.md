# Mission 3 — reviewed-photo editor cannot acknowledge an old session after private save

**Family Alpha HOLD #255 OPEN. Draft research ONLY.** Stacked on verified Mission 3 [PR #1017](https://github.com/nickhaney916-lang/Closet-Current/pull/1017), exact parent `f0ba0265363a2f4efef9b8fac2e4201b11ae85f6`. No merge, deployments, hosting changes, private real accounts, or wardrobe uploads.

## Source-verified problem

The live `public/app.js` `adjustPhoto` editor starts a signed owner-private reviewed `PHOTO119` save through the existing durable `queued` wrapper. After that asynchronous commit, the earlier code reread the inserted garment through the **global** `db` pointer and then published into global `items`, `batch`, `render`, and `message` without rechecking the starting session/DB/epoch. An account switch or same-ID logout/relogin during the async commit could therefore direct an old editor at a newly active DB or publish an old save/failure warning in the next signed owner's UI. This is a source-level race risk, not evidence that a real user's photos were exposed.

The same open editor's `remove.onclick` and normal edited `savePiece` completions also updated global visual state after awaiting a mutation without an exact session fence. The on-close callback could retry an old garment if called during a session transition.

## Fix

- Introduce `photoEditorSessionLease` capturing the **exact** auth object, signed owner ID, IndexedDB handle, and `captureOperationEpoch` when Adjust opens. Its `assertCurrent` rechecks all four plus owner-private DB naming, with `current` for safe suppression of stale errors.
- Keep the existing atomic PHOTO119 owner's source JPEG/SHA, human confirmation and compare-and-swap guards. Pin its postcommit record read to `ownerDB`, not the global `db`. Assert the original session after the research module import, after the native save result, after the stored-item read, and after any outfit-index refresh **before** rendering or telling the owner that the save succeeded.
- Bind manual saved-item save and removal callbacks to the same original session, suppress old-session warnings on signout/relogin, and stop the old on-close editor from queuing recognition in a new session. No new server requests, new schema, auto-recognition changes, or automatic delete behavior.

## Test provenance

New `tests/mission3-reviewed-editor-postcommit-lease.test.cjs` extracts the live photo-editor implementation, replacing **only the module-loader expression** with a controlled test loader so the real editor callbacks can run in a synthetic UI. Cases cover a successful same-owner reviewed save, different-owner switch after atomic completion, same owner-ID re-login, old-owner failure suppression, current-owner failure warning, old-owner late removal, and runtime source assertions. The native reviewed database module is not replaced in the app and no real personal JPEGs are used.

**Validation is pending** until the exact final head's strict-parent NO DEPLOY workflow passes both jobs, including full serial Node suite and native Chromium/WebKit browser checks. Any failed CI attempt must be corrected and rerun, not counted as acceptance.

## Outstanding release blockers

Real physical Android Chrome and iPhone Safari, authorized hosted Supabase two-owner Auth/Storage/backup/revocation, independently labeled genuine clothing photos and 10/10 accuracy evidence, realistic photographed-to-3D garment fit, full Mission 1/2/3 release integration, explicit owner approval. Family Alpha HOLD #255 remains open.
