# Mission 3 — Full pending-review CAS before automatic closet indexing

**HOLD #255 active.** Research-only branch, stacked on verified [PR #1013](https://github.com/nickhaney916-lang/Closet-Current/pull/1013) exact parent `169d549263c8602bd97136d3cb5fc48fb850588c`. No merge, deployment, hosted account, or private wardrobe modifications.

## Source-verified failure mode
At recognition start, `recognizeItem` already clones its initiating pending draft. The `saveIndexed` native IndexedDB transaction previously validated image/source SHA, ID, ownership, outfit source ID, and flags `userAdjusted`, `requiresOwnershipConfirmation`, and `colorSource==='user'`. It **did not** compare the entire persisted row against the initiating snapshot. Another same-owner tab can edit a field such as `notes` or `size` without changing those flags; stale automatic classification could create a saved wardrobe item using the previous version and atomically remove the newer pending review record. It was a real code-path risk, not a claim of observed user loss.

## Strict same-row correction
- `recognizeItem` passes its frozen `expectedDraftForRecognition` into `saveIndexed`, before the async photo check and AI inference.
- During the same `items+state` read/write transaction, after locating the matching pending row, compare the **entire normalized persisted row** to that immutable initial snapshot with the existing canonical normalization semantics. Any missing snapshot or changed field aborts the complete transaction; no partial saved insert, no draft deletion, no automatic merge.
- Keep the independent original JPEG/SHA and owner/session/source guards, saved-ID collision protection, and successful auto-save path.
- A stale same-owner change returns non-success with a message to refresh Photo results rather than overwriting the newer editor changes. The older tab must not retry a stale result on its own.

## Reproducible evidence
Added tests in `tests/mission3-pending-capture-status-cas.test.cjs` compile **the live `saveIndexed` and `recognizeItem` implementations**, and use two independent owner DB handles with native-like `fake-indexeddb` transactions and synthetic JPEGs. Cover: (1) valid unchanged starting review saves exactly one item and leaves second-tab photo; (2) concurrent edited `notes` and `size` without `userAdjusted` or user color provenance blocks stale auto-index and preserves both originals; (3) missing expected snapshot fails closed; (4) source assertion prevents regression. No human labels or recognition accuracy claimed.

## Evidence status
The exact-parent no-deploy workflow on this new branch runs targeted source tests, full Node regression, native Chromium/WebKit at mobile CSS widths, and disposable PostgreSQL two-signed-owner tests. **Do not claim success until the exact final SHA has green jobs and test counts have been inspected.**

## Unchanged release blockers
Independent genuine clothing-photo ground truth and subtype accuracy; physical Android Chrome and iPhone Safari; authorized hosted two-owner cloud Auth/Storage/backup/revocation; photo-derived 3D garment fit; complete Missions 1/2/3 end-to-end integration and owner approval. Keep Family Alpha HOLD #255 open.
