# Mission 3 — bind generated-outfit Save / Adjust / Refresh callbacks to originating signed owner and outfit result

**Family Alpha HOLD #255 stays OPEN.** Research branch stacked on [Mission 3 PR #1059](https://github.com/nickhaney916-lang/Closet-Current/pull/1059), pinned verified HEAD `6f116c8293f4e98ddfb3c71cefc8fc009eec5d98`. No merges or production/staging deployments, hosted Supabase writes, private wardrobes or customer photographs.

## Source-confirmed gap

`public/outfit-board.js` already guards actual owner-private IndexedDB outfit writes with exact auth/DB assertions, clothing-record comparisons inside the transaction, and draft conflict checks. The generated-outfit cards in `public/closet-stylist.js` did **not** bind their own asynchronous **Save outfit**, **Adjust on outfit board**, or **Refresh my closet** callbacks to the original signed owner, result object, roster or parent styling request.

- `save.onclick` waited for `outfitBoardReady`, then used current global items and announced/redisplayed saved outfits after `await saveOwnedOutfit`; errors interpolated `error.message`, which can include private metadata. The old completion could run after an account change or newer outfit-generation request.
- `edit.onclick` waited for `outfitBoardReady`, changed global `currentBoard`, attempted a draft persistence, then navigated to Builder **even if the save failed** and even if the owner/sign-in/view changed during the await.
- `refresh.onclick` awaited an owner-bound roster refresh but could show old private exception strings or manipulate the next owner's control after a delayed rejection.
- `updateSaveState` would call global `renderStyledCollection()` from an obsolete detached card. The attempted re-render could affect the next owner's current screen.

No actual cross-owner data incident is asserted; these are source-based correctness/privacy risks.

## Patch

`beginStyledCollectionCardOwnerLease(result,card)` captures an exact initiating auth object, owner ID, owner-private DB handle, capture epoch, original `styledCollectionRequestSerial`, **exact generated outfit result object**, and **item references and ordering**. Session identity is checked via `assertCurrent`, visible signed-in gate and account isolation.

Callbacks use the lease before and after awaited work. A new session, replaced wardrobe, stale generated result or superseding request cannot publish saved status, re-render saved outfits, change Builder navigation, or print old private errors. Detached old buttons cannot initiate actions. An expected current-owner card detachment after a successful save does not force an unnecessary global re-render.

**Adjust** now checks that `storeBoard()` returned true before navigation and refuses to force Builder if the user left the Stylist view while the draft was saving. Existing transaction-level original-photo and wardrobe protections remain authoritative; the change does not claim to cancel a write already in flight or address unrelated global board action handlers.

**Refresh** displays only generic actionable error text for the same signed owner. No changes to private cloud writer, JWT/RLS, photo receipts, original JPEG bytes, recognition decisions, 3D garment layers or 2D fallback.

## Tests and evidence

1. `tests/mission3-styled-outfit-card-save-adjust-owner-lease.test.cjs`: **25 planned** synthetic Node regression cases executing actual production callback text and lease. Covers legitimate save/edit/refresh, account switches, same-ID relogin, revocation, same-ID item replacement, new requests, delayed save success/failure, detached buttons, generic error strings, board save conflict, user navigation and refresh rehydrate.
2. `scripts/test-mission3-styled-outfit-card-save-adjust-owner-browser.mjs`: **102 planned** synthetic production-source callback cases across Chromium and WebKit at mobile viewport widths 320, 390, 430 CSS px (17 modes × six configurations). Does not represent physical devices or production app.
3. `.github/workflows/mission3-styled-outfit-card-save-adjust-owner-no-deploy.yml`: strict pinned exact-parent five-file allowlist plus focused tests, earlier Mission 3 exact-source and browser checks, full serial Node, native full-app photographed-original → private saved wardrobe → three outfit recommendations → outfit board, and disposable two-owner PostgreSQL/Storage RLS.

**Only claim success when the final exact-head Actions run passes, including browser JSON receipts.** Isolated synthetic cases do not prove physically captured photographs or hosted cloud RLS.

## Blockers for full release

Authorized physical Android Chrome and iPhone Safari capture/restore, genuine photo owner acceptance, hosted Supabase two-owner Auth/RLS/Storage recovery, cross-mission integration including independent recognition evidence and Mission 2 real-photograph garment geometry/drape, and explicit launch approval. Preserve #255 HOLD.
