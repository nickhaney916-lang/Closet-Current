# Mission 3 — exact owner/session fence for the native Outfit Board's delayed actions

**Family Alpha HOLD #255 remains OPEN.** Research-only branch stacked on [PR #1065](https://github.com/nickhaney916-lang/Closet-Current/pull/1065), pinned green parent SHA `6952312cc8ce37447452143abddc12a60baec729`. No merges or changes to main, production, staging, hosted Supabase, private wardrobes or actual owner photographs.

## Source-verified finding

`public/outfit-board.js` already provides strong owner/DB checks and clothing-version comparisons in the **private IndexedDB transaction** via `persistBoardState`. However, several surrounding UI callbacks did not retain an exact owner/session lease after awaited operations:

- `storeBoard()` rendered saved outfits immediately after awaiting persistence, without verifying the initiating session *at the UI boundary*. It suppressed older status via `boardStatusSerial` but could still re-render the newer signed owner's saved board list.
- The main **Save Outfit** button unconditionally reported success/reenabled itself after awaiting `saveOwnedOutfit`; on wardrobe conflicts it interpolated `error.message` into the live UI.
- **Refresh closet**, **Retry saving draft**, **Load latest draft**, and **Keep my draft** could focus or display errors after the user changed accounts. Load latest asserted auth/DB, but not the capture epoch.
- The deferred typing-save timer displayed an old-account warning into the next session and did not verify the capture epoch or revoked auth before attempting its save.

These are source-observed potential privacy/correctness races, not proven cross-account incidents.

## Implementation

`beginOwnerBoardUiLease()` captures the exact auth object, owner ID, private DB object/name, `captureOperationEpoch`, signed-in gate and current assertion. UI callbacks recheck ownership after each awaited action. Stale completions are ignored instead of re-rendering, changing the newer account's board UI, focusing controls or re-enabling its Save button.

`storeBoard()` retains existing conflict/error semantics and never changes the underlying transaction's clothing CAS; its return value accurately signals a revoked old session. `loadLatestBoardDraft()` adds an epoch check before applying a stored snapshot. The main Save Outfit button shows generic, actionable errors for the original account only. Deferred autosave checks exact epoch/auth and **silently declines** to write the next owner's UI from an old account.

The older nativeLossless04 research-only branch of the Save button is unchanged. Original JPEG bytes/receipts, owner review, local+cloud backup and restore, 2D fallback and all collision safeguards are preserved.

## Reproducible evidence

- `tests/mission3-outfit-board-action-owner-session.test.cjs`: **31 planned** source-executed synthetic cases for Save, queued draft store, refresh, retry, load/latest, keep-local, competing status, wrong DB, logout, same-ID relogin, epoch rotation, revoked auth and safe error messages.
- `scripts/test-mission3-outfit-board-action-owner-browser.mjs`: **114 planned** source-executed Chromium/WebKit synthetic browser cases (19 modes × 2 engines × 3 CSS mobile viewport widths, 320/390/430). This is **not** physical Android or iPhone testing.
- `.github/workflows/mission3-outfit-board-action-owner-session-no-deploy.yml`: seven-path pinned-parent allowlist and syntax checks, focused cases, inherited full serial Node, real browser photographed-garment→private wardrobe→outfit Save/Adjust flow, disposable two-owner PostgreSQL/Storage RLS, evidence receipts. No deploy job.

## Inherited regression failure and fixture reconciliation

First run [#43515844389](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43515844389) caught a syntax mistake in the new synthetic test fixture before that test could run. Run [#43516099059](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43516099059) then passed all 31 focused source tests and all 114 Chromium/WebKit scenarios, **but** inherited full serial Node identified eight failures in `tests/outfit-draft-conflicts.test.cjs` and `tests/outfit-draft-resilience.test.cjs`. Those fixtures previously ran the owner-board code in isolated VM contexts with **no `captureOperationEpoch`**. The latter also had the wrong DB name, no visible auth gate or app shell, and expected a previous owner's timer to display a new-session warning (which is deliberately no longer safe).

Both inherited fixtures are updated to model exact signed owner, actual private DB naming, operation epoch and visible UI, and to require silence from old-owner draft timers. The seven-path strict no-deploy workflow runs the updated legacy tests explicitly, in addition to the unchanged full serial regression. This is test fixture alignment, **not a relaxation of the production session fence**. New exact-head CI must pass before this stacked PR is considered validated.

**Do not mark the final head green until both exact-head jobs pass.** No real-owner, production Supabase, physical phone, genuine photo ground-truth or reconstructed 3D garment acceptance is implied.

## Remaining blockers

Physical Android Chrome/iPhone Safari owner-accepted workflow, authorized live two-account Supabase Auth/RLS/Storage backup/restore, independently reviewed genuine recognition photos, Mission 2 photographed-clothing geometry/texture/drape, cross-mission integration QA, and explicit owner release approval. #255 HOLD must stay OPEN.
