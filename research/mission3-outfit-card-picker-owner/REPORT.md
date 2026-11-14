# Closet Current Mission 3 — exact-owner saved outfit cards and clothing-picker callbacks

**Family Alpha HOLD issue #255 stays OPEN. Research-only draft / NO MERGE / NO DEPLOY / NO hosted Supabase or private wardrobe edits.**

## Verified source baseline

Pinned on [Mission 3 PR #1097](https://github.com/nickhaney916-lang/Closet-Current/pull/1097), immutable head `7a54f5042720fef47ef8249cd26a727580340249`, [two-job all-green no-deploy CI #43536294793](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43536294793), 2,018/2,018 full serial Node and 102/102 Chromium+WebKit default/native session-lock cases passing. Concurrent parallel Mission 3 work [#1100](https://github.com/nickhaney916-lang/Closet-Current/pull/1100) and [#1104](https://github.com/nickhaney916-lang/Closet-Current/pull/1104) addresses distinct Style original-photo async viewer session leases and is not modified here.

## Source-observed risk, not a verified real-user incident

`public/outfit-board.js` renders **normal/default** saved-outfit buttons by capturing `const [index,value] of savedOutfitBoards.entries()`. The old onClick handler unconditionally assigned `currentBoard=cleanOutfitBoard(value,items)` and called `storeBoard()`. `storeBoard()` attests the **currently signed in account** when invoked, not the *originating* account that created the button. A retained or queued prior-owner button could therefore cross a logout/login boundary and try to save an old owner's outfit into a new owner's private draft, even though the sign-out handler clears the current board and DOM. The picker similarly captured original owner `item.id` and selected it on click without an originating auth/DB lease, potentially applying a former owner's photo ID to a later account. The callbacks could survive via queued clicks, detached node references or stale same-owner roster refreshes.

## Surgical patch

- `renderSavedOutfitBoards()` captures `beginOwnerBoardUiLease()` for the login that rendered the private saved card. The default card handler now does nothing unless the initiating exact authenticated session remains current, the card is still connected, and `savedOutfitBoards[index]===value` so it cannot use a replaced list's stale entry. The native research route retains its established native controller owner guards, unchanged.
- `openBoardPicker()` captures an exact owner/auth/DB/epoch/gate lease *before revealing thumbnails*. Its Save/Select garment click requires that same lease, a still-connected button and the exact original wardrobe row object to remain in `items`. An Add clothing link also refuses navigation after old owner session invalidation.
- This is UI-only. Original JPEG bytes, SHA receipts, shoe-pair semantics, source ownership, signed IndexedDB CAS, cloud backup/restore, and 2D fallback unchanged. No private storage writes on sign-out. Family Alpha HOLD #255 unchanged.

## Reproducible acceptance plan

- `tests/mission3-outfit-card-picker-owner-lease.test.cjs`: extract and execute actual production lease, saved cards and picker in a synthetic VM DOM. Test valid owner, different account, same-ID relogin, capture epoch, private DB, revoked auth, hidden gate/shell, detached button, replaced owner saved roster, replaced wardrobe row and Add clothing navigation.
- `scripts/test-mission3-outfit-card-picker-owner-browser.mjs`: **120 planned controlled Chromium+WebKit source scenarios** (20 modes × 2 engines × 3 CSS phone widths 320/390/430), test receipts and screenshots; no claims of physical iPhone/Android, hosted cloud or genuine owner photographs.
- Strict exact-parent five-path no-deploy workflow inherits the complete #1097 serial Node, full signed owner Photo Review/Backup/atomic restore/board, disposable two-owner PostgreSQL/Storage RLS and photographed-to-private-2D outfit browser QA, plus this new Node/browser coverage. **Only declare exact-head green after both jobs complete success and artifacts verified.**

## Blocked release gates

Physical Android Chrome + iPhone Safari signed account acceptance; owner-authorized hosted two-account cloud backup/Storage RLS; independently labeled genuine-photo recognition acceptance; authentic source-photo-derived fitted 3D layers; conflict-aware cross-mission integration; and explicit Family Alpha approval. No deploy or merge.
