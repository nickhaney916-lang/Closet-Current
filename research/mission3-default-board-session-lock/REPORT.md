# Closet Current Mission 3 — default and research-native Outfit Builder private session cleanup

**Family Alpha #255 stays OPEN/HOLD. Research branch, DRAFT, UNMERGED, NO DEPLOY.**

## Immutable parent and independently verified gap

Parent: [Mission 3 PR #1090](https://github.com/nickhaney916-lang/Closet-Current/pull/1090), exact `e089787f2f4c375662e9d66fbbf6818f98b123c2`, [dedicated no-deploy CI #43532873462 success](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43532873462), **2,006/2,006 Node PASS and 66/66 synthetic Chromium/WebKit private native session-lock cases**.

The production `public/outfit-board.js` `closet:session-locked` handler had been tightened for research-only `?nativeLossless04=research`, but still executed `if(!nativeLossless04Active)return;` for the regular/default consumer experience. Thus last-signed-owner `currentBoard`, `savedOutfitBoards`, private outfit name/season/occasion/size/budget fields, selected clothing photo grids, shopping suggestions, open picker, status, and draft fingerprints could remain in the shared DOM/in-memory module after AUTH36 locked the account. This is a **source-observed possible privacy leak**, not evidence of an actual user data exposure.

A second source-observed asynchronous bug: default startup `outfitBoardReady` read `db.transaction('state').objectStore('state').get('outfit-board')` and wrote its returned old owner's board globally after `await` without checking the original authentication object, owner private DB handle/name, capture epoch, current session validity or authenticated view. In an account-switch or same-ID re-login race, that could undo the lock-time clearing.

## Surgical safety patch

1. On AUTH36 session lock, **both** default and research-native modes synchronously cancel draft timers/status, reset current and saved boards, clear draft fingerprints, reset the picker target, synchronize outfit form values, empty all owned/private preview grids, close the picker, and clear private summary/status/shopping text. The existing research-only controller/3D/source-readiness/Style/mobile disposal is preserved and remains conditional on its explicit native flag.
2. The default startup IDB read captures `beginOwnerBoardUiLease()` and the exact initial `ownerDB`. It verifies the lease **before opening storage**, after the asynchronous read, on error handling and immediately before the final render. Stale signed-owner/DB/epoch/gate continuations return without updating any global board/UI.
3. No sign-out storage transaction or network write occurs. Durable original JPEGs, wardrobe/board CAS, owner correction, private backups, browser storage for each real signed owner, shoe pairing, 2D fallback, and the approved native research security checks remain untouched. No remote/production account accessed.

## Exact reproducible acceptance

- Extend the inherited production-source Node tests in `tests/mission3-native-board-session-lock.test.cjs`: both modes, synchronous content scrubbing, retained IDB source data, independent research-only disposal, repeated locks, signed-owner continuation, and actual extracted default `outfitBoardReady` execution under delayed owner-valid and owner-switched/mismatched-DB/same-ID re-login reads.
- Extend the inherited Chromium/WebKit source-executed browser runner to **102 synthetic scenarios** over 17 modes × 2 engines × 320/390/430 CSS widths; verify private fields, grids, picker, summary, draft fingerprints, and new-owner status remain uncontaminated. Synthetic means no claim of physical Android/iPhone hardware acceptance.
- New pinned-parent exact `e089787f2f4c375662e9d66fbbf6818f98b123c2` five-path no-deploy workflow, all inherited full Node, real-browser/private original photo CAS, signed two-owner disposable PostgreSQL Storage RLS, backup/restore and photo-to-owner-private-2D outfit suites. **Call PASS only after both jobs and receipts pass at the actual tested head.**

## Release limitations

No physical device acceptance, owner-authorized live Supabase/Storage/Cloud, independently human-ground-truthed 10/10 recognition, cross-mission real photographed 3D garments/fabric fitting, or Family Alpha launch. No merge/deploy, hosted cloud mutation, or private wardrobe data read/write. Keep #255 OPEN/HOLD.

## First-run CI diagnosis and source-compatible fixture repair

The initial [exact-head Actions run #43535604082](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43535604082) was **RED** before it reached new browser scenarios. In a newly introduced synthetic VM fixture, two host microtasks were insufficient to let the real extracted `outfitBoardReady` queue the IndexedDB request. The corrected fixture waits on a bounded `setImmediate` event-loop yield until `request.onsuccess` is installed. This neither mocks the production owner lease nor bypasses a failing security assertion. In the inherited `tests/outfit-draft-resilience.test.cjs`, the old isolated fixture executed the source handler without the clean-board/DOM functions it now legitimately invokes in ordinary mode, causing `ReferenceError: cleanOutfitBoard is not defined`. Update that fixture to provide real-form dummy nodes and the expected in-memory clear operation, and strengthen its sign-out assertions. **No production source was changed after the original patch.**

The exact changed path allowlist increases from five to six, adding only the existing `tests/outfit-draft-resilience.test.cjs`. Full Node/browser/regression evidence must be rechecked on the **new exact head**. Do not use the failed first run as green evidence.
