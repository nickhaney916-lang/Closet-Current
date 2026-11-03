# BOARD-LOSSLESS-02 — main-controller handoff / acceptance matrix

**Draft research, no production import, no deployment or merge. Family Alpha HOLD.**

Starting base is BOARD-PRESERVE-01 PR #551 exact SHA `0df63a6ce81506364b6f9a32b452bba178adae93`. The actual native `public/outfit-board-engine.js` blob SHA is `787df8a770d900b56aee25bb2987c420a5e11778`, unchanged here. Read-only references: AUTH-EPOCH-01 PR #550 SHA `58d2178820b8a949cb49715696cfc977f79b72ef`, E2E #547 `e3dce3658d570bc555e8027cc75c13793b857c7b`, original private authenticated 163-bone donor OUTFIT-3D-01 PR #541 `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`. Footwear #17 PR #549 is outside this assignment and not touched.

## Independently reproduced destructive path

The unchanged native `cleanOutfitBoard` discards jacket `layer2` and coat `layer3` if `top` is a dress; drops IDs of missing/recategorized clothing; strips `outfit3dId` and unknown compatible metadata. The original `public/outfit-board.js` uses that cleaner on read, render, reopen, import, and cloud board reload. A subsequent existing native save would write the truncated in-memory data to the original `state['outfit-board']`. **This main-app defect is NOT fixed or monkey-patched by this research branch.** It must be reviewed and integrated separately before enabling any consumer-facing editing.

## Research candidate, exact usage boundary

- `lossless-board.mjs`: retains the complete raw saved entry and unknown safe JSON fields, preserves all source garment IDs even when closet is missing or reclassified, and returns explicit MISSING/REVIEW flags. A recovered item only avoids review when the pinned original source ID/SHA is consistent; actual JPEG bytes are re-hashed before 3D preview. Nothing is written on read, open, cancel or preview. Dress plus independent approved jacket and coat slots are not cleared. Name, shoe swap, pin, legacy ID upgrade on **explicit** edit/save, save-as-new (without overwriting source), confirmed delete, maximum 50 outfits, future fields and correction history remain preserved. Native ID and PR541 `outfit3dId` aliases cannot collide across records.
- `existing-idb-cas.mjs`: only existing authenticated `closet-current-user-<owner>` IndexedDB `items` and `state` stores; refuses uninitialized accounts and stale owner-generation leases; reads originals with no migration. Explicit save is a single readwrite transaction that compares **whole stored board fingerprint** and **cloud-sync revision**, then writes the unnormalized board and increments `cloud-sync.localRevision` / marks `dirty` atomically. Conflicts/aborts preserve prior state; server writes and remote backups are not attempted. Cloud backend's distinct RLS and merge races remain separate gates.
- `native-research-panel.mjs`: mount only into the original app page with `?boardLossless02=research` and a valid native/auth-epoch adapter. Not imported by `public/index.html` or production code. Original garment photos display in 2D, including missing-piece labels. Buttons execute edit, save, save new, cancel, confirmation delete, and pin. PR541 compatibility uses source-honest donor decision only after hashing **actual full stored JPEG bytes**. A stored SHA claim alone cannot create a verified 3D garment.
- `tests/board-lossless-02.test.mjs`: exact original normalizer executed with `node:vm`, real fake IndexedDB transactional optimistic CAS; verifies old losses, two tabs, two owner epochs, cloud revision conflict, 50 limit, legacy records and aliases, backup validation, safe original bytes, and SHA-verified reattachment after authorized same-ID restoration.
- `scripts/test-board-lossless-02-browser.mjs`: original unchanged `public/index.html` + native cleaner in **real Chromium and WebKit**, mobile viewports 320/390/430, two separate synthetic owner-scoped IndexedDB accounts, actual original JPEG bytes with independently verified SHA. Tests saved/reopen/cancel/edit/new/delete UI, pin, missing garment, cross-owner refusal, native loss, PR541 exact donor source decision, browser session invalidation, and two live tabs CAS on Chromium. Target 72 actual PNG screenshots including 12 complete garment-source card detail views, plus 12 before/after native vs lossless contact strips. Every file must be independently hashed and validated by CI.
- Dedicated NO DEPLOY workflow checks scope against exact PR551, new+old native/cloud regressions, actual original-app browser assertions, screenshot hashes, and separately retests the unchanged exact PR541 **45 original WebGL scenes** in a temporary detached worktree. Donor scenes are NOT claimed as candidate-generated 3D screenshots.

## Restore/recovery and backward compatibility

