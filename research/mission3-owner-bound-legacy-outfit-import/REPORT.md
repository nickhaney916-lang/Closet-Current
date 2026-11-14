# Mission 3 — exact-owner legacy outfit backup import without speculative private UI publication

**Family Alpha HOLD #255 OPEN; isolated research draft, NO MERGE/DEPLOY or production/staging/hosted Supabase/private wardrobe access.**

## Verified parent

Stacked directly on immutable green [PR #1109](https://github.com/nickhaney916-lang/Closet-Current/pull/1109) HEAD `9c7aa28402e5461b000a04dcb93ef7b430b3e69e`, [no-deploy CI #43539067181](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43539067181), 2,043/2,043 full serial Node green and 120/120 new synthetic Chromium/WebKit saved-button/picker checks. Concurrent unrelated Style original-photo [#1104](https://github.com/nickhaney916-lang/Closet-Current/pull/1104) and Mission 4 integration [#1110](https://github.com/nickhaney916-lang/Closet-Current/pull/1110) remain separate.

## Source-observed weakness

`public/outfit-board.js` `importBoardBackup(value)` (legacy v1–v3 backup path, separate from the existing newer atomic/import engine) awaited initial `outfitBoardReady` without an exact originating owner lease, then **assigned** `currentBoard`, `savedOutfitBoards` and synchronized private form fields **before** `persistBoardState({replaceSaved})` committed. It unconditionally called `renderOutfitBoard()` after an awaited storage operation, even if the session had been replaced. Under an expired/switching login, a failed import could leave uncommitted private garment IDs visible; a delayed completion could render the wrong session. This is source-verified potential risk, not a demonstrated real-user incident.

## Focused engineering patch

1. Capture existing `beginOwnerBoardUiLease()` **before** any readiness await. Fail closed on unsigned owner; reject after readiness if auth object, owner ID, exact private DB handle/name, capture epoch, gate or app visibility differs.
2. Prepare `incomingCurrent` and `incomingSaved` as separate cleaned data; do not publish to global saved/current board or DOM until the private transaction successfully commits.
3. Extend `persistBoardState` with optional `replaceCurrent=null`. Its default path remains identical for normal Save/autosave, but explicit import snapshots the proposed current board **inside** the same transaction as the replacement saved roster; this avoids modifying shared UI state before commit and preserves existing CAS and transaction controls.
4. After awaited commit, only an unchanged originating owner can publish/render imported state. A stale session exits silently rather than overwriting a newer owner's draft. Rejected transaction leaves prior board and form untouched. Research-native mode's unsafe legacy restore continues blocked.
5. Original JPEGs, owner SHA-256 source custody, signed PostgreSQL RLS, private backup engine, 2D fallback and all other Mission branches unchanged. No hosted data touched.

## Validation contract

- Source-executed `tests/mission3-owner-bound-legacy-outfit-import.test.cjs`: 18+ synthetic cases covering authorized import, delayed startup, same-ID relogin, owner switch, auth revocation, DB handle and epoch replacement, failed transaction, zero speculative visible writes, post-commit lease, and native block. Actual production lease and import helpers are extracted, not reimplemented.
- `scripts/test-mission3-owner-bound-legacy-outfit-import-browser.mjs`: **108 planned Chromium+WebKit synthetic CSS phone-width scenarios** at 320/390/430, plus screenshots and JSON receipt, no real phones or real hosted accounts.
- Exact-parent five-path no-deploy CI inherits full serial Node, prior 120 saved card/picker, 102 normal/native sign-out, 66 native mount, backup, original JPEG, two-owner disposable PostgreSQL/Storage RLS, and genuine-sourced private 2D outfit integration. **Do not claim new exact-head success until both workflow jobs and evidence pass.**

## Remaining launch requirements

Owner-approved real Android/iPhone Safari; live owner-authorized hosted Auth/Storage/Supabase RLS and backup; independent real-photo human labeled recognition accuracy; licensed real-photo clothing geometry and fitting; conflict-safe cross-mission integration; explicit family-alpha approval. Keep HOLD #255 OPEN.
