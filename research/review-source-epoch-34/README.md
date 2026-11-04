# REVIEW-SOURCE-EPOCH-34 — asynchronous source and save isolation

**Research only. Source parent:** verified [SCENE-CLASS-TRUST-32 PR #589](https://github.com/nickhaney916-lang/Closet-Current/pull/589) exact commit `79e957719bd90f7f1cd1ae71ec4bde5ff14ae93c`. Family Alpha [Issue #255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) stays HOLD. Never merge or deploy. Production and hosted staging remain unchanged.

## Real source audit: race conditions

Before this priority, `startFile` used a shared `canceled` boolean to guard async `makeProof(file)` and image decode. A second photo selection called `revoke()` **then reset canceled to false**, allowing a *stale first photo* completion to re-enter the same owner's current review. The stale source could replace the newer chosen photo. The `crop` callback checked only owner identity, not exact photograph or review attempt. The atomic group `commit` waited on an async IndexedDB read **before setting submitting=true**; a cancel or second source could change state during the preflight read. The subsequent save read mutable `state.proof`, risking old garments getting associated with a different source.

## Narrow research implementation

All review attempts are bound to an existing monotonic `renderVersion` epoch, exact selected state object and owner-local DB name. Every `revoke`, source switch, cancel and pagehide increments the epoch. A stale proof, decode, model worker completion or crop callback cannot overwrite the current review. Crop save additionally requires that the original piece still exists in that source's piece array.

The owner-private atomic save path now takes an immutable snapshot of selected human-confirmed garment records and original proof before the first await, acquires the submission lock **before** IDB preflight, and checks the exact source epoch after the preflight and inside the queued atomic save callback. The transaction's `currentOwner` guard treats a canceled/replaced source as invalid, not only a different owner. Editing, remove, add, and classification controls are disabled while a batch is committing. After a successful commit, selected items are removed from the review before any downstream UI refresh, preventing duplicate click-to-save after a display failure.

This changes only the research native review UI. No source JPEG bytes, segmentation model, original SHA, private account schema, cloud service, 3D garment or deployment setup is modified. A durable IDB transaction cannot be retroactively undone if a page closes after its commit; the code does not claim otherwise.

## Exact acceptance

Use synthetic source-locked locally generated JPEGs A/B/C, real native IndexedDB, and the **actual review UI** with a deliberately fake worker (the model is NOT tested here). In genuine Chromium and WebKit at 320/390/430 viewport widths:

1. Start importing A then B; resolve B before A. Ensure B stays displayed and no A worker proposal can appear.
2. Open B crop editor, switch to C on the same account, then invoke the delayed B editor callback. It must throw/reject without changing C.
3. Explicitly classify C and click Save, then cancel while IDB preflight is still outstanding. Verify no record was written or callback triggered.
4. Select B again; deliberately choose category/type/color and confirm. Verify an actual owner-private IndexedDB record preserves B's exact SHA and original JPEG and remains photo-only/non-3D-ready.
5. Verify source and screenshot SHA, browser no external writes, no gallery access, no model-driven automatic save. Six screenshots. Run app build plus every existing and new Node regression test and dedicated allowlisted no-deploy GitHub Actions.

**Scope limits:** No genuine SegFormer accuracy study (owned by Parallel Chat #27), no live hosted two-account verification, no physical iPhone/Android testing, no release approval. Passing this is a race-safety UI/data-integrity improvement only; Family Alpha HOLD.