A deleted saved garment leaves a MISSING placeholder with its original saved slot and ID, including pinned source SHA if recorded. Reinsert the same owner-owned garment ID from a verified backup and match its original JPEG SHA to reconnect. A changed JPEG SHA remains REVIEW with all other outfit slots unchanged, never an automatic new garment substitution. A legacy saved outfit without a pinned SHA may remain photo-only; same ID alone does not certify an authentic photograph. Source originals remain in `items` records, never copied into the board, and the original source bytes/owner private DB are not changed by reads.

Cloud `ClosetBackupEngine.validateDocument` accepts the lossless structure; cloud `mergeDocuments` keys saved looks by `id`, whereas the PR541 3D controller also uses `outfit3dId`. This candidate adds both IDs for newly saved/explicitly edited legacy records while preserving the existing identity of untouched records. **Old legacy records with no durable `id` and live remote `keepBothDocuments` conflicts remain a release blocker.** Native `boardBackup` uses in-memory native cleanup and native `importBoardBackup` normalizes again: never rely on that path for a production lossless restore without separate integration.

No DB schema migration occurs. Rollback plan for future integration: first capture the untouched current/saved raw state, cloud-sync marker, and immutable garment photos/SHAs within authenticated owner scope; implement an opt-in conversion behind a guarded branch; revalidate owner/epoch and conflicts before writes; on failed rollout restore previous raw state through an explicit owner-bound compare-and-swap after verifying its fingerprint and cloud revision. No automatic production migration or rollback executed in this branch.

## Evidence/acceptance matrix

| Requirement | Research criterion | Approval constraint |
|---|---|---|
| Native dress+coat/jacket loss | Assert unchanged native cleanup drops both; original raw snapshot retains both | Native production still **FAIL** until integrated |
| Deleted and recategorized items | IDs persist with MISSING/REVIEW and source hash metadata | No silent replacement; owner must choose |
| Durable native+3D IDs, future fields | Exact raw record round trip; no alias collisions | Typed legacy ID upgrades only on explicit save |
| Edit/name/shoes/pin/save same/new/cancel/delete | User button and unit scenarios, re-read after reload | Never silently write on display |
| Competing browser tabs | Actual same-owner stale second write rejected | Stale generation and cloud-sync revision rejected |
| Original JPEG identity | Hash stored complete JPEG fixture bytes; re-hash per 3D handoff | No 3D mesh for unverifiable source |
| PR541 3D compatibility | Genuine unchanged donor mode/fallback and separate true donor WebGL evidence | No invented shoe/jacket/rear texture |
| Account privacy | Distinct account IndexedDB, owner+generation lease | Synthetic HTTP auth; **live RLS NOT TESTED** |
| Backup/import | Existing backend document validation, original raw source preservation and conflict marker | **Remote RLS/restore and native import lossless NOT VERIFIED** |
| Mobile screenshots | Actual Chromium/WebKit 320/390/430 originals; SHA manifest + human review | **Physical phones NOT TESTED** |
| App/layout quality | Opt-in panel only; no production CSS changes | Original native page exceeded 320px viewport in early full-page capture (402px), REVIEW |
| Production/Family Alpha | Diff must contain only new research/tests/NO DEPLOY CI | **HOLD** |

### Visual audit of earlier browser evidence (not final-commit release evidence)

One earlier workflow completed **12 original app scenarios, 60 actual Chromium/WebKit PNGs and 12 comparison strips**, with all source/IDB assertions passing; independent manual inspection of the 12 contact sheets found source dress and jacket photographs visible and the remaining original coat/shoes references retained farther down the 320px scrolling layout. 320px full-page capture initially stretched to 402px due native page overflow, so subsequent tests capture exact actual 320px viewport, not falsely report the wider raster as a valid 320px screenshot. Another run rejected the *reporter* for comparing an array of 12 strips with the numeric value 12; this was corrected without relaxing the screenshot count. An additional tightening made original byte-level SHA mandatory before 3D source decisions; an old unit fixture for shoes lacking source SHA was correctly refused rather than mislabeled as verified. The final exact-HEAD CI must be checked separately.

### Remaining HOLD blockers

1. Original native consumer render/load/import/cloud paths remain lossy, unmodified; main controller must integrate a safe read-only preview and guarded write adapter separately.
2. Authentic native token/epoch PR #550 remains unmerged and must be adopted explicitly; tests use scoped fixture epochs, not live Supabase authorization or RLS.
3. Actual backend concurrent restore, multi-device cloud conflict UI, original-owner physical devices and real customer wardrobe photos are not tested here.
4. Clothing whose photos have no verified original SHA or independent 3D fit stays original-photo/2D. PR #549 footwear and other body physics are not duplicated.
5. Original 320px native app horizontal page overflow and visual UX remain REVIEW.
6. Family Alpha HOLD, releaseAuthorized=false, no merge, no deploy, no staging or Supabase modifications, and no Drive Duel or Delta Ebb touches.
